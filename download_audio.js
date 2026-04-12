const fs = require('fs');
const https = require('https');
const path = require('path');

const BGM_URLS = {
  'lobby.mp3': 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_6771e16f7a.mp3', // Dark ambient (replacing possible dead link)
  'night.mp3': 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3', // Suspense/night
  'discussion.mp3': 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_c8bfb73de6.mp3', // Clock ticking suspense
  'vote.mp3': 'https://cdn.pixabay.com/download/audio/2022/04/26/audio_f53ced0814.mp3', // Intense vote
  'elimination.mp3': 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_cbd9bce8fe.mp3' // Boom impact
};

const SFX_URLS = {
  'click.ogg': 'https://raw.githubusercontent.com/KenneyNL/Digital-Audio/master/Audio/click1.ogg',
  'notification.ogg': 'https://raw.githubusercontent.com/KenneyNL/Digital-Audio/master/Audio/powerUp2.ogg',
  'chime.ogg': 'https://raw.githubusercontent.com/KenneyNL/Digital-Audio/master/Audio/pepSound1.ogg',
  'gunshot.ogg': 'https://raw.githubusercontent.com/KenneyNL/Digital-Audio/master/Audio/explosion1.ogg'
};

const BGM_DIR = path.join(__dirname, 'public', 'audio', 'bgm');
const SFX_DIR = path.join(__dirname, 'public', 'audio', 'sfx');

fs.mkdirSync(BGM_DIR, { recursive: true });
fs.mkdirSync(SFX_DIR, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
         return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error('Failed to download ' + url + ' Status: ' + response.statusCode));
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

(async () => {
  console.log('Downloading BGM...');
  for (const [name, url] of Object.entries(BGM_URLS)) {
    try {
      await downloadFile(url, path.join(BGM_DIR, name));
      console.log('✓ ' + name);
    } catch (e) {
      console.error('✗ ' + name, e.message);
    }
  }

  console.log('\nDownloading SFX...');
  for (const [name, url] of Object.entries(SFX_URLS)) {
    try {
      await downloadFile(url, path.join(SFX_DIR, name));
      console.log('✓ ' + name);
    } catch (e) {
      console.error('✗ ' + name, e.message);
    }
  }
})();
