
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useCallback, useEffect, useState } from 'react';
import { GoogleGenAI } from '@google/genai';

// Interface for the injected window.aistudio object
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

export const useApiKey = () => {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('userApiKey') : '';
    if (storedKey) {
      setApiKeyInput(storedKey);
    }
  }, []);

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('userApiKey') : null;
    const envKey = process.env.API_KEY;

    // If the environment supports key selection
    if (aistudio) {
      try {
        // Check if key is already selected
        const hasKey = await aistudio.hasSelectedApiKey();
        if (hasKey) {
          return true;
        }

        setShowApiKeyDialog(true);
        return false;
      } catch (error) {
        // Fallback if check fails
        console.warn('API Key check failed', error);
        setShowApiKeyDialog(true);
        return false;
      }
    }

    if (storedKey || envKey) {
      return true;
    }

    setShowApiKeyDialog(true);
    return false;
  }, []);

  const handleApiKeyDialogContinue = useCallback(async () => {
    setShowApiKeyDialog(false);
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    if (aistudio) {
      await aistudio.openSelectKey();
    }
  }, []);

  const handleApiKeySave = useCallback(() => {
    if (typeof localStorage !== 'undefined' && apiKeyInput.trim()) {
      localStorage.setItem('userApiKey', apiKeyInput.trim());
      setShowApiKeyDialog(false);
      setTestResult('API key saved for this browser.');
    }
  }, [apiKeyInput]);

  const testApiKey = useCallback(async () => {
    const candidateKey = apiKeyInput.trim();
    if (!candidateKey) {
      setTestResult('Please enter an API key to test.');
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: candidateKey });
      const result = await ai.models.listModels({ pageSize: 1 });
      const modelName = result.models?.[0]?.name || 'Gemini API';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('userApiKey', candidateKey);
      }
      setTestResult(`API key verified! Access to ${modelName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while testing key.';
      setTestResult(`API key test failed: ${message}`);
    } finally {
      setIsTestingKey(false);
    }
  }, [apiKeyInput]);

  return {
    showApiKeyDialog,
    setShowApiKeyDialog, // Exposed in case you need to trigger it from API errors
    validateApiKey,
    handleApiKeyDialogContinue,
    handleApiKeySave,
    apiKeyInput,
    setApiKeyInput,
    testApiKey,
    isTestingKey,
    testResult,
  };
};
