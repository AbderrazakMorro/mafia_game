/**
 * generate_bgm.js
 * Synthesizes suspenseful background music for the Mafia Online waiting room.
 * Produces:  public/audio/bgm/waiting_room.wav
 *
 * Technique:
 *  - Low drone: 55 Hz (bass A1), modulated slowly for tension
 *  - Secondary drone: 58.27 Hz (A#1) creating a beating dissonance
 *  - Slow heartbeat pulse: two thumps every ~2 seconds (BD-like)
 *  - High tremolo string pad: 220 Hz (A3) with vibrato and tremolo
 *  - Noise swells that rise and fall every 8 seconds
 *  - All mixed together at 44100 Hz / 16-bit mono, 60 seconds looping
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const DURATION_S = 60; // 60-second loop

const BGM_DIR = path.join(__dirname, 'public', 'audio', 'bgm');
fs.mkdirSync(BGM_DIR, { recursive: true });

const numSamples = SAMPLE_RATE * DURATION_S;
const buffer = Buffer.alloc(numSamples * 2); // 2 bytes per sample (16-bit)

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Write a single 16-bit sample to buffer */
function writeSample(i, value) {
    const clamped = clamp(value, -1, 1);
    const int16 = Math.round(clamped * 32767);
    buffer.writeInt16LE(int16, i * 2);
}

// ─── Synthesis ───────────────────────────────────────────────────────────────

// Precompute LFO values
function lfo(t, freq, phase = 0) {
    return Math.sin(2 * Math.PI * freq * t + phase);
}

// Simple white noise (seeded-style pseudo-random for reproduceability)
let noiseSeed = 12345;
function pseudoNoise() {
    noiseSeed = (noiseSeed * 1664525 + 1013904223) & 0xffffffff;
    return ((noiseSeed & 0x7fffffff) / 0x7fffffff) * 2 - 1;
}

// Heartbeat envelope: two short thumps per beat_period
// thump1 at offset 0, thump2 at offset 0.15s inside the period
const BEAT_PERIOD = 1.9; // beats per ~1.9s → ~63 BPM — slow and ominous
const THUMP_DECAY = 0.08; // how quickly each thump fades (seconds)
const THUMP2_OFFSET = 0.18; // second "dub" hit inside a beat

function heartbeatAmp(t) {
    const phase = t % BEAT_PERIOD;
    const env1 = Math.exp(-phase / THUMP_DECAY); // first thump
    const phase2 = Math.max(0, phase - THUMP2_OFFSET);
    const env2 = Math.exp(-phase2 / (THUMP_DECAY * 0.7)) * 0.7; // second thump (softer)
    return Math.max(env1, env2);
}

// Low-pass 1-pole IIR (for noise filter)
let lpState = 0;
function lowPassSample(x, alpha) {
    lpState = lpState + alpha * (x - lpState);
    return lpState;
}

for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // ── 1. Bass drone (55 Hz) with slow AM modulation ──────────────────────
    const droneFreq1 = 55.0;
    const droneAM = 0.5 + 0.5 * lfo(t, 0.07); // very slow 0.07 Hz pulse
    const drone1 = Math.sin(2 * Math.PI * droneFreq1 * t) * droneAM * 0.30;

    // ── 2. Dissonant drone (58.27 Hz — minor 2nd above) ────────────────────
    const droneFreq2 = 58.27;
    const drone2 = Math.sin(2 * Math.PI * droneFreq2 * t) * 0.18;

    // ── 3. String pad (A3 = 220Hz + 5th at 330Hz) with tremolo & vibrato ──
    const vibratoAmount = 3.0; // Hz swing
    const vibratoRate = 4.5;   // Hz
    const vibrato = vibratoAmount * lfo(t, vibratoRate);
    const padFreq = 220 + vibrato;
    const padFreq5 = 330 + vibrato * 1.5;
    const tremuloRate = 5.2;
    const tremulo = 0.5 + 0.5 * lfo(t, tremuloRate, Math.PI * 0.3);
    const stringPad = (
        Math.sin(2 * Math.PI * padFreq * t) * 0.55 +
        Math.sin(2 * Math.PI * padFreq5 * t) * 0.3
    ) * tremulo;

    // Slow swell envelope for the string pad (rises over 8s, fades over 6s)
    const swellPeriod = 14;
    const swellPhase = (t % swellPeriod) / swellPeriod;
    const swellEnv = swellPhase < 0.57
        ? Math.pow(swellPhase / 0.57, 2.0)  // attack
        : Math.pow((1 - swellPhase) / 0.43, 1.5); // release
    const padAmp = 0.18 * swellEnv;

    // ── 4. Heartbeat (filtered noise thump) ────────────────────────────────
    const rawNoise = pseudoNoise();
    const filteredNoise = lowPassSample(rawNoise, 0.08); // heavy LP → warm thud
    const hbEnv = heartbeatAmp(t);
    const heartbeat = filteredNoise * hbEnv * 0.55;

    // ── 5. High tension noise swell (very subtle air / breath) ─────────────
    const breathPeriod = 8.5;
    const breathPhase = (t % breathPeriod) / breathPeriod;
    const breathEnv = Math.sin(Math.PI * breathPhase); // simple half-sine
    const breathNoise = pseudoNoise() * breathEnv * 0.04;

    // ── 6. Sub-bass rumble (27.5 Hz infra) ─────────────────────────────────
    const subBass = Math.sin(2 * Math.PI * 27.5 * t) * 0.12;

    // ── Mix ────────────────────────────────────────────────────────────────
    let sample = drone1 + drone2 + (stringPad * padAmp) + heartbeat + breathNoise + subBass;

    // Master limiter (soft clip using tanh)
    sample = Math.tanh(sample * 1.4) * 0.80;

    writeSample(i, sample);
}

// ─── WAV header ─────────────────────────────────────────────────────────────

function buildWAV(pcmBuffer) {
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);              // subchunk1 size
    header.writeUInt16LE(1, 20);               // PCM
    header.writeUInt16LE(NUM_CHANNELS, 22);
    header.writeUInt32LE(SAMPLE_RATE, 24);
    header.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BITS_PER_SAMPLE / 8, 28);
    header.writeUInt16LE(NUM_CHANNELS * BITS_PER_SAMPLE / 8, 32);
    header.writeUInt16LE(BITS_PER_SAMPLE, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcmBuffer]);
}

const wavData = buildWAV(buffer);
const outPath = path.join(BGM_DIR, 'waiting_room.wav');
fs.writeFileSync(outPath, wavData);

const sizeMB = (wavData.length / 1024 / 1024).toFixed(2);
console.log(`✅  Created: ${outPath}  (${sizeMB} MB, ${DURATION_S}s)`);
