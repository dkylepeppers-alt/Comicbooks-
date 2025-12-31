#!/data/data/com.termux/files/usr/bin/bash

# Termux Installation Script for Infinite Heroes Comic Book App
# This script sets up the web app to run on Android via Termux

echo "========================================="
echo "Infinite Heroes - Termux Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo -e "${RED}Error: This script must be run in Termux on Android${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating package lists...${NC}"
pkg update -y

echo ""
echo -e "${YELLOW}Step 2: Installing required packages...${NC}"

# Check and install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    pkg install -y nodejs
else
    echo -e "${GREEN}Node.js is already installed ($(node --version))${NC}"
fi

# Check and install Git (if not present)
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    pkg install -y git
else
    echo -e "${GREEN}Git is already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Setting up storage access...${NC}"
echo "This allows the app to access your device storage."
echo "Please grant storage permission when prompted."
termux-setup-storage

echo ""
echo -e "${YELLOW}Step 4: Installing app dependencies...${NC}"
npm install

echo ""
echo -e "${YELLOW}Step 5: Setting up environment variables...${NC}"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Gemini API Key
# Get your API key from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_api_key_here

# Optional: Set custom port (default is 5173)
# PORT=8080
EOF
    echo -e "${GREEN}Created .env.local file${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env.local and add your Gemini API key${NC}"
else
    echo -e "${GREEN}.env.local already exists${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add your Gemini API key:"
echo "   nano .env.local"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open the URL shown in your Android browser"
echo "   (Usually: http://localhost:5173)"
echo ""
echo "4. To install as PWA:"
echo "   - Open the app in Chrome/Edge/Firefox"
echo "   - Tap the menu (⋮) and select 'Install app' or 'Add to Home Screen'"
echo ""
echo "Tips:"
echo "- Keep Termux running in the background"
echo "- Use 'Ctrl+C' to stop the server"
echo "- Access from other devices using your phone's IP address"
echo ""
echo -e "${YELLOW}Happy comic book creating! 🦸${NC}"
echo ""
