<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Infinite Heroes - AI Comic Book Generator

Create personalized, infinite comic books with AI-generated stories and artwork. Build your heroes, design worlds, and experience dynamic narratives that adapt to your choices.

## ✨ Features

- 🎨 **AI-Generated Comics** - Create unique comic book pages with AI-generated artwork and narratives
- 🦸 **Character Builder** - Design custom heroes and sidekicks with names, descriptions, and reference images
- 🌍 **World Builder** - Create detailed worlds with up to 3 reference images to guide the story setting
- 📖 **Interactive Stories** - Make choices that influence the narrative direction
- 🌐 **Multi-Language Support** - Generate comics in 15+ languages including English, Spanish, French, German, Japanese, Chinese, and more
- 🎭 **Multiple Genres** - Choose from Classic Horror, Superhero Action, Dark Sci-Fi, High Fantasy, Neon Noir Detective, Wasteland Apocalypse, Comedy, Teen Drama, or create custom stories
- 📱 **Progressive Web App (PWA)** - Install as a native app on desktop and mobile devices
- 💾 **Offline Support** - Service worker caching for offline access to generated content
- 🤖 **Flexible AI Providers** - Supports both Google Gemini and OpenRouter for text and image generation
- 🎛️ **Advanced Model Controls** - Fine-tune AI parameters (temperature, top-p, max tokens) for customized output
- 📄 **PDF Export** - Download your complete comic books as PDF files
- 💾 **Local Storage** - All data stored locally in IndexedDB for privacy and offline access

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher recommended, tested with v20.19.6)
- **npm** (v6 or higher, tested with v10.8.2)
- **Google Gemini API Key** - Get one free at [Google AI Studio](https://aistudio.google.com/app/apikey)
- **OpenRouter API Key** (Optional) - Get one at [OpenRouter](https://openrouter.ai/keys) if you want to use OpenRouter models

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dkylepeppers-alt/Comicbooks-.git
   cd Comicbooks-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *This takes approximately 8 seconds and installs 477 packages*

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and set your API key(s):
   ```env
   # Required for Gemini provider (default)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: For OpenRouter provider
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (port 5173) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run build:termux` | Build optimized for Termux/Android (no minification) |
| `npm run preview` | Preview production build locally (port 4173) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and automatically fix issues |

## 📱 Mobile & Android Support

### Install as PWA (All Platforms)

Infinite Heroes can be installed as a Progressive Web App on any device:

1. Open the app in your browser
2. Look for the install prompt or use the browser's "Install App" option
3. The app will be added to your home screen/app drawer

### Run on Android with Termux

You can run Infinite Heroes directly on Android using Termux - no computer needed!

**Quick Install:**
```bash
bash install-termux.sh
```

**For detailed setup instructions, see:** [TERMUX_SETUP.md](TERMUX_SETUP.md)

Features:
- ✅ Step-by-step installation guide for Termux
- ✅ PWA installation on Android
- ✅ Network access configuration
- ✅ Troubleshooting tips
- ✅ Auto-start on boot setup

## 🎮 How to Use

1. **Launch the app** and enter your API key when prompted (or set it in `.env.local`)
2. **Create your hero** - Upload a reference image and describe your main character
3. **Add a sidekick** (optional) - Create a companion character
4. **Build a world** (optional) - Define the setting with reference images and descriptions
5. **Configure your story:**
   - Choose a genre (or create a custom premise)
   - Select a narrative tone
   - Pick your preferred language
   - Optionally customize AI model settings
6. **Launch** and watch as the AI generates your comic book!
7. **Make choices** at key moments to direct the story
8. **Export** your finished comic as a PDF

## 🧰 Technology Stack

### Core Technologies
- **React 19.2.0** - UI framework with new JSX transform
- **TypeScript 5.9.3** - Type-safe development (strict mode enabled)
- **Vite 7.3.0** - Fast build tool and dev server

### AI & Generation
- **Google Gemini API** (`@google/genai` 1.27.0) - Primary AI provider for text and image generation
  - `gemini-3-flash-preview` - Fast text generation
  - `gemini-3-pro-image-preview` - High-quality image generation
- **OpenRouter SDK** (`@openrouter/sdk` 0.3.11) - Alternative AI provider support

### Storage & Data
- **IndexedDB** (via `idb` 8.0.0) - Local storage for comics, characters, and worlds
- **jsPDF** (3.0.3) - PDF generation for comic exports

### UI & Visualization
- **Recharts** (3.3.0) - Analytics and statistics visualization
- **Tailwind CSS** (via CDN) - Utility-first styling
- **Google Fonts** (Bangers, Comic Neue) - Comic book typography

### Progressive Web App
- **vite-plugin-pwa** (1.2.0) - Service worker and PWA manifest generation
- **Workbox** - Runtime caching and offline support

### Code Quality
- **ESLint** (9.39.2) - Code linting with TypeScript, React, and accessibility plugins
- **Prettier** - Code formatting (via eslint-config-prettier)

## 📂 Project Structure

```
Comicbooks-/
├── components/          # React components
│   ├── CharacterBuilder.tsx    # Character creation UI
│   ├── WorldBuilder.tsx        # World creation UI
│   ├── DirectorInput.tsx       # Story direction input
│   ├── SettingsPanel.tsx       # App settings
│   ├── TopBar.tsx              # Navigation bar
│   └── ...
├── context/            # React Context providers
│   ├── BookContext.tsx         # Comic book state
│   ├── ModelPresetContext.tsx  # AI model configuration
│   └── SettingsContext.tsx     # App settings
├── services/           # Business logic
│   ├── aiService.ts            # Gemini AI integration
│   ├── openRouterService.ts    # OpenRouter integration
│   ├── storage.ts              # IndexedDB operations
│   └── logger.ts               # Logging utilities
├── hooks/              # Custom React hooks
│   ├── useComicEngine.ts       # Comic generation engine
│   └── usePWA.ts               # PWA installation
├── utils/              # Utility functions
│   ├── imageCompression.ts     # Image optimization
│   └── performanceUtils.ts     # Performance helpers
├── public/             # Static assets (icons, PWA files)
├── App.tsx             # Main application component
├── Setup.tsx           # Initial setup screen
├── Book.tsx            # Comic book viewer
├── Panel.tsx           # Individual comic panel
├── types.ts            # TypeScript type definitions
├── vite.config.ts      # Vite configuration
└── .env.local.example  # Environment variables template
```

## ⚙️ Configuration

### AI Model Settings

The app supports advanced configuration of AI models:

- **Provider Selection**: Choose between Gemini and OpenRouter
- **Model Selection**: Pick specific models for text and image generation
- **Temperature**: Control randomness (0.0 = deterministic, 2.0 = very random)
- **Top-P**: Nucleus sampling threshold
- **Max Tokens**: Maximum response length
- **Custom Prompts**: Override default system prompts

### Story Configuration

Customize your comic generation:

- **Genre**: 9 built-in genres or create custom premises
- **Tone**: 6 narrative styles (action-heavy, quippy, operatic, etc.)
- **Language**: Generate comics in 15+ languages
- **Rich Mode**: Enable/disable enhanced visual details

## 🔒 Privacy & Data

- **Local-First**: All comic data, characters, and worlds are stored locally in IndexedDB
- **No Telemetry**: No analytics or tracking
- **API Keys**: Stored securely in localStorage or environment variables
- **Offline Capable**: Service workers cache assets for offline access

## 🐛 Troubleshooting

### API Key Issues

**Problem**: "API_KEY_INVALID" error
**Solution**: 
1. Get a valid API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Copy `.env.local.example` to `.env.local`
3. Set `VITE_GEMINI_API_KEY=your_key` in `.env.local`
4. Restart the dev server

### Port Already in Use

**Problem**: "Port 5173 is already in use"
**Solution**: Use a custom port:
```bash
npm run dev -- --port 8080
```

### Build Chunk Size Warnings

**Problem**: Warnings about chunks >500KB during build
**Solution**: These are expected due to React, AI SDKs, and PDF libraries. Safe to ignore unless specifically optimizing bundle size.

### Termux Build Issues

**Problem**: Build fails on Android/Termux
**Solution**: Use the Termux-specific build configuration:
```bash
npm run build:termux
```

### Image Upload Fails

**Problem**: Image upload errors
**Solution**: 
- Ensure image is <10MB
- Supported formats: JPG, PNG, GIF
- Try compressing the image before upload

### Offline Mode

**Problem**: App shows "OFFLINE MODE" warning
**Solution**: 
- Check internet connection
- The app can view cached comics offline but needs connection for AI generation

## 📄 License

This project is licensed under the Apache 2.0 License. See individual files for license headers.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📚 Additional Documentation

- [TERMUX_SETUP.md](TERMUX_SETUP.md) - Complete Android/Termux installation guide
- [docs/UI_UX_Upgrade_Plan.md](docs/UI_UX_Upgrade_Plan.md) - Future UI enhancement roadmap
- [docs/PERFORMANCE_OPTIMIZATIONS.md](docs/PERFORMANCE_OPTIMIZATIONS.md) - Performance optimization details

## 🔗 Links

- **GitHub Repository**: https://github.com/dkylepeppers-alt/Comicbooks-
- **Google Gemini API**: https://ai.google.dev/
- **OpenRouter**: https://openrouter.ai/
- **Get Gemini API Key**: https://aistudio.google.com/app/apikey

---

Made with ❤️ using React, TypeScript, and AI
