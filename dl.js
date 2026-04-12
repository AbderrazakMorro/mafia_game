const fs = require('fs');
const https = require('https');
const path = require('path');

const SFX_URLS = {
  'click.mp3': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Click_sound.ogg',
  'notification.mp3': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Pling.ogg',
  'gunshot.mp3': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Handgun.ogg',
  'chime.mp3': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Electronic_chime.ogg'
};

const SFX_DIR = path.join(__dirname, 'public', 'audio', 'sfx');
fs.mkdirSync(SFX_DIR, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
         return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) return reject(new Error(response.statusCode));
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => fs.unlink(dest, () => reject(err)));
  });
}

(async () => {
  for (const [name, url] of Object.entries(SFX_URLS)) {
    try {
      await downloadFile(url, path.join(SFX_DIR, name));
      console.log('✓ ' + name);
    } catch (e) {
      console.error('✗ ' + name, e);
    }
  }
})();
