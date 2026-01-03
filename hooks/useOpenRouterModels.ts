/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenRouter } from '@openrouter/sdk';
import { useState, useCallback } from 'react';
import { ModelParameters } from '../types';

interface OpenRouterModelInfo {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
}

export const useOpenRouterModels = (apiKey: string | null) => {
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    if (!apiKey) {
      setModels([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = new OpenRouter({ apiKey });
      const response = await client.models.list({});

      if (response.data && Array.isArray(response.data)) {
        const modelList = response.data.map((model: any) => ({
          id: model.id || '',
          name: model.name || model.id || '',
        })).filter((m: any) => m.id);

        setModels(modelList);
      }
    } catch (err) {
      console.error('Failed to fetch OpenRouter models:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const getModelDefaults = useCallback(async (modelId: string): Promise<Partial<ModelParameters>> => {
    if (!apiKey || !modelId) {
      return {};
    }

    try {
      const client = new OpenRouter({ apiKey });
      const response = await client.models.list({});

      if (response.data && Array.isArray(response.data)) {
        const modelInfo = response.data.find((m: any) => m.id === modelId) as OpenRouterModelInfo | undefined;
        
        if (modelInfo) {
          // Extract default parameters from model info
          const defaults: Partial<ModelParameters> = {};
          
          // Set max tokens based on context length
          if (modelInfo.context_length) {
            defaults.maxTokens = Math.min(2000, Math.floor(modelInfo.context_length * 0.5));
          } else if (modelInfo.top_provider?.max_completion_tokens) {
            defaults.maxTokens = modelInfo.top_provider.max_completion_tokens;
          }
          
          // Default temperature for creative models
          if (modelInfo.id.includes('gpt-4') || modelInfo.id.includes('claude')) {
            defaults.temperature = 0.7;
            defaults.topP = 0.9;
          } else {
            defaults.temperature = 0.8;
            defaults.topP = 0.95;
          }
          
          return defaults;
        }
      }
    } catch (err) {
      console.error('Failed to get model defaults:', err);
    }

    // Return generic defaults
    return {
      temperature: 0.7,
      topP: 0.95,
      maxTokens: 1000,
    };
  }, [apiKey]);

  return {
    models,
    isLoading,
    error,
    fetchModels,
    getModelDefaults,
  };
};
