
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import { useCallback, useEffect, useState } from 'react';

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

    console.log('[API Key Test] Starting API key validation...');
    console.log('[API Key Test] API key length:', candidateKey.length);
    
    setIsTestingKey(true);
    setTestResult(null);
    
    const startTime = Date.now();
    
    try {
      console.log('[API Key Test] Creating GoogleGenAI client...');
      const ai = new GoogleGenAI({ apiKey: candidateKey });
      
      console.log('[API Key Test] Calling models.list() API...');
      const result = await ai.models.list({ config: { pageSize: 1 } });
      
      const elapsed = Date.now() - startTime;
      console.log(`[API Key Test] API call completed in ${elapsed}ms`);
      console.log('[API Key Test] Response summary:', {
        modelsCount: result.models?.length ?? 0,
        firstModelName: result.models?.[0]?.name ?? null,
      });
      
      const modelName = result.models?.[0]?.name || 'Gemini API';
      
      console.log(`[API Key Test] ✓ API key is valid - Model found: ${modelName}`);
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('userApiKey', candidateKey);
        console.log('[API Key Test] API key saved to localStorage');
      }
      
      setTestResult(`✓ API key verified! Access to ${modelName}. Response time: ${elapsed}ms`);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[API Key Test] ✗ Test failed after ${elapsed}ms:`, error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('[API Key Test] Error name:', error.name);
        console.error('[API Key Test] Error message:', error.message);
        // Only log stack trace in development to avoid exposing internal structure
        if (import.meta.env.DEV) {
          console.error('[API Key Test] Error stack:', error.stack);
        }
      }
      
      // Check for common error types
      const errorStr = String(error);
      let friendlyMessage = 'Unknown error while testing key.';
      
      if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
        friendlyMessage = 'Permission denied. This key may not have access to the Gemini API or requires billing to be enabled.';
        console.error('[API Key Test] 403/Permission error detected');
      } else if (errorStr.includes('401') || errorStr.includes('UNAUTHENTICATED')) {
        friendlyMessage = 'Authentication failed. The API key appears to be invalid.';
        console.error('[API Key Test] 401/Auth error detected');
      } else if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        friendlyMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        console.error('[API Key Test] 429/Rate limit error detected');
      } else if (errorStr.includes('OFFLINE') || errorStr.includes('network')) {
        friendlyMessage = 'Network error. Please check your internet connection.';
        console.error('[API Key Test] Network error detected');
      } else if (error instanceof Error) {
        friendlyMessage = error.message;
      }
      
      setTestResult(`✗ API key test failed: ${friendlyMessage}`);
    } finally {
      setIsTestingKey(false);
      console.log('[API Key Test] Test completed');
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
