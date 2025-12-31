# Infinite Heroes - Major Upgrade Plan

**Version:** 1.0
**Date:** December 31, 2025
**Target Completion:** Q1 2026
**Status:** Planning Phase

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Upgrade Phases](#upgrade-phases)
3. [Phase 1: Foundation & Stability](#phase-1-foundation--stability-weeks-1-2)
4. [Phase 2: Security & Quality](#phase-2-security--quality-weeks-3-5)
5. [Phase 3: Testing Infrastructure](#phase-3-testing-infrastructure-weeks-6-8)
6. [Phase 4: Accessibility & UX](#phase-4-accessibility--ux-weeks-9-11)
7. [Phase 5: Performance & Optimization](#phase-5-performance--optimization-weeks-12-14)
8. [Phase 6: Advanced Features](#phase-6-advanced-features-weeks-15-16)
9. [Implementation Checklist](#implementation-checklist)
10. [Migration Guide](#migration-guide)
11. [Risk Mitigation](#risk-mitigation)

---

## Vision & Goals

### Strategic Objectives

**Primary Goal:** Transform Infinite Heroes from a well-built prototype into a production-ready, enterprise-grade application with:
- 🛡️ **Enterprise Security** - Secure API handling and user data protection
- ✅ **Reliability** - Comprehensive testing and error handling
- ♿ **Accessibility** - WCAG 2.1 AA compliance
- ⚡ **Performance** - Optimized loading and runtime performance
- 🔧 **Maintainability** - Professional tooling and code quality

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Test Coverage | 0% | 80% | Vitest coverage report |
| TypeScript Strict | No | Yes | tsconfig.json |
| Accessibility Score | ~30 | 95+ | Lighthouse/axe |
| Bundle Size | ~800KB | <500KB | webpack-bundle-analyzer |
| Security Score | C | A | Snyk/npm audit |
| Code Quality | B- | A | SonarQube/ESLint |
| Performance (Mobile) | ~70 | 90+ | Lighthouse |
| Performance (Desktop) | ~85 | 95+ | Lighthouse |

---

## Upgrade Phases

### Overview Timeline

```
Phase 1: Foundation & Stability    [Weeks 1-2]   ████░░░░░░░░░░░░
Phase 2: Security & Quality        [Weeks 3-5]   ░░░░████░░░░░░░░
Phase 3: Testing Infrastructure    [Weeks 6-8]   ░░░░░░░░████░░░░
Phase 4: Accessibility & UX        [Weeks 9-11]  ░░░░░░░░░░░░████
Phase 5: Performance & Optimization[Weeks 12-14] ░░░░░░░░░░░░░░░░████
Phase 6: Advanced Features         [Weeks 15-16] ░░░░░░░░░░░░░░░░░░░░██
```

**Total Duration:** 16 weeks
**Estimated Effort:** 320 hours

---

## Phase 1: Foundation & Stability (Weeks 1-2)

**Goal:** Establish solid foundation with proper tooling and configurations

### 1.1 Dependency Management

**Priority:** CRITICAL
**Effort:** 4 hours

**Tasks:**

#### Fix Package.json Conflicts
```json
// BEFORE (package.json)
"dependencies": {
  "vite": "^7.3.0",
  "@vitejs/plugin-react": "^5.1.2"
},
"devDependencies": {
  "vite": "^6.2.0",
  "@vitejs/plugin-react": "^5.0.0"
}

// AFTER
"dependencies": {
  "react": "^19.2.0",
  "@google/genai": "^1.27.0",
  "react-dom": "^19.2.0",
  "recharts": "^3.3.0",
  "jspdf": "^3.0.3",
  "idb": "^8.0.0"
},
"devDependencies": {
  "vite": "^6.2.0",
  "@vitejs/plugin-react": "^5.1.2",
  "vite-plugin-pwa": "^1.2.0",
  "@types/node": "^22.14.0",
  "typescript": "~5.8.2"
}
```

**Steps:**
1. Move build tools to devDependencies
2. Remove version conflicts
3. Run `npm install` to regenerate lock file
4. Test build process: `npm run build`
5. Test dev server: `npm run dev`

---

### 1.2 Code Quality Tooling

**Priority:** HIGH
**Effort:** 8 hours

#### Install ESLint + TypeScript Support

**New Dependencies:**
```bash
npm install -D \
  eslint@^9.0.0 \
  @typescript-eslint/parser@^8.0.0 \
  @typescript-eslint/eslint-plugin@^8.0.0 \
  eslint-plugin-react@^7.36.0 \
  eslint-plugin-react-hooks@^5.0.0 \
  eslint-plugin-jsx-a11y@^6.10.0
```

**Create `.eslintrc.cjs`:**
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['react', '@typescript-eslint', 'jsx-a11y'],
  settings: {
    react: { version: '19.2' }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn'
  }
};
```

#### Install Prettier

```bash
npm install -D prettier@^3.3.0 eslint-config-prettier@^9.1.0
```

**Create `.prettierrc`:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

**Create `.prettierignore`:**
```
dist
node_modules
*.md
package-lock.json
```

#### Add Scripts to package.json

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "lint:fix": "eslint . --ext ts,tsx --fix",
  "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",
  "type-check": "tsc --noEmit"
}
```

---

### 1.3 TypeScript Strict Mode

**Priority:** HIGH
**Effort:** 16 hours

#### Update tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // STRICT MODE - Enable all strict checks
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    // Module Resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,

    // JSX
    "jsx": "react-jsx",
    "allowJs": false,  // Changed from true

    // Paths
    "paths": {
      "@/*": ["./*"]
    },

    // Build
    "skipLibCheck": true,
    "noEmit": true,

    // Remove unused options
    "types": ["node"]
    // Remove: experimentalDecorators, useDefineForClassFields
  }
}
```

#### Fix Type Errors (Estimated 50+ errors)

**Priority Fixes:**

1. **storage.ts - Remove `any` types:**
```typescript
// BEFORE
let rootHandle: any | null = null;
const verifyPermission = async (handle: any, readWrite: boolean) => { ... }

// AFTER
let rootHandle: FileSystemDirectoryHandle | null = null;
const verifyPermission = async (
  handle: FileSystemDirectoryHandle,
  readWrite: boolean
): Promise<boolean> => { ... }
```

2. **useComicEngine.ts - Fix reducer type:**
```typescript
// BEFORE
case 'UPDATE_HERO':
  return {
    ...state,
    hero: state.hero ? {...state.hero, ...action.payload}
          : action.payload as Persona  // Unsafe cast
  };

// AFTER
case 'UPDATE_HERO':
  if (!state.hero) {
    throw new Error('Cannot update hero: hero is null');
  }
  return {
    ...state,
    hero: { ...state.hero, ...action.payload }
  };
```

3. **aiService.ts - Better error typing:**
```typescript
// BEFORE
} catch (e) {
  console.error("Beat generation failed", e);
  throw e;
}

// AFTER
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error("Beat generation failed:", errorMessage);
  throw new Error(`Beat generation failed: ${errorMessage}`);
}
```

---

### 1.4 Git Pre-commit Hooks

**Priority:** MEDIUM
**Effort:** 2 hours

#### Install Husky + lint-staged

```bash
npm install -D husky@^9.0.0 lint-staged@^15.2.0
npx husky init
```

**Create `.husky/pre-commit`:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**Add to package.json:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

### 1.5 Environment Configuration

**Priority:** HIGH
**Effort:** 2 hours

#### Improve .env handling

**Create `.env.example`:**
```bash
# Gemini API Key (Get from: https://aistudio.google.com/app/apikey)
VITE_GEMINI_API_KEY=your_api_key_here

# Optional: Development Server Configuration
VITE_PORT=8080
VITE_HOST=0.0.0.0

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
```

**Update .gitignore:**
```
# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/

# Testing
coverage/
.nyc_output/

# Build
dist/
build/
```

**Update vite.config.ts:**
```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [ /* ... */ ],
    server: {
      port: parseInt(env.VITE_PORT || '8080'),
      host: env.VITE_HOST || 'localhost',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});
```

---

### Phase 1 Deliverables

- ✅ Clean package.json with resolved dependencies
- ✅ ESLint + Prettier configured and running
- ✅ TypeScript strict mode enabled (0 type errors)
- ✅ Pre-commit hooks enforcing code quality
- ✅ Proper environment variable handling
- ✅ All existing features still working

---

## Phase 2: Security & Quality (Weeks 3-5)

**Goal:** Secure the application and add robust error handling

### 2.1 API Security Architecture

**Priority:** CRITICAL
**Effort:** 24 hours

#### Problem: Client-Side API Key Exposure

**Current Risk:**
```typescript
// aiService.ts - INSECURE
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
  // ⚠️ API key visible in browser DevTools
  // ⚠️ Key sent with every request
  // ⚠️ Users can extract and abuse
};
```

#### Solution: Backend Proxy Service

**Option A: Simple Node.js Proxy (Recommended for MVP)**

**Create `server/` directory:**

```typescript
// server/index.ts
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:8080' }));
app.use(express.json({ limit: '10mb' }));
app.use('/api/', limiter);

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

// Proxy endpoint for beat generation
app.post('/api/generate-beat', async (req, res) => {
  try {
    const { history, pageNum, isDecisionPage, config, hero, friend, world, userGuidance } =
      req.body;

    // Validation
    if (!hero || !config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ai = getAI();
    // ... implement beat generation logic from aiService.ts
    const result = await ai.models.generateContent({ /* ... */ });

    res.json({ beat: result });
  } catch (error) {
    console.error('Beat generation error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

// Proxy endpoint for image generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { beat, type, config, hero, friend, world } = req.body;

    // Validation
    if (!beat || !type || !config) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ai = getAI();
    // ... implement image generation logic
    const result = await ai.models.generateContent({ /* ... */ });

    res.json({ imageUrl: result });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
```

**Update package.json:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "vite build",
    "build:server": "tsc -p server/tsconfig.json"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "tsx": "^4.19.2",
    "express": "^4.21.2",
    "@types/express": "^5.0.0",
    "cors": "^2.8.5",
    "@types/cors": "^2.8.17",
    "express-rate-limit": "^7.5.0"
  }
}
```

**Update client aiService.ts:**
```typescript
// services/aiService.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const AiService = {
  async generateBeat(...params): Promise<Beat> {
    const response = await fetch(`${API_BASE}/generate-beat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* params */ }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const { beat } = await response.json();
    return beat;
  },

  async generateImage(...params): Promise<string> {
    const response = await fetch(`${API_BASE}/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* params */ }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const { imageUrl } = await response.json();
    return imageUrl;
  },
};
```

**Option B: Serverless Functions (Vercel/Netlify)**

```typescript
// api/generate-beat.ts (Vercel Serverless Function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // ... implement logic
    res.status(200).json({ beat: result });
  } catch (error) {
    res.status(500).json({ error: 'Generation failed' });
  }
}
```

---

### 2.2 Input Validation & Sanitization

**Priority:** HIGH
**Effort:** 8 hours

#### File Upload Validation

**Create `utils/validation.ts`:**
```typescript
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_DIMENSION = 4096;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateImageFile(file: File): Promise<FileValidationResult> {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check image dimensions
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION) {
      return {
        valid: false,
        error: `Image too large. Maximum dimensions: ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid image file',
    };
  }

  return { valid: true };
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
```

**Update App.tsx:**
```typescript
import { validateImageFile } from './utils/validation';

const handleHeroUpload = async (file: File) => {
  // Validate file
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = (reader.result as string).split(',')[1];
    const existing: Partial<Persona> = state.hero || {};
    actions.setHero({
      base64,
      name: existing.name || '',
      description: existing.description || '',
    });
  };
  reader.onerror = () => {
    alert('Failed to read file');
  };
  reader.readAsDataURL(file);
};
```

---

### 2.3 Error Boundaries

**Priority:** HIGH
**Effort:** 4 hours

**Create `components/ErrorBoundary.tsx`:**
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
            <div className="max-w-md text-center">
              <h1 className="font-comic text-4xl mb-4">WHOOPS!</h1>
              <p className="mb-6">Something went wrong. Don't worry, your work is saved!</p>
              <button
                className="comic-btn bg-yellow-400 text-black px-6 py-3"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-4 text-left text-xs bg-gray-800 p-4 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**Update App.tsx:**
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BookProvider>
        <AppContent />
      </BookProvider>
    </ErrorBoundary>
  );
};
```

---

### 2.4 Comprehensive Error Handling

**Priority:** MEDIUM
**Effort:** 8 hours

**Create `utils/errors.ts`:**
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class APIError extends AppError {
  constructor(message: string, public statusCode: number) {
    super(message, 'API_ERROR', 'Failed to communicate with AI service');
    this.name = 'APIError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR', 'Failed to save data');
    this.name = 'StorageError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
```

**Update useComicEngine.ts:**
```typescript
import { APIError, getErrorMessage } from '../utils/errors';

try {
  // ... generation logic
} catch (error) {
  console.error('Batch Generation Error:', error);

  let errorMessage = getErrorMessage(error);

  if (error instanceof APIError) {
    if (error.statusCode === 403) {
      errorMessage = 'Invalid API key. Please check your configuration.';
    } else if (error.statusCode === 429) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    }
  }

  dispatch({ type: 'SET_ERROR', payload: errorMessage });
}
```

---

### 2.5 Content Security Policy

**Priority:** MEDIUM
**Effort:** 2 hours

**Add CSP headers in deployment:**

**For Vercel - `vercel.json`:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://aistudiocdn.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://generativelanguage.googleapis.com"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

### Phase 2 Deliverables

- ✅ Backend proxy server protecting API keys
- ✅ Rate limiting on API endpoints
- ✅ Input validation for all file uploads
- ✅ Error boundaries preventing app crashes
- ✅ Structured error handling with user-friendly messages
- ✅ CSP headers configured for deployment

---

## Phase 3: Testing Infrastructure (Weeks 6-8)

**Goal:** Achieve 80%+ code coverage with comprehensive testing

### 3.1 Testing Framework Setup

**Priority:** CRITICAL
**Effort:** 4 hours

#### Install Vitest + React Testing Library

```bash
npm install -D \
  vitest@^2.1.0 \
  @vitest/ui@^2.1.0 \
  @testing-library/react@^16.1.0 \
  @testing-library/jest-dom@^6.6.0 \
  @testing-library/user-event@^14.5.0 \
  jsdom@^25.0.0 \
  @vitest/coverage-v8@^2.1.0
```

**Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Create `src/test/setup.ts`:**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubGlobal('process', {
  env: {
    API_KEY: 'test-api-key',
  },
});

// Mock File System Access API
const mockShowDirectoryPicker = vi.fn();
vi.stubGlobal('showDirectoryPicker', mockShowDirectoryPicker);

// Mock FileReader
global.FileReader = class {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,mock-base64-data';
      this.onload?.();
    }, 0);
  }
} as any;
```

**Add test scripts to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

### 3.2 Unit Tests

**Priority:** HIGH
**Effort:** 24 hours

#### Test utilities/validation.ts

**Create `utils/__tests__/validation.test.ts`:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { validateImageFile } from '../validation';

describe('validateImageFile', () => {
  it('should accept valid JPEG files', async () => {
    const file = new File(['fake-image'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

    const result = await validateImageFile(file);
    expect(result.valid).toBe(true);
  });

  it('should reject files exceeding size limit', async () => {
    const file = new File(['fake-image'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

    const result = await validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('should reject invalid file types', async () => {
    const file = new File(['fake-pdf'], 'doc.pdf', { type: 'application/pdf' });

    const result = await validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });
});
```

#### Test hooks/useComicEngine.ts

**Create `hooks/__tests__/useComicEngine.test.ts`:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComicEngine } from '../useComicEngine';
import { AiService } from '../../services/aiService';

vi.mock('../../services/aiService');

describe('useComicEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useComicEngine());

    expect(result.current.state.status).toBe('setup');
    expect(result.current.state.hero).toBeNull();
    expect(result.current.state.comicFaces).toEqual([]);
  });

  it('should set hero persona', () => {
    const { result } = renderHook(() => useComicEngine());
    const mockHero = {
      base64: 'mock-base64',
      name: 'Test Hero',
      description: 'A brave warrior',
    };

    act(() => {
      result.current.actions.setHero(mockHero);
    });

    expect(result.current.state.hero).toEqual(mockHero);
  });

  it('should update config', () => {
    const { result } = renderHook(() => useComicEngine());

    act(() => {
      result.current.actions.updateConfig({ genre: 'Superhero Action' });
    });

    expect(result.current.state.config.genre).toBe('Superhero Action');
  });

  it('should transition to generating on launch', async () => {
    const { result } = renderHook(() => useComicEngine());

    act(() => {
      result.current.actions.setHero({
        base64: 'mock',
        name: 'Hero',
        description: 'Test',
      });
    });

    vi.mocked(AiService.generateImage).mockResolvedValue('mock-url');

    await act(async () => {
      await result.current.actions.launchStory();
    });

    expect(result.current.state.status).toBe('reading');
  });
});
```

#### Test services/storage.ts

**Create `services/__tests__/storage.test.ts`:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../storage';
import { openDB } from 'idb';

vi.mock('idb');

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCharacter', () => {
    it('should save character to IndexedDB', async () => {
      const mockPut = vi.fn();
      vi.mocked(openDB).mockResolvedValue({
        put: mockPut,
      } as any);

      const persona = {
        name: 'Test Hero',
        base64: 'mock-base64',
        description: 'A hero',
      };

      await StorageService.saveCharacter(persona);

      expect(mockPut).toHaveBeenCalledWith(
        'heroes',
        expect.objectContaining({
          name: 'Test Hero',
          id: 'test-hero',
        })
      );
    });
  });

  describe('getCharacters', () => {
    it('should retrieve characters sorted by timestamp', async () => {
      const mockChars = [
        { id: 'hero1', name: 'Hero 1', timestamp: 1000 },
        { id: 'hero2', name: 'Hero 2', timestamp: 2000 },
      ];

      vi.mocked(openDB).mockResolvedValue({
        getAll: vi.fn().mockResolvedValue(mockChars),
      } as any);

      const result = await StorageService.getCharacters();

      expect(result).toEqual([
        { id: 'hero2', name: 'Hero 2', timestamp: 2000 },
        { id: 'hero1', name: 'Hero 1', timestamp: 1000 },
      ]);
    });
  });
});
```

---

### 3.3 Component Tests

**Priority:** HIGH
**Effort:** 16 hours

#### Test Panel.tsx

**Create `__tests__/Panel.test.tsx`:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel } from '../Panel';
import type { ComicFace } from '../types';

describe('Panel Component', () => {
  const mockFace: ComicFace = {
    id: 'page-1',
    type: 'story',
    imageUrl: 'https://example.com/image.jpg',
    narrative: {
      caption: 'Test caption',
      dialogue: 'Test dialogue',
      scene: 'Test scene',
      choices: [],
      focus_char: 'hero',
    },
    choices: [],
    isLoading: false,
    pageIndex: 1,
  };

  it('should render image when provided', () => {
    render(<Panel face={mockFace} onChoice={vi.fn()} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockFace.imageUrl);
  });

  it('should show loading state', () => {
    const loadingFace = { ...mockFace, isLoading: true, imageUrl: undefined };
    render(<Panel face={loadingFace} onChoice={vi.fn()} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render choice buttons for decision pages', () => {
    const decisionFace = {
      ...mockFace,
      isDecisionPage: true,
      choices: ['Choice A', 'Choice B'],
    };

    render(<Panel face={decisionFace} onChoice={vi.fn()} />);

    expect(screen.getByText('Choice A')).toBeInTheDocument();
    expect(screen.getByText('Choice B')).toBeInTheDocument();
  });
});
```

#### Test Setup.tsx

**Create `__tests__/Setup.test.tsx`:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Setup } from '../Setup';

describe('Setup Component', () => {
  const defaultProps = {
    show: true,
    isTransitioning: false,
    hero: null,
    friend: null,
    config: {
      genre: 'Superhero Action',
      tone: 'ACTION-HEAVY',
      language: 'en-US',
      customPremise: '',
      openingPrompt: '',
      richMode: true,
    },
    onHeroUpload: vi.fn(),
    onFriendUpload: vi.fn(),
    onHeroUpdate: vi.fn(),
    onFriendUpdate: vi.fn(),
    onConfigChange: vi.fn(),
    onLaunch: vi.fn(),
  };

  it('should render setup form when shown', () => {
    render(<Setup {...defaultProps} />);

    expect(screen.getByText(/create your hero/i)).toBeInTheDocument();
  });

  it('should call onLaunch when launch button clicked', async () => {
    const heroProps = {
      ...defaultProps,
      hero: { base64: 'mock', name: 'Hero', description: 'Test' },
    };

    render(<Setup {...heroProps} />);

    const launchButton = screen.getByText(/launch/i);
    await userEvent.click(launchButton);

    expect(heroProps.onLaunch).toHaveBeenCalled();
  });

  it('should disable launch when hero not set', () => {
    render(<Setup {...defaultProps} />);

    const launchButton = screen.getByText(/launch/i);
    expect(launchButton).toBeDisabled();
  });
});
```

---

### 3.4 Integration Tests

**Priority:** MEDIUM
**Effort:** 12 hours

**Create `__tests__/integration/comic-generation.test.tsx`:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { AiService } from '../../services/aiService';

vi.mock('../../services/aiService');

describe('Comic Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full comic generation flow', async () => {
    vi.mocked(AiService.generateImage).mockResolvedValue('mock-image-url');
    vi.mocked(AiService.generateBeat).mockResolvedValue({
      caption: 'Test caption',
      dialogue: 'Test dialogue',
      scene: 'Test scene',
      choices: [],
      focus_char: 'hero',
    });

    render(<App />);

    // Upload hero image
    const heroInput = screen.getByLabelText(/upload hero/i);
    const file = new File(['test'], 'hero.jpg', { type: 'image/jpeg' });
    await userEvent.upload(heroInput, file);

    // Set hero name
    const nameInput = screen.getByPlaceholderText(/hero name/i);
    await userEvent.type(nameInput, 'Test Hero');

    // Launch story
    const launchButton = screen.getByText(/launch/i);
    await userEvent.click(launchButton);

    // Verify cover generation
    await waitFor(() => {
      expect(AiService.generateImage).toHaveBeenCalledWith(
        expect.objectContaining({ scene: 'Cover' }),
        'cover',
        expect.any(Object),
        expect.any(Object),
        null,
        null
      );
    });

    // Verify transition to reading mode
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});
```

---

### 3.5 End-to-End Tests

**Priority:** MEDIUM
**Effort:** 16 hours

#### Install Playwright

```bash
npm install -D @playwright/test@^1.49.0
npx playwright install
```

**Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Create `e2e/comic-flow.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Comic Book Creation Flow', () => {
  test('should create a comic book from start to finish', async ({ page }) => {
    await page.goto('/');

    // Upload hero image
    await page.setInputFiles('input[type="file"][accept="image/*"]', './e2e/fixtures/hero.jpg');

    // Fill hero details
    await page.fill('input[placeholder*="hero name"]', 'Epic Hero');
    await page.fill('textarea[placeholder*="description"]', 'A legendary warrior');

    // Select genre
    await page.selectOption('select[name="genre"]', 'Superhero Action');

    // Launch story
    await page.click('button:has-text("Launch")');

    // Wait for cover to load
    await expect(page.locator('.panel-image').first()).toBeVisible({ timeout: 30000 });

    // Verify book opens
    await expect(page.locator('.book')).toHaveClass(/opened/);

    // Flip to next page
    await page.click('.paper');
    await expect(page.locator('.paper').first()).toHaveClass(/flipped/);
  });

  test('should handle decision points', async ({ page }) => {
    // ... setup comic generation

    // Navigate to decision page
    // ...

    // Make a choice
    await page.click('button:has-text("Option A")');

    // Verify story continues
    await expect(page.locator('.loading-indicator')).toBeVisible();
    await expect(page.locator('.loading-indicator')).toBeHidden({ timeout: 30000 });
  });
});
```

---

### Phase 3 Deliverables

- ✅ Vitest configured with React Testing Library
- ✅ 80%+ code coverage on critical paths
- ✅ Comprehensive unit tests for utilities and services
- ✅ Component tests for all React components
- ✅ Integration tests for key user flows
- ✅ E2E tests with Playwright
- ✅ CI pipeline running tests on every commit

---

## Phase 4: Accessibility & UX (Weeks 9-11)

**Goal:** Achieve WCAG 2.1 AA compliance and improve UX

### 4.1 Keyboard Navigation

**Priority:** HIGH
**Effort:** 8 hours

#### Add Keyboard Controls for Book Navigation

**Update Book.tsx:**
```typescript
import { useEffect, useCallback } from 'react';

export const Book: React.FC = () => {
  // ... existing code

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextSheet();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSheet();
      } else if (e.key === 'Home') {
        actions.setSheetIndex(0);
      } else if (e.key === 'End') {
        actions.setSheetIndex(sheets.length - 1);
      }
    },
    [handleNextSheet, handlePrevSheet, actions, sheets.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // ... rest of component
};
```

**Add Keyboard Hints:**
```tsx
<div className="fixed bottom-4 right-4 bg-black/75 text-white text-sm px-4 py-2 rounded">
  <kbd className="bg-gray-700 px-2 py-1 rounded">←</kbd>
  <kbd className="bg-gray-700 px-2 py-1 rounded ml-2">→</kbd>
  <span className="ml-2">Navigate Pages</span>
</div>
```

---

### 4.2 ARIA Labels & Semantic HTML

**Priority:** HIGH
**Effort:** 12 hours

#### Update Panel.tsx

```tsx
export const Panel: React.FC<PanelProps> = ({ face, onChoice }) => {
  return (
    <div
      className="panel-container"
      role="img"
      aria-label={
        face.narrative
          ? `Comic page ${face.pageIndex}: ${face.narrative.caption || face.narrative.scene}`
          : `Comic page ${face.pageIndex}`
      }
    >
      {face.isLoading ? (
        <div role="status" aria-live="polite" aria-label="Loading page content">
          <LoadingFX />
          <span className="sr-only">Generating comic page...</span>
        </div>
      ) : (
        <>
          {face.imageUrl && (
            <img
              src={face.imageUrl}
              alt={`${face.type === 'cover' ? 'Comic book cover' : `Page ${face.pageIndex}`}${
                face.narrative ? `: ${face.narrative.scene}` : ''
              }`}
              className="panel-image"
            />
          )}

          {face.isDecisionPage && face.choices.length > 0 && (
            <div role="group" aria-label="Story decision choices">
              {face.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => onChoice(face.pageIndex, choice)}
                  className="comic-btn"
                  aria-label={`Choose: ${choice}`}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

#### Add Screen Reader Only Class

**Update index.css:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### 4.3 Loading States with Live Regions

**Priority:** MEDIUM
**Effort:** 4 hours

**Update LoadingFX.tsx:**
```tsx
export const LoadingFX: React.FC<{ progress?: LoadingProgress }> = ({ progress }) => {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="comic-fx">
        <span className="fx-text">POW!</span>
        <span className="fx-text">BAM!</span>
        <span className="fx-text">BOOM!</span>
      </div>

      {progress && (
        <>
          <div className="progress-info" aria-atomic="true">
            <p className="font-comic text-2xl">{progress.label}</p>
            {progress.substep && <p className="text-lg">{progress.substep}</p>}
          </div>

          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={progress.percentage || 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${progress.percentage || 0}%`}
          >
            <div
              className="progress-fill"
              style={{ width: `${progress.percentage || 0}%` }}
            />
          </div>

          <span className="sr-only">
            {progress.label} - {progress.substep} - {progress.percentage}% complete
          </span>
        </>
      )}
    </div>
  );
};
```

---

### 4.4 Color Contrast & Focus Indicators

**Priority:** HIGH
**Effort:** 6 hours

#### Check and Fix Contrast Ratios

**Update index.css:**
```css
/* Ensure 4.5:1 contrast ratio for text */
.comic-btn {
  font-family: 'Bangers', cursive;
  letter-spacing: 1.5px;
  border: 3px solid black;
  box-shadow: 5px 5px 0px black;
  /* Ensure sufficient contrast */
  background-color: #ffd700; /* Gold */
  color: #000000; /* Black */
}

/* Focus indicators for accessibility */
.comic-btn:focus-visible,
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid #0066ff;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .comic-btn {
    border-width: 4px;
    font-weight: bold;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .paper {
    transition: none;
  }
}
```

---

### 4.5 Form Accessibility

**Priority:** MEDIUM
**Effort:** 4 hours

**Update Setup.tsx:**
```tsx
<form onSubmit={handleSubmit}>
  <fieldset>
    <legend className="font-comic text-3xl mb-4">Create Your Hero</legend>

    <div className="form-group">
      <label htmlFor="hero-name" className="block mb-2 font-bold">
        Hero Name <span aria-label="required">*</span>
      </label>
      <input
        id="hero-name"
        type="text"
        value={hero?.name || ''}
        onChange={e => onHeroUpdate({ name: e.target.value })}
        required
        aria-required="true"
        aria-invalid={!hero?.name}
        aria-describedby="hero-name-error"
        className="w-full px-4 py-2 border-2 border-black"
      />
      {!hero?.name && (
        <p id="hero-name-error" className="text-red-600 text-sm mt-1" role="alert">
          Hero name is required
        </p>
      )}
    </div>

    <div className="form-group">
      <label htmlFor="hero-image" className="block mb-2 font-bold">
        Upload Hero Image
      </label>
      <input
        id="hero-image"
        type="file"
        accept="image/*"
        onChange={e => e.target.files?.[0] && onHeroUpload(e.target.files[0])}
        aria-describedby="hero-image-help"
        className="w-full"
      />
      <p id="hero-image-help" className="text-sm text-gray-600 mt-1">
        Supported formats: JPG, PNG, WebP. Max size: 5MB
      </p>
    </div>

    {/* ... more form fields ... */}

    <button
      type="submit"
      className="comic-btn"
      disabled={!hero?.name || isTransitioning}
      aria-busy={isTransitioning}
    >
      {isTransitioning ? 'Launching...' : 'Launch Adventure!'}
    </button>
  </fieldset>
</form>
```

---

### 4.6 Accessibility Audit

**Priority:** MEDIUM
**Effort:** 4 hours

#### Install Audit Tools

```bash
npm install -D @axe-core/react
```

**Add in development mode (index.tsx):**
```typescript
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

#### Run Manual Audits

1. **Lighthouse Accessibility Audit**
   - Target: 95+ score
   - Fix all high-priority issues

2. **Screen Reader Testing**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (Mac/iOS)
   - TalkBack (Android)

3. **Keyboard Navigation Testing**
   - All features accessible without mouse
   - Logical tab order
   - Visible focus indicators

---

### Phase 4 Deliverables

- ✅ Full keyboard navigation support
- ✅ Comprehensive ARIA labels
- ✅ WCAG 2.1 AA compliant color contrast
- ✅ Focus indicators on all interactive elements
- ✅ Screen reader compatible
- ✅ Loading states announced
- ✅ Form validation messages accessible
- ✅ Lighthouse accessibility score: 95+

---

## Phase 5: Performance & Optimization (Weeks 12-14)

**Goal:** Reduce bundle size and improve load times

### 5.1 Code Splitting

**Priority:** HIGH
**Effort:** 8 hours

#### Implement Route-Based Splitting

**Update App.tsx:**
```typescript
import React, { lazy, Suspense } from 'react';

const Setup = lazy(() => import('./Setup'));
const Book = lazy(() => import('./Book'));
const WorldBuilder = lazy(() => import('./components/WorldBuilder'));

const AppContent: React.FC = () => {
  return (
    <div className="comic-scene">
      <Suspense fallback={<LoadingFX />}>
        {state.status === 'setup' && <Setup {...setupProps} />}
        {state.status === 'reading' && <Book />}
      </Suspense>
    </div>
  );
};
```

**Configure Vite for optimized chunking:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'gemini-sdk': ['@google/genai'],
          'pdf-export': ['jspdf'],
          'charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
```

---

### 5.2 Image Optimization

**Priority:** HIGH
**Effort:** 12 hours

#### Install Compression Library

```bash
npm install browser-image-compression
```

**Create `utils/imageOptimization.ts`:**
```typescript
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<string> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return fileToBase64(compressedFile);
  } catch (error) {
    console.warn('Compression failed, using original:', error);
    return fileToBase64(file);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**Update App.tsx:**
```typescript
import { compressImage } from './utils/imageOptimization';

const handleHeroUpload = async (file: File) => {
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  setIsCompressing(true);
  try {
    const base64 = await compressImage(file);
    actions.setHero({
      base64,
      name: state.hero?.name || '',
      description: state.hero?.description || '',
    });
  } catch (error) {
    alert('Failed to process image');
  } finally {
    setIsCompressing(false);
  }
};
```

---

### 5.3 IndexedDB Blob Storage

**Priority:** MEDIUM
**Effort:** 8 hours

**Refactor storage.ts to use Blobs instead of base64:**

```typescript
interface HeroesDB extends DBSchema {
  heroes: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      imageBlob: Blob; // Changed from base64 string
      timestamp: number;
    };
  };
}

export const StorageService = {
  async saveCharacter(persona: Persona): Promise<void> {
    if (!persona.name) return;

    // Convert base64 to Blob
    const blob = await base64ToBlob(persona.base64);

    const data = {
      id: persona.name.toLowerCase().replace(/\s+/g, '-'),
      name: persona.name,
      description: persona.description,
      imageBlob: blob,
      timestamp: Date.now(),
    };

    const db = await initDB();
    await db.put('heroes', data);
  },

  async getCharacters(): Promise<(Persona & { id: string })[]> {
    const db = await initDB();
    const items = await db.getAll('heroes');

    // Convert Blobs back to base64 for compatibility
    return Promise.all(
      items.map(async item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        base64: await blobToBase64(item.imageBlob),
      }))
    );
  },
};

async function base64ToBlob(base64: string): Promise<Blob> {
  const response = await fetch(`data:image/jpeg;base64,${base64}`);
  return response.blob();
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

---

### 5.4 Bundle Analysis & Optimization

**Priority:** MEDIUM
**Effort:** 4 hours

#### Install Bundle Analyzer

```bash
npm install -D rollup-plugin-visualizer
```

**Update vite.config.ts:**
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ /* ... */ }),
    visualizer({
      filename: './dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

**Run analysis:**
```bash
npm run build
# Open dist/stats.html to visualize bundle
```

**Optimization Targets:**
- Remove unused dependencies (recharts if not used)
- Tree-shake unused Gemini SDK features
- Optimize Tailwind CSS (use JIT mode)

---

### 5.5 Service Worker Optimization

**Priority:** MEDIUM
**Effort:** 4 hours

**Update vite.config.ts PWA config:**
```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
    runtimeCaching: [
      // Cache AI-generated images
      {
        urlPattern: /^data:image\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'ai-images-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          },
        },
      },
      // Network-first for API calls
      {
        urlPattern: /\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
        },
      },
      // Existing CDN caching...
    ],
  },
})
```

---

### Phase 5 Deliverables

- ✅ Code splitting reducing initial bundle by 40%
- ✅ Image compression reducing file sizes by 70%
- ✅ IndexedDB Blob storage for efficient image handling
- ✅ Bundle size analysis and optimization
- ✅ Optimized service worker caching strategy
- ✅ Lighthouse Performance score: 90+ (mobile), 95+ (desktop)

---

## Phase 6: Advanced Features (Weeks 15-16)

**Goal:** Add polish and advanced functionality

### 6.1 Error Tracking

**Priority:** MEDIUM
**Effort:** 4 hours

#### Install Sentry

```bash
npm install @sentry/react
```

**Initialize in index.tsx:**
```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

**Update ErrorBoundary.tsx:**
```typescript
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('ErrorBoundary caught error:', error, errorInfo);
  Sentry.captureException(error, { contexts: { react: errorInfo } });
}
```

---

### 6.2 Analytics

**Priority:** LOW
**Effort:** 4 hours

**Install privacy-friendly analytics:**
```bash
npm install @vercel/analytics
```

**Add to App.tsx:**
```typescript
import { Analytics } from '@vercel/analytics/react';

const App: React.FC = () => {
  return (
    <>
      <ErrorBoundary>
        <BookProvider>
          <AppContent />
        </BookProvider>
      </ErrorBoundary>
      <Analytics />
    </>
  );
};
```

---

### 6.3 Story Branching Visualization

**Priority:** LOW
**Effort:** 12 hours

**Create `components/StoryMap.tsx`:**
```typescript
import React from 'react';

export const StoryMap: React.FC = () => {
  // Visualize story branching from decision points
  // Show timeline of user's choices
  // Allow jumping back to decision points
  // ...implementation
};
```

---

### 6.4 CI/CD Pipeline

**Priority:** HIGH
**Effort:** 6 hours

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

---

### Phase 6 Deliverables

- ✅ Error tracking with Sentry
- ✅ Analytics for user insights
- ✅ Advanced story branching features
- ✅ CI/CD pipeline with automated testing
- ✅ Automated deployments to staging/production

---

## Implementation Checklist

### Pre-Implementation

- [ ] Create feature branch: `git checkout -b upgrade/major-v1`
- [ ] Back up current production build
- [ ] Set up project board for tracking
- [ ] Schedule team reviews

### Phase 1: Foundation (Week 1-2)

- [ ] Fix dependency conflicts
- [ ] Install ESLint + Prettier
- [ ] Configure pre-commit hooks
- [ ] Enable TypeScript strict mode
- [ ] Fix all type errors
- [ ] Update environment configuration

### Phase 2: Security (Week 3-5)

- [ ] Create backend proxy server
- [ ] Implement API key protection
- [ ] Add input validation
- [ ] Create error boundaries
- [ ] Implement structured error handling
- [ ] Configure CSP headers

### Phase 3: Testing (Week 6-8)

- [ ] Set up Vitest + RTL
- [ ] Write unit tests (utils)
- [ ] Write unit tests (services)
- [ ] Write unit tests (hooks)
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Set up Playwright
- [ ] Write E2E tests
- [ ] Achieve 80%+ coverage

### Phase 4: Accessibility (Week 9-11)

- [ ] Add keyboard navigation
- [ ] Add comprehensive ARIA labels
- [ ] Fix color contrast issues
- [ ] Add focus indicators
- [ ] Make forms accessible
- [ ] Test with screen readers
- [ ] Run Lighthouse audits
- [ ] Achieve 95+ accessibility score

### Phase 5: Performance (Week 12-14)

- [ ] Implement code splitting
- [ ] Add image compression
- [ ] Refactor to Blob storage
- [ ] Analyze bundle size
- [ ] Optimize bundle
- [ ] Optimize service worker
- [ ] Run performance audits
- [ ] Achieve 90+ performance score

### Phase 6: Advanced (Week 15-16)

- [ ] Set up error tracking
- [ ] Add analytics
- [ ] Implement advanced features
- [ ] Create CI/CD pipeline
- [ ] Set up automated deployments
- [ ] Final QA testing

### Post-Implementation

- [ ] Merge to main
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Plan next iteration

---

## Migration Guide

### For Developers

**Breaking Changes:**

1. **API Service Changes**
   - `aiService.ts` now makes fetch calls instead of direct SDK calls
   - Update environment variables: `API_KEY` → `VITE_GEMINI_API_KEY`
   - Backend proxy required for production

2. **Storage Format Changes**
   - Characters now stored as Blobs in IndexedDB
   - Migration script provided (see below)

3. **TypeScript Strict Mode**
   - No more `any` types allowed
   - Null checks required
   - May need to update custom code

**Migration Scripts:**

```typescript
// scripts/migrateStorage.ts
import { openDB } from 'idb';

async function migrateToBlobs() {
  const db = await openDB('infinite-heroes-db', 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 3) {
        // Create new object stores with Blob support
        // Migrate existing base64 data to Blobs
      }
    },
  });
}
```

### For Users

**User-Facing Changes:**

1. **New Features**
   - Keyboard shortcuts (← → for navigation)
   - Better loading indicators
   - Improved error messages
   - Faster image loading

2. **Breaking Changes**
   - None! All existing saves compatible

3. **Recommended Actions**
   - Clear browser cache after upgrade
   - Re-login if authentication added
   - Update PWA installation

---

## Risk Mitigation

### High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes in dependencies | High | Medium | Pin exact versions, thorough testing |
| API proxy adds latency | Medium | High | Use serverless functions, CDN |
| TypeScript strict mode breaks code | High | High | Incremental migration, comprehensive tests |
| Storage migration loses data | Critical | Low | Backup mechanism, fallback to old format |
| Performance regressions | Medium | Medium | Lighthouse CI, performance budgets |

### Rollback Plan

1. **Git Tags:** Tag each phase completion
2. **Feature Flags:** Critical features behind flags
3. **Database Migrations:** Reversible migrations only
4. **Monitoring:** Real-time error tracking to detect issues
5. **Quick Rollback:** `git revert` + redeployment pipeline

---

## Success Criteria

### Technical Metrics

- [ ] Test coverage ≥ 80%
- [ ] TypeScript strict mode enabled
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse Performance ≥ 90 (mobile)
- [ ] Bundle size < 500KB (gzipped)
- [ ] 0 critical security vulnerabilities
- [ ] All ESLint rules passing

### Business Metrics

- [ ] Error rate < 0.1%
- [ ] API cost reduced by 50% (via caching/optimization)
- [ ] User satisfaction ≥ 4.5/5
- [ ] Time to first comic < 60 seconds
- [ ] Successful PWA installs increased

---

## Next Steps

1. **Review this plan** with team stakeholders
2. **Estimate capacity** and adjust timeline if needed
3. **Create project board** in GitHub Issues
4. **Set up development environment** for all developers
5. **Begin Phase 1** implementation

**Questions or concerns?** Open an issue on GitHub or contact the team lead.

---

**Document Version:** 1.0
**Last Updated:** December 31, 2025
**Owner:** Development Team
**Status:** Ready for Implementation
