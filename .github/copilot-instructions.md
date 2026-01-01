# Copilot Coding Agent Instructions for Comicbooks- Repository

## Repository Overview

**Project Name:** Infinite Heroes - AI Comic Book Generator  
**Type:** Progressive Web Application (PWA)  
**Primary Language:** TypeScript/React  
**Framework:** Vite + React 19  
**Target Platforms:** Web browsers, Android (via Termux)  
**Repository Size:** ~47 source files (excluding node_modules and dist)

This repository contains a web application that generates personalized infinite comic books using Google's Gemini AI. The app allows users to create custom comic book stories with AI-generated narratives and images, configured through various genre, tone, and language options.

## Technology Stack

- **Frontend:** React 19.2.0 with TypeScript 5.9.3
- **Build Tool:** Vite 7.3.0
- **AI Integration:** @google/genai 1.27.0 (Google Gemini API)
- **Storage:** IndexedDB via idb 8.0.0
- **PDF Generation:** jsPDF 3.0.3
- **Charts:** Recharts 3.3.0
- **PWA Support:** vite-plugin-pwa 1.2.0
- **Node.js Version:** v20.19.6 (tested)
- **npm Version:** 10.8.2 (tested)

## Essential Build & Development Commands

### Initial Setup

**ALWAYS run these commands in this exact order when setting up the project:**

1. **Install dependencies** (REQUIRED before any other command):
   ```bash
   npm install
   ```
   - Takes approximately 8 seconds
   - Installs 477 packages
   - May show deprecation warnings for `sourcemap-codec`, `source-map`, `node-domexception` - these are safe to ignore

2. **Create environment file** (REQUIRED for the app to function):
   ```bash
   cp .env.local.example .env.local
   ```
   - Edit `.env.local` and set `VITE_GEMINI_API_KEY=your_actual_api_key`
   - Get API key from: https://aistudio.google.com/app/apikey
   - The app will not function without a valid API key

### Development Commands

**Start development server:**
```bash
npm run dev
```
- Starts Vite dev server on `http://localhost:5173`
- Hot module replacement enabled
- Ready in ~200ms
- Server continues running - use Ctrl+C to stop
- PWA service worker is enabled in development mode

**Build for production:**
```bash
npm run build
```
- Builds the application into `dist/` directory
- Takes approximately 3-4 seconds
- Generates optimized bundles with code splitting
- Creates PWA manifest and service worker
- Shows chunk size warnings for bundles >500KB (expected, safe to ignore)
- Output includes: HTML, CSS, JS bundles, PWA assets, and service worker

**Build for Termux (Android):**
```bash
npm run build:termux
```
- Uses `vite.config.termux.ts` configuration
- Disables minification for Termux compatibility
- Same output structure as regular build

**Preview production build:**
```bash
npm run preview
```
- Serves the built `dist/` directory on `http://localhost:4173`
- Requires running `npm run build` first
- Server continues running - use Ctrl+C to stop

### Important Notes

- **No test suite:** This project does not have Jest, Vitest, or any testing framework configured. Do not attempt to run tests.
- **No linting configured:** There are no ESLint, Prettier, or other linting tools configured. Do not attempt to run linters.
- **No CI/CD workflows:** Only Dependabot is configured for dependency updates. No GitHub Actions workflows exist for builds or tests.

## Project Structure & Architecture

### Root Directory Files

```
/home/runner/work/Comicbooks-/Comicbooks-/
├── .env.local.example      # Environment variables template
├── .gitignore             # Git ignore patterns
├── package.json           # Dependencies and scripts
├── package-lock.json      # Dependency lock file
├── tsconfig.json          # TypeScript configuration (strict mode enabled)
├── vite.config.ts         # Vite configuration for standard builds
├── vite.config.termux.ts  # Vite configuration for Termux/Android
├── global.d.ts            # Global TypeScript declarations
├── metadata.json          # App metadata
├── index.html             # HTML entry point (11KB)
├── index.tsx              # React entry point
├── index.css              # Global styles
├── types.ts               # Shared TypeScript types and constants
├── App.tsx                # Main application component
├── Setup.tsx              # Initial setup/configuration screen
├── Book.tsx               # Comic book viewer component
├── Panel.tsx              # Individual comic panel component
├── LoadingFX.tsx          # Loading animation effects
├── ApiKeyDialog.tsx       # API key management dialog
├── useApiKey.ts           # API key management hook
├── install-termux.sh      # Termux installation script
├── README.md              # User-facing documentation
└── TERMUX_SETUP.md        # Android/Termux setup guide
```

### Directory Structure

- **`/components/`** - Reusable React components
  - `DirectorInput.tsx` - User input for story direction
  - `ErrorBoundary.tsx` - Error handling boundary
  - `GlobalLoadingIndicator.tsx` - Global loading state display
  - `NotificationToast.tsx` - Toast notifications
  - `SettingsPanel.tsx` - App settings UI
  - `TopBar.tsx` - Top navigation bar
  - `WorldBuilder.tsx` - World/character creation interface

- **`/context/`** - React Context providers for state management
  - `BookContext.tsx` - Comic book state and actions
  - `ModelPresetContext.tsx` - AI model configuration
  - `SettingsContext.tsx` - Application settings

- **`/services/`** - Business logic and API integrations
  - `aiService.ts` - Gemini AI API integration
  - `logger.ts` - Logging utilities
  - `storage.ts` - IndexedDB storage management

- **`/hooks/`** - Custom React hooks
  - `useComicEngine.ts` - Comic generation engine logic
  - `usePWA.ts` - PWA installation and service worker management

- **`/public/`** - Static assets (icons, favicon, PWA assets)
  - Various icon sizes for PWA support
  - Maskable icons for Android

- **`/docs/`** - Documentation
  - `UI_UX_Upgrade_Plan.md` - Future UI improvement plans

- **`/dist/`** - Build output (generated, not in git)
  - Production-ready static files
  - Service worker and PWA manifest
  - Chunked JavaScript bundles

- **`/node_modules/`** - Dependencies (generated, not in git)

### Key Configuration Files

**`tsconfig.json`:**
- Strict TypeScript mode enabled
- All strict checks enabled (noImplicitAny, strictNullChecks, etc.)
- React JSX support
- Path alias: `@/*` maps to `./*`
- No emit mode (Vite handles compilation)

**`vite.config.ts`:**
- React plugin enabled
- PWA plugin configured with auto-update
- Service worker precaches: JS, CSS, HTML, icons, SVG
- Runtime caching for CDNs (Tailwind CSS, Google Fonts)
- Standalone PWA with portrait orientation

**`vite.config.termux.ts`:**
- Same as above but with minification disabled
- Development mode for service worker
- Optimized for Termux/Android compatibility

**`.env.local` (must be created):**
- `VITE_GEMINI_API_KEY` - Required Gemini API key
- Optional: `PORT` and `HOST` configuration

### Important Type Definitions (types.ts)

```typescript
MAX_STORY_PAGES = 10
BACK_COVER_PAGE = 11
TOTAL_PAGES = 11
INITIAL_PAGES = 2
BATCH_SIZE = 2

TIMEOUT_CONFIG = {
  PERSONA_GENERATION: 60000,    // 60s for character generation
  BEAT_GENERATION: 45000,       // 45s for narrative generation
  IMAGE_GENERATION: 90000,      // 90s for image generation
  DEFAULT: 30000                // 30s default
}
```

Supported genres: Classic Horror, Superhero Action, Dark Sci-Fi, High Fantasy, Neon Noir Detective, Wasteland Apocalypse, Lighthearted Comedy, Teen Drama, Custom

Supported languages: 15 languages including English, Spanish, French, German, Japanese, Chinese, Hindi, Arabic, and more

## Common Issues & Workarounds

### Environment Setup

1. **Missing API Key Error:**
   - Symptom: App shows API key dialog on startup
   - Solution: Create `.env.local` with `VITE_GEMINI_API_KEY=your_key`
   - The app stores validated keys in IndexedDB after first use

2. **Port Already in Use:**
   - Symptom: `Error: Port 5173 is already in use`
   - Solution: Either kill the existing process or use a custom port:
     ```bash
     npm run dev -- --port 8080
     ```

3. **Build Warnings About Chunk Size:**
   - Symptom: Warning about chunks >500KB after minification
   - Workaround: This is expected due to React, Gemini SDK, and jsPDF
   - Safe to ignore - consider dynamic imports only if specifically addressing bundle size

### Termux/Android Specific

1. **Always use `npm run build:termux` for Termux builds**
   - Regular builds may fail due to minification issues
   - The Termux config disables minification and uses development mode for service workers

2. **Storage Permissions:**
   - Run `termux-setup-storage` before first use
   - Grant storage permission when prompted

3. **Node.js on Termux:**
   - Install with: `pkg install -y nodejs`
   - Verify with: `node --version` (should be v14+)

## Development Guidelines

### When Making Code Changes

1. **TypeScript Strict Mode:** All code must pass strict type checking. The tsconfig has all strict flags enabled.

2. **React 19:** This project uses React 19 with the new JSX transform. Be aware of breaking changes from React 18.

3. **Environment Variables:** Always prefix with `VITE_` to expose to the client. Access via `import.meta.env.VITE_*`

4. **Storage:** Use the storage service (`services/storage.ts`) for IndexedDB operations. Don't directly access IndexedDB.

5. **AI Service:** Use `services/aiService.ts` for all Gemini API calls. It handles timeouts and error handling.

6. **Context Usage:** 
   - Use `useBook()` for comic state management
   - Use settings context for app configuration
   - Use model preset context for AI parameters

### File Modifications

- **Main entry point:** `index.tsx` bootstraps React
- **App shell:** `App.tsx` contains providers and main routing logic
- **Comic viewer:** `Book.tsx` handles page navigation and display
- **Initial setup:** `Setup.tsx` for first-time user configuration
- **Types:** Add shared types to `types.ts`, component-specific types inline

### Asset Management

- **Icons/Images:** Place in `/public/` directory
- **PWA Assets:** Update `vite.config.ts` manifest section
- **Static Files:** Reference from `/public/` using absolute paths (e.g., `/icon.svg`)

## Validation Steps

Before finalizing any code changes:

1. **Install dependencies:** `npm install` (if package.json changed)
2. **Build check:** `npm run build` should complete without errors
3. **TypeScript check:** Build will fail if TypeScript errors exist
4. **Dev server check:** `npm run dev` should start successfully
5. **Manual testing:** Actually open `http://localhost:5173` and test the feature
6. **Build artifacts:** Verify `dist/` directory contains expected files

## Dependency Management

- **Adding dependencies:** Use `npm install package-name`
- **Dependabot:** Configured for weekly npm updates on Mondays
- **Package ecosystem:** npm only
- **Lock file:** Always commit `package-lock.json` changes

## Performance Considerations

1. **Lazy Loading:** The codebase uses React.lazy() for route-based code splitting where appropriate
2. **Memoization:** Use React.memo() and useMemo() for expensive computations
3. **IndexedDB:** All persistent data goes through IndexedDB (books, settings, cached images)
4. **Service Worker:** Caches static assets and CDN resources for offline support
5. **Image Generation:** Can be slow (90s timeout) - always show loading indicators

## Trust These Instructions

**Important:** The commands and sequences documented here have been validated and tested. Only search for additional information if:
- The instructions are incomplete for your specific task
- You encounter an error not documented here
- The documented behavior differs from what you observe

For standard build, development, and validation tasks, follow these instructions exactly as written to minimize exploration time and command failures.

## Additional Resources

- **README.md:** User-facing setup and deployment instructions
- **TERMUX_SETUP.md:** Complete Android/Termux installation guide
- **docs/UI_UX_Upgrade_Plan.md:** Future UI enhancement roadmap
- **Gemini API Docs:** https://ai.google.dev/docs
- **Vite Documentation:** https://vitejs.dev/
- **React 19 Docs:** https://react.dev/

## Summary

This is a TypeScript/React PWA using Vite for building and Gemini AI for content generation. It has no test suite or linting configured. Always run `npm install` first, create `.env.local` with an API key, then use `npm run dev` for development or `npm run build` for production. The build takes 3-4 seconds and outputs to `dist/`. TypeScript strict mode is enforced. The app works offline via service workers and can run on Android through Termux.
