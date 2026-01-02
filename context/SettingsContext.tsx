/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AIProvider } from '../types';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AnimationDensity = 'minimal' | 'balanced' | 'cinematic';
export type LogVerbosity = 'errors' | 'normal' | 'verbose';
export type ExportRange = 'all' | 'story-only' | 'covers-only';

export interface Settings {
  theme: ThemeMode;
  reducedMotion: boolean;
  fontScale: number;
  highContrast: boolean;
  model: string;
  maxTokens: number;
  creativity: number;
  concurrentGenerations: number;
  imageResolution: 'standard' | 'high';
  lazyThumbnails: boolean;
  thumbnailQuality: 'balanced' | 'performance' | 'detailed';
  animationDensity: AnimationDensity;
  prefetchDepth: number;
  logVerbosity: LogVerbosity;
  stickyNotifications: boolean;
  pdfQuality: 'compact' | 'standard' | 'print';
  includeMetadata: boolean;
  defaultExportRange: ExportRange;
  // AI Provider settings
  aiProvider: AIProvider;
  textModel: string;
  imageModel: string;
}

interface SettingsContextValue {
  settings: Settings;
  draft: Settings;
  isPanelOpen: boolean;
  lastSavedAt: number | null;
  isDirty: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  updateDraft: (updates: Partial<Settings>) => void;
  saveSettings: () => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  theme: 'system',
  reducedMotion: false,
  fontScale: 100,
  highContrast: false,
  model: 'gemini-3-flash-preview',
  maxTokens: 800,
  creativity: 0.5,
  concurrentGenerations: 2,
  imageResolution: 'standard',
  lazyThumbnails: true,
  thumbnailQuality: 'balanced',
  animationDensity: 'balanced',
  prefetchDepth: 2,
  logVerbosity: 'normal',
  stickyNotifications: false,
  pdfQuality: 'standard',
  includeMetadata: true,
  defaultExportRange: 'all',
  // AI Provider defaults
  aiProvider: 'gemini',
  textModel: 'gemini-3-flash-preview',
  imageModel: 'gemini-3-pro-image-preview',
};

const SETTINGS_KEY = 'comicbook-settings-v1';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [draft, setDraft] = useState<Settings>(defaultSettings);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        const merged = { ...defaultSettings, ...parsed };
        setSettings(merged);
        setDraft(merged);
      }
    } catch (error) {
      console.warn('Failed to load settings from storage', error);
    }
  }, []);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);

  const updateDraft = useCallback((updates: Partial<Settings>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const saveSettings = useCallback(() => {
    setSettings(draft);
    setLastSavedAt(Date.now());
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to persist settings', error);
    }
  }, [draft]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setDraft(defaultSettings);
    setLastSavedAt(Date.now());
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    } catch (error) {
      console.warn('Failed to reset settings', error);
    }
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 's' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        togglePanel();
      }
      if (event.key === 'Escape') {
        closePanel();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [closePanel, togglePanel]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);

  const value: SettingsContextValue = {
    settings,
    draft,
    isPanelOpen,
    lastSavedAt,
    isDirty,
    openPanel,
    closePanel,
    togglePanel,
    updateDraft,
    saveSettings,
    resetSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
