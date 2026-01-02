/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useBook } from '../context/BookContext';
import { useModelPresets } from '../context/ModelPresetContext';
import { ModelPreset, ModelParameters, AIProvider } from '../types';

export const useEnhancedPresets = () => {
  const { state, actions } = useBook();
  const { presets, savePreset, createPreset, getPresetById } = useModelPresets();
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>(state.config.modelPresetId || presets[0]?.id || '');
  const [textModel, setTextModel] = useState(state.config.textModel);
  const [imageModel, setImageModel] = useState(state.config.imageModel);
  const [textPrompt, setTextPrompt] = useState(state.config.textPrompt);
  const [imagePrompt, setImagePrompt] = useState(state.config.imagePrompt);
  const [textParams, setTextParams] = useState<ModelParameters>(state.config.textModelParams);
  const [imageParams, setImageParams] = useState<ModelParameters>(state.config.imageModelParams);

  // Sync with preset changes
  useEffect(() => {
    const preset = getPresetById(selectedPresetId);
    if (preset) {
      setTextModel(preset.textModel);
      setImageModel(preset.imageModel);
      setTextPrompt(preset.textPrompt);
      setImagePrompt(preset.imagePrompt);
      setTextParams(preset.textModelParams);
      setImageParams(preset.imageModelParams);
    }
  }, [selectedPresetId, getPresetById]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    actions.updateConfig({
      modelPresetId: presetId,
      aiProvider: preset.provider,
      textModel: preset.textModel,
      imageModel: preset.imageModel,
      textPrompt: preset.textPrompt,
      imagePrompt: preset.imagePrompt,
      textModelParams: preset.textModelParams,
      imageModelParams: preset.imageModelParams,
    });
  }, [actions, getPresetById]);

  const saveCurrentAsPreset = useCallback(async (name: string) => {
    const newPreset = await createPreset(name, {
      provider: state.config.aiProvider,
      textModel,
      imageModel,
      textPrompt,
      imagePrompt,
      textModelParams: textParams,
      imageModelParams: imageParams,
    });
    
    if (newPreset) {
      setSelectedPresetId(newPreset.id);
      actions.updateConfig({ modelPresetId: newPreset.id });
    }
    
    return newPreset;
  }, [
    state.config.aiProvider,
    textModel,
    imageModel,
    textPrompt,
    imagePrompt,
    textParams,
    imageParams,
    createPreset,
    actions
  ]);

  const updateCurrentPreset = useCallback(async () => {
    const preset = getPresetById(selectedPresetId);
    if (!preset) return;

    await savePreset({
      ...preset,
      provider: state.config.aiProvider,
      textModel,
      imageModel,
      textPrompt,
      imagePrompt,
      textModelParams: textParams,
      imageModelParams: imageParams,
      updatedAt: Date.now(),
    });
  }, [
    selectedPresetId,
    state.config.aiProvider,
    textModel,
    imageModel,
    textPrompt,
    imagePrompt,
    textParams,
    imageParams,
    getPresetById,
    savePreset
  ]);

  const updateConfig = useCallback(() => {
    actions.updateConfig({
      textModel,
      imageModel,
      textPrompt,
      imagePrompt,
      textModelParams: textParams,
      imageModelParams: imageParams,
    });
  }, [actions, textModel, imageModel, textPrompt, imagePrompt, textParams, imageParams]);

  return {
    // State
    selectedPresetId,
    textModel,
    imageModel,
    textPrompt,
    imagePrompt,
    textParams,
    imageParams,
    presets,
    
    // Setters
    setSelectedPresetId,
    setTextModel,
    setImageModel,
    setTextPrompt,
    setImagePrompt,
    setTextParams,
    setImageParams,
    
    // Actions
    applyPreset,
    saveCurrentAsPreset,
    updateCurrentPreset,
    updateConfig,
  };
};
