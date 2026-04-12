const fs = require('fs');
const path = require('path');

const SFX_DIR = path.join(__dirname, 'public', 'audio', 'sfx');
fs.mkdirSync(SFX_DIR, { recursive: true });

// Minimal base64 WAV files
const sounds = {
  // A generic UI click sound (short tick)
  'click.wav': 'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAIAAAIA=',
  // A generic chime/notification (higher pitched beep)
  'chime.wav': 'UklGRpAAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcgAAAC/v7+/v7+/v7+/v79/v39/f39/f39/f39/v39/f39/f39/f39/v39/f39/f39/f39/v39/f39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v39/f39/f39/f39/v39/f39/f39/f39/v39/f39/f39/f39/v39/f39/f39/f39/v7+/v7+/v7+/v7+',
  // Gunshot/drum thud (low noise burst - placeholder)
  'gunshot.wav': 'UklGRqAAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYQAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAIAAAACAAAAAgAAAAIAAAACAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAA'
};

for (const [name, b64] of Object.entries(sounds)) {
  fs.writeFileSync(path.join(SFX_DIR, name), Buffer.from(b64, 'base64'));
  console.log(`Created ${name}`);
}
