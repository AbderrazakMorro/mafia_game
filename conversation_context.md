# Mafia Online - Conversation Context Summary

## Objective
Finalize audio management, integrate ad placeholders, create a contact page, and ensure the UI/UX follows the "Cinematic Noir" design system.

## Key Accomplishments

### 1. Audio Management System
*   **Infrastructure**: Created `GlobalAudioProvider` to handle separate volume controls for Music and SFX, persisted via `localStorage`.
*   **UI**: Implemented `AudioSettingsModal` (glassmorphism) accessible via a settings icon in the navigation and game room.
*   **SFX**: Integrated `playSFX` triggers on primary interaction buttons (Join, Host, Settings, Teaser).
*   **Status Alert**: Currently, most audio files in `public/audio/sfx/` and `public/audio/bgm/` appear to be **0 bytes** (except `night.mp3`), which explains why they are not playing.

### 2. Teaser Video Integration
*   **Asset**: Integrated `public/teaser.mp4` in reel format.
*   **Controls**: Enabled full player controls (pause, volume, fullscreen).
*   **Mobile Support**: Added a dedicated "Teaser" button for mobile users to open the video in a modal.
*   **Configuration**: Disabled `autoPlay` as requested to respect user bandwidth and preference.

### 3. Monetization & Layout
*   **Ad Space**: Implemented responsive placeholders for future advertising:
    *   **Right Sidebar**: Dedicated vertical space for desktop users.
    *   **Bottom Banner**: Horizontal placeholder (728x90 style) above the footer.

### 4. New Contact Page
*   **Location**: Created `src/app/contact/page.js`.
*   **Features**: Includes a glassmorphism contact form and a direct email link (`abderrazak.morro@gmail.com`).
*   **Navigation**: Added a "Contact" link in the footer.

### 5. Technical Maintenance
*   **Bug Fixes**: Resolved `ReferenceError: Mail is not defined` during build.
*   **Build & Deploy**: Verified production build success (`npm run build`) and pushed the clean version to GitHub (excluding temporary scripts and large media assets where appropriate).

## Resolved Issues
*   **Audio Fixed**: Ran `generate_audio.js` to create proper PCM-synthesized WAV files for all SFX (click, chime, gunshot, notification) and BGM (lobby, discussion, vote, elimination, night). Updated `useGameAudio.js` and `GlobalAudioProvider.js` to reference local `/audio/bgm/*.wav` and `/audio/sfx/*.wav` files instead of non-existent Pixabay CDN URLs. Cleaned up all 0-byte placeholder files (.mp3, .ogg).
