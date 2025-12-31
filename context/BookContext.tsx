
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, ReactNode } from 'react';
import { useComicEngine } from '../hooks/useComicEngine';
import { ComicState, Persona, StoryConfig } from '../types';

interface BookContextType {
  state: ComicState;
  actions: {
    setHero: (p: Persona | null) => void;
    updateHero: (updates: Partial<Persona>) => void;
    setFriend: (p: Persona | null) => void;
    updateFriend: (updates: Partial<Persona>) => void;
    updateConfig: (updates: Partial<StoryConfig>) => void;
    launchStory: () => void;
    handleChoice: (pageIndex: number, choice: string) => void;
    setSheetIndex: (idx: number) => void;
    reset: () => void;
    clearError: () => void;
  };
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const engine = useComicEngine();

  return (
    <BookContext.Provider value={engine}>
      {children}
    </BookContext.Provider>
  );
};

export const useBook = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};
