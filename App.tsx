
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Suspense, lazy } from 'react';
import { ApiKeyDialog } from './ApiKeyDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalLoadingIndicator } from './components/GlobalLoadingIndicator';
import { NotificationToast } from './components/NotificationToast';
import { SettingsPanel } from './components/SettingsPanel';
import { TopBar } from './components/TopBar';
import { BookProvider, useBook } from './context/BookContext';
import { ModelPresetProvider } from './context/ModelPresetContext';
import { SettingsProvider } from './context/SettingsContext';
import { Persona } from './types';
import { useApiKey } from './useApiKey';
import { compressImage, estimateBase64Size, formatBytes } from './utils/imageCompression';

// Lazy load heavy components for better code splitting
const Book = lazy(() => import('./Book').then(m => ({ default: m.Book })));
const Setup = lazy(() => import('./Setup').then(m => ({ default: m.Setup })));

const AppContent: React.FC = () => {
  const { state, actions } = useBook();
  const {
    showApiKeyDialog,
    setShowApiKeyDialog,
    validateApiKey,
    handleApiKeyDialogContinue,
    handleApiKeySave,
    apiKeyInput,
    setApiKeyInput,
    testApiKey,
    isTestingKey,
    testResult,
  } = useApiKey();

  // Check for API key on mount
  React.useEffect(() => {
    validateApiKey();
  }, [validateApiKey]);

  // Sync API errors from state to the dialog hook
  React.useEffect(() => {
    if (state.error === 'API_KEY_ERROR' && !showApiKeyDialog) {
      // Use setTimeout to ensure loading states have been cleared
      // and give React a chance to complete any pending renders
      const timeoutId = setTimeout(() => {
        setShowApiKeyDialog(true);
        actions.clearError();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [state.error, showApiKeyDialog, setShowApiKeyDialog, actions]);

  const handleHeroUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      actions.addNotification('error', 'Please upload a valid image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      actions.addNotification('error', `File too large! Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    try {
      // Compress image for better performance
      const base64 = await compressImage(file, 1024, 1024, 0.85);
      
      if (!base64) {
        throw new Error('Failed to process image data');
      }

      const compressedSize = estimateBase64Size(base64);
      const existing: Partial<Persona> = state.hero || {};
      actions.setHero({
          base64,
          name: existing.name || "",
          description: existing.description || ""
      });

      actions.addNotification('success', `Hero image uploaded! (${formatBytes(compressedSize)})`, 3000);
    } catch (error) {
      actions.addNotification('error', `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFriendUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      actions.addNotification('error', 'Please upload a valid image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      actions.addNotification('error', `File too large! Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    try {
      // Compress image for better performance
      const base64 = await compressImage(file, 1024, 1024, 0.85);
      
      if (!base64) {
        throw new Error('Failed to process image data');
      }

      const compressedSize = estimateBase64Size(base64);
      const existing: Partial<Persona> = state.friend || {};
      actions.setFriend({
          base64,
          name: existing.name || "",
          description: existing.description || ""
      });

      actions.addNotification('success', `Sidekick image uploaded! (${formatBytes(compressedSize)})`, 3000);
    } catch (error) {
      actions.addNotification('error', `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="comic-shell">
      <TopBar />
      <SettingsPanel />

      <div className="comic-scene pt-24">
      {showApiKeyDialog && (
        <ApiKeyDialog
          onContinue={handleApiKeyDialogContinue}
          onSaveKey={handleApiKeySave}
          onTestKey={testApiKey}
          apiKey={apiKeyInput}
          onApiKeyChange={setApiKeyInput}
          isTesting={isTestingKey}
          testResult={testResult}
        />
      )}

        <NotificationToast
          notifications={state.notifications}
          onDismiss={actions.removeNotification}
        />

        <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="animate-spin text-4xl">⏳</div></div>}>
          <Setup
              show={state.status === 'setup'}
              isTransitioning={state.status === 'generating'}
              hero={state.hero}
              friend={state.friend}
              config={state.config}
              onHeroUpload={handleHeroUpload}
              onFriendUpload={handleFriendUpload}
              onHeroUpdate={actions.updateHero}
              onFriendUpdate={actions.updateFriend}
              onConfigChange={actions.updateConfig}
              onLaunch={actions.launchStory}
          />
        </Suspense>

        <GlobalLoadingIndicator />

        <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="animate-spin text-4xl">📖</div></div>}>
          <Book />
        </Suspense>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ModelPresetProvider>
        <SettingsProvider>
          <BookProvider>
            <AppContent />
          </BookProvider>
        </SettingsProvider>
      </ModelPresetProvider>
    </ErrorBoundary>
  );
};

export default App;
