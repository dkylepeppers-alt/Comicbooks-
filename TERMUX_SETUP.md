# 📱 Installing Infinite Heroes on Android with Termux

This guide will help you install and run the Infinite Heroes comic book app on your Android device using Termux.

## 🚀 Quick Start

### Prerequisites

1. **Install Termux** from F-Droid (recommended) or Google Play
   - F-Droid: https://f-droid.org/en/packages/com.termux/
   - Google Play: https://play.google.com/store/apps/details?id=com.termux

2. **Install Termux:API** (optional, for better integration)
   - Available on F-Droid and Google Play

### One-Line Installation

Open Termux and run:

```bash
pkg update && pkg install -y git && git clone <your-repo-url> && cd Comicbooks- && bash install-termux.sh
```

Or if you already have the repository:

```bash
cd Comicbooks-
bash install-termux.sh
```

### Manual Installation

If you prefer to install step-by-step:

#### 1. Update Termux Packages

```bash
pkg update && pkg upgrade -y
```

#### 2. Install Node.js

```bash
pkg install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

#### 3. Setup Storage Access

```bash
termux-setup-storage
```

Grant the storage permission when prompted. This allows the app to save data.

#### 4. Clone or Navigate to the Repository

```bash
cd ~/storage/shared
git clone <your-repo-url>
cd Comicbooks-
```

#### 5. Install Dependencies

```bash
npm install
```

#### 6. Configure Environment

Create a `.env.local` file:

```bash
nano .env.local
```

Add your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

Save and exit (Ctrl+X, then Y, then Enter)

#### 7. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5173` (or another port if 5173 is busy)

## 🌐 Accessing the App

### On the Same Device

1. Look for the Local URL in the terminal output (e.g., `http://localhost:5173`)
2. Open Chrome, Firefox, or Edge on your Android device
3. Enter the URL in the address bar
4. The app should load!

### From Another Device on the Same Network

1. Find your Android device's IP address:
   ```bash
   ifconfig wlan0
   ```
   Look for `inet addr` (e.g., `192.168.1.100`)

2. On another device, open a browser and go to:
   ```
   http://YOUR_PHONE_IP:5173
   ```
   (Replace `YOUR_PHONE_IP` with your actual IP address)

## 📲 Installing as a Progressive Web App (PWA)

Once the app is running in your browser:

### Chrome / Edge
1. Tap the menu button (⋮) in the top-right corner
2. Select **"Install app"** or **"Add to Home Screen"**
3. Confirm the installation
4. The app will appear on your home screen like a native app!

### Firefox
1. Tap the menu button (⋮)
2. Select **"Install"**
3. Confirm

### Benefits of PWA Installation
- ✅ Works offline (once cached)
- ✅ Faster loading
- ✅ Home screen icon
- ✅ Full-screen experience
- ✅ No browser UI

## ⚙️ Configuration Options

### Custom Port

If port 5173 is already in use, you can specify a custom port:

1. Edit `package.json`:
   ```bash
   nano package.json
   ```

2. Change the dev script:
   ```json
   "dev": "vite --port 8080"
   ```

3. Or set it in `.env.local`:
   ```env
   PORT=8080
   ```

### Network Access

To allow access from other devices, Vite automatically binds to `0.0.0.0`. If you need to explicitly set this:

```json
"dev": "vite --host 0.0.0.0"
```

## 🔧 Troubleshooting

### App Won't Start

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be v14 or higher

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

3. **Check for port conflicts:**
   ```bash
   lsof -i :5173
   ```

### Can't Access from Browser

1. **Check if server is running:**
   - Look for "Local: http://localhost:5173" in terminal

2. **Try different URLs:**
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - Your device's IP address

3. **Check firewall:**
   Termux usually doesn't need special firewall configuration on Android

### Storage Permission Issues

```bash
termux-setup-storage
```

If this doesn't work, manually grant storage permission:
- Android Settings → Apps → Termux → Permissions → Storage

### Out of Memory

If you get memory errors:

```bash
export NODE_OPTIONS="--max-old-space-size=2048"
npm run dev
```

## 🎯 Usage Tips

### Keep Termux Running

- **Acquire wake lock:** Open Termux notification and tap "ACQUIRE WAKELOCK"
- This prevents Android from killing the app when screen is off

### Run in Background

Install `termux-services` for better background support:

```bash
pkg install -y termux-services
```

### Auto-Start on Boot (Advanced)

1. Install Termux:Boot from F-Droid
2. Create start script:
   ```bash
   mkdir -p ~/.termux/boot
   nano ~/.termux/boot/start-heroes.sh
   ```

3. Add:
   ```bash
   #!/data/data/com.termux/files/usr/bin/bash
   cd ~/storage/shared/Comicbooks-
   npm run dev
   ```

4. Make executable:
   ```bash
   chmod +x ~/.termux/boot/start-heroes.sh
   ```

### Using with External Keyboard

Common shortcuts in Termux:
- **Ctrl+C**: Stop the server
- **Ctrl+Z**: Suspend process
- **Ctrl+D**: Exit terminal
- **Volume Down + C**: Copy
- **Volume Down + V**: Paste

## 📚 Additional Resources

- **Termux Wiki:** https://wiki.termux.com/
- **Vite Documentation:** https://vitejs.dev/
- **Gemini API Docs:** https://ai.google.dev/docs

## ❓ Common Questions

**Q: Can I use this without internet?**
A: After installing as a PWA and loading it once, basic functionality works offline. However, AI features require internet to connect to the Gemini API.

**Q: Will this drain my battery?**
A: Running a development server does use battery. For production use, consider building and deploying to a proper hosting service.

**Q: Can I access this from my laptop?**
A: Yes! As long as both devices are on the same WiFi network, use your phone's IP address.

**Q: How do I stop the server?**
A: Press `Ctrl+C` in the Termux terminal.

**Q: How do I update the app?**
A: Pull the latest changes and reinstall:
```bash
git pull
npm install
npm run dev
```

## 🆘 Getting Help

If you encounter issues:

1. Check the terminal output for error messages
2. Ensure your Gemini API key is correct in `.env.local`
3. Try restarting Termux
4. Create an issue on GitHub with:
   - Your Android version
   - Termux version
   - Node.js version
   - Error messages

---

**Happy comic book creating! 🦸‍♂️🦸‍♀️**
