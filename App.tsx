
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BookProvider, useBook } from './context/BookContext';
import { Setup } from './Setup';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { NotificationToast } from './components/NotificationToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Persona } from './types';

const AppContent: React.FC = () => {
  const { state, actions } = useBook();
  const { showApiKeyDialog, setShowApiKeyDialog, validateApiKey, handleApiKeyDialogContinue } = useApiKey();

  // Check for API key on mount
  React.useEffect(() => {
    validateApiKey();
  }, [validateApiKey]);

  // Sync API errors from state to the dialog hook
  React.useEffect(() => {
    if (state.error === 'API_KEY_ERROR') {
      // Use setTimeout to ensure loading states have been cleared
      // and give React a chance to complete any pending renders
      const timeoutId = setTimeout(() => {
        setShowApiKeyDialog(true);
        actions.clearError();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [state.error, setShowApiKeyDialog, actions]);

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

    const reader = new FileReader();

    reader.onload = () => {
        try {
          const result = reader.result as string;
          const base64 = result.split(',')[1] ?? '';

          if (!base64) {
            throw new Error('Failed to process image data');
          }

          const existing: Partial<Persona> = state.hero || {};
          actions.setHero({
              base64,
              name: existing.name || "",
              description: existing.description || ""
          });

          actions.addNotification('success', 'Hero image uploaded successfully!', 3000);
        } catch (error) {
          actions.addNotification('error', `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    reader.onerror = () => {
      actions.addNotification('error', 'Failed to read the image file. Please try again.');
    };

    reader.readAsDataURL(file);
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

    const reader = new FileReader();

    reader.onload = () => {
        try {
          const result = reader.result as string;
          const base64 = result.split(',')[1] ?? '';

          if (!base64) {
            throw new Error('Failed to process image data');
          }

          const existing: Partial<Persona> = state.friend || {};
          actions.setFriend({
              base64,
              name: existing.name || "",
              description: existing.description || ""
          });

          actions.addNotification('success', 'Sidekick image uploaded successfully!', 3000);
        } catch (error) {
          actions.addNotification('error', `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    reader.onerror = () => {
      actions.addNotification('error', 'Failed to read the image file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}

      <NotificationToast
        notifications={state.notifications}
        onDismiss={actions.removeNotification}
      />

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

      <Book />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BookProvider>
        <AppContent />
      </BookProvider>
    </ErrorBoundary>
  );
};

export default App;
