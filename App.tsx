
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
import { Persona } from './types';

const AppContent: React.FC = () => {
  const { state, actions } = useBook();
  const { showApiKeyDialog, setShowApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  // Sync API errors from state to the dialog hook
  React.useEffect(() => {
    if (state.error === 'API_KEY_ERROR') {
      setShowApiKeyDialog(true);
      actions.clearError();
    }
  }, [state.error, setShowApiKeyDialog, actions]);

  const handleHeroUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        const existing: Partial<Persona> = state.hero || {};
        actions.setHero({ 
            base64, 
            name: existing.name || "", 
            description: existing.description || "" 
        });
    };
    reader.readAsDataURL(file);
  };

  const handleFriendUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        const existing: Partial<Persona> = state.friend || {};
        actions.setFriend({ 
            base64, 
            name: existing.name || "", 
            description: existing.description || "" 
        });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      
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
    <BookProvider>
      <AppContent />
    </BookProvider>
  );
};

export default App;
