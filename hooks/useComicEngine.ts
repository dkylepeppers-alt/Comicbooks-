
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useReducer, useCallback, useRef } from 'react';
import {
  ComicState,
  ComicAction,
  ComicFace,
  StoryConfig,
  Persona,
  World,
  Notification,
  NotificationType,
  GENRES,
  TONES,
  LANGUAGES,
  INITIAL_PAGES,
  TOTAL_PAGES,
  BACK_COVER_PAGE,
  BATCH_SIZE,
  DECISION_PAGES
} from '../types';
import { AiService } from '../services/aiService';
import { StorageService } from '../services/storage';

const initialState: ComicState = {
  status: 'setup',
  comicFaces: [],
  currentSheetIndex: 0,
  hero: null,
  friend: null,
  currentWorld: null,
  availableWorlds: [],
  config: {
    genre: GENRES[0] ?? 'Custom',
    tone: TONES[0] ?? 'ACTION-HEAVY',
    language: LANGUAGES[0]?.code ?? 'en-US',
    customPremise: "",
    openingPrompt: "",
    richMode: true,
  },
  loadingProgress: null,
  error: null,
  notifications: [],
};

function reducer(state: ComicState, action: ComicAction): ComicState {
  switch (action.type) {
    case 'SET_HERO':
      return { ...state, hero: action.payload };
    case 'UPDATE_HERO':
      return { ...state, hero: state.hero ? { ...state.hero, ...action.payload } : action.payload as Persona };
    case 'SET_FRIEND':
      return { ...state, friend: action.payload };
    case 'UPDATE_FRIEND':
      return { ...state, friend: state.friend ? { ...state.friend, ...action.payload } : action.payload as Persona };
    case 'SET_WORLD':
      return { ...state, currentWorld: action.payload };
    case 'LOAD_WORLDS':
      return { ...state, availableWorlds: action.payload };
    case 'ADD_WORLD':
      return { ...state, availableWorlds: [action.payload, ...state.availableWorlds] };
    case 'DELETE_WORLD':
      return { ...state, availableWorlds: state.availableWorlds.filter(w => w.id !== action.payload) };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'START_ADVENTURE':
      return { ...state, status: 'generating', error: null };
    case 'TRANSITION_COMPLETE':
      return { ...state, status: 'reading', loadingProgress: null };
    case 'ADD_FACES': {
      const existingIds = new Set(state.comicFaces.map(f => f.id));
      const uniqueNew = action.payload.filter(f => !existingIds.has(f.id));
      return { 
        ...state, 
        comicFaces: [...state.comicFaces, ...uniqueNew].sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0)) 
      };
    }
    case 'UPDATE_FACE':
      return {
        ...state,
        comicFaces: state.comicFaces.map(f => 
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        )
      };
    case 'SET_SHEET_INDEX':
      return { ...state, currentSheetIndex: action.payload };
    case 'SET_LOADING_PROGRESS':
      return { ...state, loadingProgress: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loadingProgress: null };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export const useComicEngine = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Ref used only to prevent duplicate batch triggers
  const generatingPagesRef = useRef<Set<number>>(new Set());

  // Ref to track active timeouts for cleanup
  const activeTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Ref to track active AbortControllers for AI operations
  const activeControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef<boolean>(true);

  // Cleanup function for timeouts
  const clearAllTimeouts = useCallback(() => {
    activeTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    activeTimeoutsRef.current.clear();
  }, []);

  // Cleanup function for AbortControllers
  const abortAllOperations = useCallback(() => {
    activeControllersRef.current.forEach((controller, key) => {
      controller.abort(new Error('Component unmounting or operation cancelled'));
    });
    activeControllersRef.current.clear();
  }, []);

  // Set mounted status and cleanup on unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortAllOperations();
      clearAllTimeouts();
    };
  }, [abortAllOperations, clearAllTimeouts]);

  // Actions
  const setHero = useCallback((p: Persona | null) => dispatch({ type: 'SET_HERO', payload: p }), []);
  const updateHero = useCallback((updates: Partial<Persona>) => dispatch({ type: 'UPDATE_HERO', payload: updates }), []);
  
  const setFriend = useCallback((p: Persona | null) => dispatch({ type: 'SET_FRIEND', payload: p }), []);
  const updateFriend = useCallback((updates: Partial<Persona>) => dispatch({ type: 'UPDATE_FRIEND', payload: updates }), []);
  
  const setWorld = useCallback((w: World | null) => dispatch({ type: 'SET_WORLD', payload: w }), []);
  const loadWorlds = useCallback(async () => {
      const worlds = await StorageService.getWorlds();
      dispatch({ type: 'LOAD_WORLDS', payload: worlds });
  }, []);
  const saveWorld = useCallback(async (w: World) => {
      await StorageService.saveWorld(w);
      dispatch({ type: 'ADD_WORLD', payload: w });
      const worlds = await StorageService.getWorlds();
      dispatch({ type: 'LOAD_WORLDS', payload: worlds });
  }, []);
  const deleteWorld = useCallback(async (id: string) => {
      await StorageService.deleteWorld(id);
      dispatch({ type: 'DELETE_WORLD', payload: id });
  }, []);

  const updateConfig = useCallback((updates: Partial<StoryConfig>) => dispatch({ type: 'UPDATE_CONFIG', payload: updates }), []);
  
  const generateBatch = useCallback(async (
      startPage: number,
      count: number,
      currentFaces: ComicFace[],
      currentHero: Persona,
      currentFriend: Persona | null,
      currentConfig: StoryConfig,
      currentWorld: World | null,
      userGuidance?: string
  ) => {
    /**
     * RACE CONDITION MITIGATION FOR CONCURRENT BATCH HISTORY DIVERGENCE
     *
     * This implementation prevents concurrent batch operations from causing
     * history divergence through the following mechanisms:
     *
     * 1. Page Reservation System: Uses generatingPagesRef Set for atomic
     *    check-and-reserve to prevent duplicate page generation
     * 2. Sequential Processing: Pages within a batch are processed sequentially
     *    to maintain narrative consistency
     * 3. Batch History: Includes both generated and in-progress pages to ensure
     *    AI has full context
     * 4. AbortController Management: Each AI operation has its own controller
     *    for graceful cancellation with timeout handling
     *
     * This ensures that even if multiple batches are triggered, each page is
     * only generated once and the narrative history remains consistent.
     */

    // Atomically check and reserve pages to prevent race conditions
    const pagesToGen: number[] = [];
    for (let i = 0; i < count; i++) {
        const p = startPage + i;
        if (p <= TOTAL_PAGES && !generatingPagesRef.current.has(p)) {
            // Immediately add to set to reserve atomically
            generatingPagesRef.current.add(p);
            pagesToGen.push(p);
        }
    }

    if (pagesToGen.length === 0) return;

    // Optimistically add placeholders
    const newFaces: ComicFace[] = pagesToGen.map(pageNum => ({
      id: `page-${pageNum}`,
      type: pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story',
      choices: [],
      isLoading: true,
      pageIndex: pageNum,
    }));
    
    dispatch({ type: 'ADD_FACES', payload: newFaces });

    let batchHistory = [...currentFaces, ...newFaces];
    let completed = 0;
    const total = pagesToGen.length;
    const startTime = Date.now();

    dispatch({
        type: 'SET_LOADING_PROGRESS',
        payload: {
            current: 0,
            total,
            label: `Generating Pages ${startPage}-${startPage + count - 1}`,
            substep: 'Preparing story context...',
            percentage: 0,
            startTime
        }
    });

    try {
      // Process sequentially
      for (const pageNum of pagesToGen) {
        const currentStep = completed + 1;
        const percentage = Math.round((currentStep / total) * 100);

        dispatch({
            type: 'SET_LOADING_PROGRESS',
            payload: {
                current: currentStep,
                total,
                label: `Writing Page ${pageNum}`,
                substep: 'AI is crafting story beats...',
                percentage,
                startTime
            }
        });

        const faceId = `page-${pageNum}`;
        const type = pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story';
        const isDecision = DECISION_PAGES.includes(pageNum);

        // Create AbortController for this page's operations
        const pageController = new AbortController();
        const controllerKey = `page-${pageNum}-beat`;
        activeControllersRef.current.set(controllerKey, pageController);

        let beat;
        if (type === 'back_cover') {
           beat = { scene: "Thematic teaser image", choices: [], focus_char: 'other' as const };
        } else {
           // Apply guidance only to the first page of the batch to set direction
           const batchGuidance = (pageNum === startPage) ? userGuidance : undefined;
           beat = await AiService.generateBeat(
             batchHistory,
             pageNum,
             isDecision,
             currentConfig,
             currentHero,
             currentFriend,
             currentWorld,
             batchGuidance,
             pageController.signal
           );
        }

        // Clean up beat generation controller
        activeControllersRef.current.delete(controllerKey);
        
        let activeFriend = currentFriend;
        if (beat.focus_char === 'friend' && !activeFriend && type === 'story') {
           try {
              dispatch({
                 type: 'SET_LOADING_PROGRESS',
                 payload: {
                    current: currentStep,
                    total,
                    label: `Casting Sidekick for Page ${pageNum}`,
                    substep: 'Generating character appearance...',
                    percentage,
                    startTime
                 }
              });

              // Create AbortController for persona generation
              const personaController = new AbortController();
              const personaKey = `page-${pageNum}-persona`;
              activeControllersRef.current.set(personaKey, personaController);

              const desc = currentConfig.genre === 'Custom' ? "A fitting sidekick for this story" : `Sidekick for ${currentConfig.genre} story.`;
              activeFriend = await AiService.generatePersona(desc, currentConfig.genre, personaController.signal);
              setFriend(activeFriend);

              // Clean up persona controller
              activeControllersRef.current.delete(personaKey);
           } catch (e) {
              const errStr = String(e);
              if (errStr.includes('403') || errStr.includes('PERMISSION_DENIED')) throw e;
              beat.focus_char = 'other';
           }
        }

        batchHistory = batchHistory.map(f => f.id === faceId ? { ...f, narrative: beat, choices: beat.choices, isDecisionPage: isDecision } : f);
        dispatch({ type: 'UPDATE_FACE', payload: { id: faceId, updates: { narrative: beat, choices: beat.choices, isDecisionPage: isDecision } } });

        // Generate Image
        dispatch({
            type: 'SET_LOADING_PROGRESS',
            payload: {
                current: currentStep,
                total,
                label: `Inking Panel ${pageNum}`,
                substep: 'Rendering artwork with AI...',
                percentage,
                startTime
            }
        });

        // Create AbortController for image generation
        const imageController = new AbortController();
        const imageKey = `page-${pageNum}-image`;
        activeControllersRef.current.set(imageKey, imageController);

        const url = await AiService.generateImage(beat, type, currentConfig, currentHero, activeFriend, currentWorld, imageController.signal);

        // Clean up image controller
        activeControllersRef.current.delete(imageKey);

        batchHistory = batchHistory.map(f => f.id === faceId ? { ...f, imageUrl: url, isLoading: false } : f);
        dispatch({ type: 'UPDATE_FACE', payload: { id: faceId, updates: { imageUrl: url, isLoading: false } } });

        generatingPagesRef.current.delete(pageNum);
        completed++;
      }
    } catch (e) {
      console.error("Batch Generation Error:", e);
      const msg = String(e);
      if (
          msg.includes('Requested entity was not found') || 
          msg.includes('API_KEY_INVALID') || 
          msg.includes('403') || 
          msg.includes('PERMISSION_DENIED')
      ) {
         dispatch({ type: 'SET_ERROR', payload: "API_KEY_ERROR" });
      }
    } finally {
      pagesToGen.forEach(p => generatingPagesRef.current.delete(p));

      // Use tracked timeout with cleanup
      const cleanupTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_LOADING_PROGRESS', payload: null });
        }
        activeTimeoutsRef.current.delete(cleanupTimeout);
      }, 1000);

      activeTimeoutsRef.current.add(cleanupTimeout);
    }
  }, [setFriend]);

  const launchStory = useCallback(async () => {
    if (!state.hero) return;
    dispatch({ type: 'START_ADVENTURE' });

    const startTime = Date.now();

    // Dispatch Launch Progress
    dispatch({
        type: 'SET_LOADING_PROGRESS',
        payload: {
            current: 1,
            total: 3,
            label: "Painting Cover Art",
            substep: 'Creating epic cover design...',
            percentage: 33,
            startTime
        }
    });

    // Generate Cover
    const coverFace: ComicFace = { id: 'cover', type: 'cover', choices: [], isLoading: true, pageIndex: 0 };
    dispatch({ type: 'ADD_FACES', payload: [coverFace] });
    generatingPagesRef.current.add(0);

    // Create AbortController for cover image generation
    const coverController = new AbortController();
    activeControllersRef.current.set('cover-image', coverController);

    try {
        const url = await AiService.generateImage(
          { scene: "Cover", choices: [], focus_char: 'hero' },
          'cover',
          state.config,
          state.hero,
          state.friend,
          state.currentWorld,
          coverController.signal
        );
        dispatch({ type: 'UPDATE_FACE', payload: { id: 'cover', updates: { imageUrl: url, isLoading: false } } });
        generatingPagesRef.current.delete(0);
        activeControllersRef.current.delete('cover-image');
    } catch (e) {
        console.error("Launch Error:", e);
        activeControllersRef.current.delete('cover-image');
        dispatch({ type: 'SET_ERROR', payload: "API_KEY_ERROR" });
        return;
    }

    dispatch({
        type: 'SET_LOADING_PROGRESS',
        payload: {
            current: 2,
            total: 3,
            label: "Binding Pages",
            substep: 'Preparing your comic book...',
            percentage: 67,
            startTime
        }
    });

    // Use tracked timeout with cleanup
    const transitionTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;

        dispatch({ type: 'TRANSITION_COMPLETE' });

        // Start first batch (Pages 1-2) with Opening Prompt
        dispatch({
            type: 'SET_LOADING_PROGRESS',
            payload: {
                current: 3,
                total: 3,
                label: "Starting Issue #1",
                substep: 'Launching your adventure...',
                percentage: 100,
                startTime
            }
        });
        generateBatch(1, INITIAL_PAGES, [coverFace], state.hero!, state.friend, state.config, state.currentWorld, state.config.openingPrompt);

        // Removed subsequent auto-batches to allow user direction
        activeTimeoutsRef.current.delete(transitionTimeout);
    }, 1100);

    activeTimeoutsRef.current.add(transitionTimeout);

  }, [state.config, state.hero, state.friend, state.currentWorld, generateBatch]);

  const continueStory = useCallback((userGuidance: string) => {
      const currentMax = Math.max(...state.comicFaces.map((f: ComicFace) => f.pageIndex || 0));
      if (currentMax < TOTAL_PAGES) {
          const nextPage = currentMax + 1;
          // Generate small batch (2 pages) to keep control tight
          generateBatch(nextPage, BATCH_SIZE, state.comicFaces, state.hero!, state.friend!, state.config, state.currentWorld, userGuidance);
          // Auto flip to next sheet (assuming user is on the Director page which is technically +1 from current max render)
          dispatch({ type: 'SET_SHEET_INDEX', payload: state.currentSheetIndex + 1 });
      }
  }, [state.comicFaces, state.hero, state.friend, state.config, state.currentWorld, generateBatch, state.currentSheetIndex]);

  const handleChoice = useCallback(async (pageIndex: number, choice: string) => {
    dispatch({ type: 'UPDATE_FACE', payload: { id: `page-${pageIndex}`, updates: { resolvedChoice: choice } } });
    // For decisions, we treat the choice AS the guidance for the next batch
    const currentMax = Math.max(...state.comicFaces.map((f: ComicFace) => f.pageIndex || 0));
    if (currentMax + 1 <= TOTAL_PAGES) {
      generateBatch(currentMax + 1, BATCH_SIZE, state.comicFaces, state.hero!, state.friend!, state.config, state.currentWorld, `User chose: ${choice}`);
      dispatch({ type: 'SET_SHEET_INDEX', payload: state.currentSheetIndex + 1 });
    }
  }, [state.comicFaces, state.hero, state.friend, state.config, state.currentWorld, generateBatch, state.currentSheetIndex]);

  const setSheetIndex = useCallback((idx: number) => dispatch({ type: 'SET_SHEET_INDEX', payload: idx }), []);
  const reset = useCallback(() => {
      generatingPagesRef.current.clear();
      dispatch({ type: 'RESET' });
  }, []);

  // Notification actions
  const addNotification = useCallback((type: NotificationType, message: string, duration: number = 5000) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      duration
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  return {
    state,
    actions: {
      setHero,
      updateHero,
      setFriend,
      updateFriend,
      setWorld,
      loadWorlds,
      saveWorld,
      deleteWorld,
      updateConfig,
      launchStory,
      continueStory, // Exported
      handleChoice,
      setSheetIndex,
      reset,
      clearError: () => dispatch({ type: 'SET_ERROR', payload: '' }),
      addNotification,
      removeNotification,
      clearNotifications
    }
  };
};
