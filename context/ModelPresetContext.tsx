/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ModelPreset } from '../types';
import { StorageService } from '../services/storage';

const DEFAULT_MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'default-gemini-flash',
    name: 'Cinematic Flash',
    model: 'gemini-3-flash-preview',
    prompt:
      'Prioritize brisk, punchy pacing with visually clear actions. Keep captions lean and lean into bold comic energy. Maintain tight focus on core characters and avoid meandering exposition.',
    isDefault: true,
    updatedAt: 0,
  },
  {
    id: 'default-gemini-pro',
    name: 'Immersive Pro',
    model: 'gemini-3-pro-preview',
    prompt:
      'Aim for richer sensory detail and internal monologue. Allow slightly longer captions and dialogue to explore emotion while preserving comic readability and page cadence.',
    isDefault: true,
    updatedAt: 0,
  },
];

interface ModelPresetContextValue {
  presets: ModelPreset[];
  defaultPresets: ModelPreset[];
  loading: boolean;
  refreshPresets: () => Promise<void>;
  savePreset: (preset: ModelPreset) => Promise<void>;
  createPreset: (name: string, base?: Partial<ModelPreset>) => Promise<ModelPreset | null>;
  resetPreset: (id: string) => Promise<void>;
  getPresetById: (id: string) => ModelPreset | undefined;
}

const ModelPresetContext = createContext<ModelPresetContextValue | undefined>(undefined);

export const ModelPresetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [presets, setPresets] = useState<ModelPreset[]>(DEFAULT_MODEL_PRESETS);
  const [loading, setLoading] = useState(false);

  const refreshPresets = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await StorageService.getModelPresets();
      const mergedMap = new Map<string, ModelPreset>();

      DEFAULT_MODEL_PRESETS.forEach((preset) => mergedMap.set(preset.id, preset));
      stored.forEach((preset) => mergedMap.set(preset.id, preset));

      const merged = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setPresets(merged);
    } catch (error) {
      console.warn('Failed to load model presets', error);
      setPresets(DEFAULT_MODEL_PRESETS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPresets();
  }, [refreshPresets]);

  const savePreset = useCallback(async (preset: ModelPreset) => {
    const payload = {
      ...preset,
      updatedAt: Date.now(),
      isDefault: DEFAULT_MODEL_PRESETS.some((p) => p.id === preset.id),
    };
    await StorageService.saveModelPreset(payload);
    await refreshPresets();
  }, [refreshPresets]);

  const createPreset = useCallback(async (name: string, base?: Partial<ModelPreset>) => {
    if (!name.trim()) return null;
    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const preset: ModelPreset = {
      id,
      name,
      model: base?.model || DEFAULT_MODEL_PRESETS[0].model,
      prompt: base?.prompt || DEFAULT_MODEL_PRESETS[0].prompt,
      updatedAt: Date.now(),
      isDefault: false,
    };
    await StorageService.saveModelPreset(preset);
    await refreshPresets();
    return preset;
  }, [refreshPresets]);

  const resetPreset = useCallback(async (id: string) => {
    const defaultMatch = DEFAULT_MODEL_PRESETS.find((p) => p.id === id);
    if (defaultMatch) {
      await StorageService.deleteModelPreset(id);
      await refreshPresets();
      return;
    }

    const existing = presets.find((p) => p.id === id);
    if (existing) {
      await StorageService.saveModelPreset({
        ...existing,
        prompt: DEFAULT_MODEL_PRESETS[0].prompt,
        model: DEFAULT_MODEL_PRESETS[0].model,
        updatedAt: Date.now(),
      });
      await refreshPresets();
    }
  }, [presets, refreshPresets]);

  const getPresetById = useCallback((id: string) => presets.find((p) => p.id === id), [presets]);

  const value = useMemo(() => ({
    presets,
    defaultPresets: DEFAULT_MODEL_PRESETS,
    loading,
    refreshPresets,
    savePreset,
    createPreset,
    resetPreset,
    getPresetById,
  }), [createPreset, getPresetById, loading, presets, refreshPresets, resetPreset, savePreset]);

  return <ModelPresetContext.Provider value={value}>{children}</ModelPresetContext.Provider>;
};

export const useModelPresets = () => {
  const context = useContext(ModelPresetContext);
  if (!context) {
    throw new Error('useModelPresets must be used within a ModelPresetProvider');
  }
  return context;
};

export { DEFAULT_MODEL_PRESETS };
