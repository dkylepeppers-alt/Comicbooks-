<div align="center">
  <img width="1200" height="475" alt="Comic Books banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Comic Books+

Create localized, personalized comic books powered by Google Gemini. Upload or describe your heroes and sidekicks, tune the setting, and generate a fully illustrated story that can be saved to your local library or installed as a progressive web app.

## Features
- 🦸‍♀️ Build characters with uploaded images and custom bios for both hero and sidekick.
- 🌍 Configure genre, language, tone, pacing, and worlds to craft unique stories.
- 📚 Save, reload, and manage characters and worlds from a local library for quick reuse.
- 📲 Installable PWA experience with offline-friendly behavior and reconnect prompts.
- 🛠️ Built with Vite + React, Gemini API, and IndexedDB storage helpers.

## Prerequisites
- [Node.js](https://nodejs.org/) 20 or later
- A Google Gemini API key

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root and set your Gemini key:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the local URL printed in the terminal to launch the app.

## Production Builds
- Create an optimized build:
  ```bash
  npm run build
  ```
- Preview the production bundle locally:
  ```bash
  npm run preview
  ```

## 📱 Run on Android with Termux
You can run this app directly on your Android device using Termux.

**Quick Install:**
```bash
bash install-termux.sh
```

**For detailed instructions, see:** [TERMUX_SETUP.md](TERMUX_SETUP.md)

This includes:
- ✅ Step-by-step installation guide
- ✅ PWA installation instructions
- ✅ Network access configuration
- ✅ Troubleshooting tips
- ✅ Auto-start on boot setup
