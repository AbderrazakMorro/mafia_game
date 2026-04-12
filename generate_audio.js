/**
 * Generate real WAV audio files for Mafia Online SFX & BGM
 * Uses raw PCM synthesis — no external downloads needed.
 */
const fs = require('fs');
const path = require('path');

const SFX_DIR = path.join(__dirname, 'public', 'audio', 'sfx');
const BGM_DIR = path.join(__dirname, 'public', 'audio', 'bgm');
fs.mkdirSync(SFX_DIR, { recursive: true });
fs.mkdirSync(BGM_DIR, { recursive: true });

const SAMPLE_RATE = 44100;

// ── WAV Header Builder ──
function buildWav(samples) {
    const numSamples = samples.length;
    const byteRate = SAMPLE_RATE * 2; // 16-bit mono
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);       // chunk size
    buffer.writeUInt16LE(1, 20);        // PCM
    buffer.writeUInt16LE(1, 22);        // mono
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(2, 32);        // block align
    buffer.writeUInt16LE(16, 34);       // bits per sample

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
        const val = Math.max(-1, Math.min(1, samples[i]));
        buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2);
    }
    return buffer;
}

// ── Sound Generators ──

function generateClick() {
    const duration = 0.08;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        const env = Math.exp(-t * 80);
        samples[i] = env * (
            0.6 * Math.sin(2 * Math.PI * 1800 * t) +
            0.4 * Math.sin(2 * Math.PI * 3200 * t)
        );
    }
    return buildWav(samples);
}

function generateChime() {
    const duration = 0.6;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        const env = Math.exp(-t * 4);
        let val = 0;
        for (const f of freqs) {
            val += Math.sin(2 * Math.PI * f * t);
        }
        samples[i] = env * val / freqs.length * 0.8;
    }
    return buildWav(samples);
}

function generateGunshot() {
    const duration = 0.5;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        // Initial burst of noise
        const noiseEnv = Math.exp(-t * 30);
        const noise = (Math.random() * 2 - 1) * noiseEnv;
        // Low boom
        const boomEnv = Math.exp(-t * 8);
        const boom = Math.sin(2 * Math.PI * 60 * t) * boomEnv;
        // Crack
        const crackEnv = Math.exp(-t * 50);
        const crack = Math.sin(2 * Math.PI * 2000 * t) * crackEnv * 0.3;
        samples[i] = (noise * 0.5 + boom * 0.8 + crack) * 0.9;
    }
    return buildWav(samples);
}

function generateNotification() {
    const duration = 0.4;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        const freq = t < 0.15 ? 880 : 1108.73; // A5 then C#6
        const env = Math.exp(-t * 5) * (1 - Math.exp(-t * 200));
        samples[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.7;
    }
    return buildWav(samples);
}

// ── BGM Generators (longer ambient loops) ──

function generateLobbyBGM() {
    const duration = 16; // 16 seconds loop
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    // Dark ambient pad with slow evolving tones
    const baseFreqs = [55, 82.41, 110, 146.83]; // A1, E2, A2, D3
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        let val = 0;
        for (let j = 0; j < baseFreqs.length; j++) {
            const lfo = 1 + 0.003 * Math.sin(2 * Math.PI * (0.1 + j * 0.05) * t);
            val += Math.sin(2 * Math.PI * baseFreqs[j] * lfo * t) * (0.2 + 0.05 * Math.sin(2 * Math.PI * 0.2 * t));
        }
        // subtle deep pulse
        val += Math.sin(2 * Math.PI * 40 * t) * 0.08 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t));
        // fade in/out for seamless loop
        const fadeIn = Math.min(1, t / 2);
        const fadeOut = Math.min(1, (duration - t) / 2);
        samples[i] = val / baseFreqs.length * 0.6 * fadeIn * fadeOut;
    }
    return buildWav(samples);
}

function generateDiscussionBGM() {
    const duration = 12;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    // Ticking clock + tense pad
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        // Clock tick every 0.5s
        const tickPhase = t % 0.5;
        const tick = tickPhase < 0.01 ? Math.exp(-tickPhase * 500) * 0.4 : 0;
        // Tension drone
        const drone = Math.sin(2 * Math.PI * 73.42 * t) * 0.12 + // D2
                       Math.sin(2 * Math.PI * 110 * t) * 0.08;   // A2
        // Rising tension LFO
        const tension = Math.sin(2 * Math.PI * 220 * t) * 0.04 * (t / duration);
        const fadeIn = Math.min(1, t / 1.5);
        const fadeOut = Math.min(1, (duration - t) / 1.5);
        samples[i] = (tick + drone + tension) * fadeIn * fadeOut;
    }
    return buildWav(samples);
}

function generateVoteBGM() {
    const duration = 10;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    // Intense pulsing suspense
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        // Heartbeat-like pulse (increasing tempo)
        const bpm = 80 + 40 * (t / duration);
        const beatFreq = bpm / 60;
        const beatPhase = (t * beatFreq) % 1;
        const heartbeat = beatPhase < 0.08 ? Math.sin(2 * Math.PI * 55 * t) * Math.exp(-beatPhase * 40) * 0.5 : 0;
        // Strings-like pad
        const pad = Math.sin(2 * Math.PI * 146.83 * t) * 0.08 +  // D3
                    Math.sin(2 * Math.PI * 196 * t) * 0.06 +      // G3
                    Math.sin(2 * Math.PI * 246.94 * t) * 0.05;    // B3
        const fadeIn = Math.min(1, t / 1);
        const fadeOut = Math.min(1, (duration - t) / 1);
        samples[i] = (heartbeat + pad) * fadeIn * fadeOut;
    }
    return buildWav(samples);
}

function generateEliminationBGM() {
    const duration = 4;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    // Dark impact + decay
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        // Impact boom
        const boom = Math.sin(2 * Math.PI * 35 * t) * Math.exp(-t * 2) * 0.8;
        // Metallic ring
        const ring = Math.sin(2 * Math.PI * 280 * t) * Math.exp(-t * 3) * 0.2;
        // Noise burst
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 10) * 0.3;
        // Eerie fade
        const eerie = Math.sin(2 * Math.PI * 196 * t) * Math.exp(-t * 0.8) * 0.1 * Math.sin(2 * Math.PI * 3 * t);
        const fadeOut = Math.min(1, (duration - t) / 0.5);
        samples[i] = (boom + ring + noise + eerie) * fadeOut;
    }
    return buildWav(samples);
}

function generateNightBGM() {
    const duration = 20;
    const n = Math.floor(SAMPLE_RATE * duration);
    const samples = new Float64Array(n);
    // Eerie night ambience
    for (let i = 0; i < n; i++) {
        const t = i / SAMPLE_RATE;
        // Deep drone
        const drone = Math.sin(2 * Math.PI * 41.2 * t) * 0.15; // E1
        // Slow evolving whisper-like tones
        const whisper1 = Math.sin(2 * Math.PI * 185 * t * (1 + 0.005 * Math.sin(2 * Math.PI * 0.08 * t))) * 0.04;
        const whisper2 = Math.sin(2 * Math.PI * 277 * t * (1 + 0.003 * Math.sin(2 * Math.PI * 0.12 * t))) * 0.03;
        // Wind-like noise (filtered)
        const windRand = Math.random() * 2 - 1;
        const windEnv = 0.02 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.15 * t));
        // Occasional chime
        const chimeT = t % 5;
        const chime = chimeT < 0.3 ? Math.sin(2 * Math.PI * 830 * t) * Math.exp(-chimeT * 10) * 0.03 : 0;
        const fadeIn = Math.min(1, t / 3);
        const fadeOut = Math.min(1, (duration - t) / 3);
        samples[i] = (drone + whisper1 + whisper2 + windRand * windEnv + chime) * fadeIn * fadeOut;
    }
    return buildWav(samples);
}

// ── Write Files ──
console.log('🎵 Generating SFX...');
const sfxFiles = {
    'click.wav': generateClick(),
    'chime.wav': generateChime(),
    'gunshot.wav': generateGunshot(),
    'notification.wav': generateNotification(),
};

for (const [name, buf] of Object.entries(sfxFiles)) {
    const dest = path.join(SFX_DIR, name);
    fs.writeFileSync(dest, buf);
    console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log('\n🎶 Generating BGM...');
const bgmFiles = {
    'lobby.wav': generateLobbyBGM(),
    'discussion.wav': generateDiscussionBGM(),
    'vote.wav': generateVoteBGM(),
    'elimination.wav': generateEliminationBGM(),
    'night.wav': generateNightBGM(),
};

for (const [name, buf] of Object.entries(bgmFiles)) {
    const dest = path.join(BGM_DIR, name);
    fs.writeFileSync(dest, buf);
    console.log(`  ✓ ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

// Clean up old empty files
console.log('\n🧹 Cleaning up empty placeholder files...');
for (const dir of [SFX_DIR, BGM_DIR]) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.size === 0) {
            fs.unlinkSync(fullPath);
            console.log(`  ✗ Removed empty: ${file}`);
        }
    }
}

console.log('\n✅ All audio assets generated successfully!');
