
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const MAX_STORY_PAGES = 10;
export const BACK_COVER_PAGE = 11;
export const TOTAL_PAGES = 11;
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 2;
export const BATCH_SIZE = 2; // Reduced for more granular control
export const DECISION_PAGES = [5]; // Moved deeper since user controls flow now

export const GENRES = ["Classic Horror", "Superhero Action", "Dark Sci-Fi", "High Fantasy", "Neon Noir Detective", "Wasteland Apocalypse", "Lighthearted Comedy", "Teen Drama / Slice of Life", "Custom"];
export const TONES = [
    "ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)",
    "INNER-MONOLOGUE (Heavy captions revealing thoughts.)",
    "QUIPPY (Characters use humor as a defense mechanism.)",
    "OPERATIC (Grand, dramatic declarations and high stakes.)",
    "CASUAL (Natural dialogue, focus on relationships/gossip.)",
    "WHOLESOME (Warm, gentle, optimistic.)"
];

export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'id-ID', name: 'Indonesian (Indonesia)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'ua-UA', name: 'Ukrainian (Ukraine)' },
    { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
    { code: 'zh-CN', name: 'Chinese (China)' }
];

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'other';
}

export interface Persona {
  base64: string;
  name: string;
  description: string;
}

export interface World {
  id: string;
  name: string;
  description: string;
  images: string[]; // Array of base64 strings (Max 3)
  linkedPersonaIds: string[];
}

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex: number;
  isDecisionPage?: boolean;
}

export interface StoryConfig {
  genre: string;
  tone: string;
  language: string;
  customPremise: string;
  openingPrompt: string; // New: User defines the start
  richMode: boolean;
}

export interface LoadingProgress {
    current: number;
    total: number;
    label: string;
    substep?: string; // Optional detailed substep description
    percentage?: number; // Calculated percentage (0-100)
    startTime?: number; // Timestamp when progress started
}

// Error Types
export type ErrorType =
  | 'API_KEY_ERROR'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'FILE_UPLOAD_ERROR'
  | 'GENERATION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  type: ErrorType;
  message: string;
  timestamp: number;
  details?: string;
}

// Notification Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after ms (0 = no auto-dismiss)
}

// Reducer & Context Types
export type EngineStatus = 'idle' | 'setup' | 'generating' | 'reading' | 'error';

export interface ComicState {
  status: EngineStatus;
  comicFaces: ComicFace[];
  currentSheetIndex: number;
  hero: Persona | null;
  friend: Persona | null;
  currentWorld: World | null;
  availableWorlds: World[];
  config: StoryConfig;
  loadingProgress: LoadingProgress | null;
  error: string | null;
  notifications: Notification[];
}

export type ComicAction =
  | { type: 'SET_HERO'; payload: Persona | null }
  | { type: 'UPDATE_HERO'; payload: Partial<Persona> }
  | { type: 'SET_FRIEND'; payload: Persona | null }
  | { type: 'UPDATE_FRIEND'; payload: Partial<Persona> }
  | { type: 'SET_WORLD'; payload: World | null }
  | { type: 'LOAD_WORLDS'; payload: World[] }
  | { type: 'ADD_WORLD'; payload: World }
  | { type: 'DELETE_WORLD'; payload: string }
  | { type: 'UPDATE_CONFIG'; payload: Partial<StoryConfig> }
  | { type: 'START_ADVENTURE' }
  | { type: 'TRANSITION_COMPLETE' }
  | { type: 'ADD_FACES'; payload: ComicFace[] }
  | { type: 'UPDATE_FACE'; payload: { id: string; updates: Partial<ComicFace> } }
  | { type: 'SET_SHEET_INDEX'; payload: number }
  | { type: 'SET_LOADING_PROGRESS'; payload: LoadingProgress | null }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'RESET' };
