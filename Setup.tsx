
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WorldBuilder } from './components/WorldBuilder';
import { CharacterBuilder } from './components/CharacterBuilder';
import { useBook } from './context/BookContext';
import { useModelPresets } from './context/ModelPresetContext';
import { usePWA } from './hooks/usePWA';
import { StorageService } from './services/storage';
import { GENRES, LANGUAGES, Persona, StoryConfig, World } from './types';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    config: StoryConfig;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onHeroUpdate: (updates: Partial<Persona>) => void;
    onFriendUpdate: (updates: Partial<Persona>) => void;
    onConfigChange: (val: Partial<StoryConfig>) => void;
    onLaunch: () => void;
}

const Footer = ({ isInstallable, isInstalled, onInstall, onConnectStorage }: { isInstallable: boolean, isInstalled: boolean, onInstall: () => void, onConnectStorage: () => void }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    }
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 py-2 sm:py-3 px-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 z-[300] border-t-4 border-yellow-400 font-comic transition-colors ${isOnline ? 'bg-black text-white' : 'bg-red-800 text-gray-200'}`}>
        <div className="flex items-center gap-2 text-sm sm:text-lg md:text-xl">
            {!isOnline && (
                <span className="text-white font-bold animate-pulse text-center">⚠️ OFFLINE MODE</span>
            )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <button onClick={onConnectStorage} className="comic-btn bg-blue-600 text-white text-xs px-3 py-2 sm:px-2 sm:py-1 hover:bg-blue-500 uppercase touch-manipulation whitespace-nowrap">
                📂 <span className="hidden xs:inline">Connect </span>Library
            </button>
            
            {isInstallable && (
                <button onClick={onInstall} className="comic-btn bg-white text-black text-xs px-3 py-2 sm:px-2 sm:py-1 hover:bg-gray-200 uppercase animate-bounce touch-manipulation whitespace-nowrap">
                    📲 Install<span className="hidden xs:inline"> App</span>
                </button>
            )}
            
            {isInstalled && (
                <span className="text-green-400 text-xs font-bold border border-green-400 px-2 py-1 rounded whitespace-nowrap">
                    ✓ INSTALLED
                </span>
            )}

            <span className="text-gray-500 text-xs sm:text-sm hidden sm:inline">Build with Gemini</span>
        </div>
    </div>
  );
};

const SectionCard = ({
  title,
  subtitle,
  children,
  actions,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.25)] p-3 sm:p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-comic text-lg sm:text-xl text-black leading-tight">{title}</p>
          {subtitle && <p className="text-xs text-gray-600 leading-tight mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="text-xs font-bold uppercase bg-gray-100 border-2 border-black px-3 py-2 sm:px-2 sm:py-1 hover:bg-gray-200 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center"
          >
            {open ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {open && <div className="flex flex-col gap-3 mt-1">{children}</div>}
    </div>
  );
};

export const Setup: React.FC<SetupProps> = (props) => {
    const { isInstallable, isInstalled, promptInstall } = usePWA();
    const { state, actions } = useBook();
    const { addNotification, loadWorlds } = actions;
    const [savedCharacters, setSavedCharacters] = useState<(Persona & {id:string})[]>([]);
    const [showWorldBuilder, setShowWorldBuilder] = useState(false);
    const [editingWorld, setEditingWorld] = useState<World | null>(null);
    const [showCharacterBuilder, setShowCharacterBuilder] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<(Persona & {id:string}) | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { presets, getPresetById } = useModelPresets();
    const [libraryRestored, setLibraryRestored] = useState(false);
    const [hadLibraryAccess, setHadLibraryAccess] = useState(false);
    const restoreAttemptedRef = useRef(false);

    const refreshLibrary = React.useCallback(() => {
        StorageService.getCharacters()
            .then(setSavedCharacters)
            .catch(error => {
                console.error('Failed to load character library:', error);
                const errorMsg = error instanceof Error && error.message 
                    ? error.message 
                    : 'Failed to load saved characters. Please try reconnecting your library.';
                addNotification('error', errorMsg);
            });
    }, [addNotification]);

    useEffect(() => {
        const restoreLibrary = async () => {
            if (restoreAttemptedRef.current) return;
            restoreAttemptedRef.current = true;

            try {
                const restored = await StorageService.restoreLocalLibrary();

                if (restored) {
                    refreshLibrary();
                    try {
                        await loadWorlds();
                        actions.addNotification('success', 'Reconnected to your local library', 2500);
                    } catch (error) {
                        console.error('Failed to load worlds after restoring library:', error);
                        const errorMsg = error instanceof Error ? error.message : 'Library reconnected but worlds could not be loaded';
                        actions.addNotification('warning', errorMsg);
                    }
                }

                setLibraryRestored(true);
                setHadLibraryAccess(restored);
            } catch (error) {
                console.warn('Library restore attempt failed', error);
                setLibraryRestored(true);
            }
        };

        restoreLibrary();
    }, [actions, loadWorlds, refreshLibrary]);

    useEffect(() => {
        if (!libraryRestored) return;

        const verifyAndLoad = async () => {
            try {
                const stillConnected = await StorageService.verifyActiveConnection();
                let hadAccessBefore = false;
                setHadLibraryAccess(prev => {
                    hadAccessBefore = prev;
                    return prev || stillConnected;
                });
                if (!stillConnected && hadAccessBefore) {
                    addNotification('warning', 'Lost access to your local library. Please reconnect.');
                }
            } catch (error) {
                console.error('Failed to verify library connection', error);
            }

            refreshLibrary();
            loadWorlds().catch((error: Error) => {
                console.error('Failed to load worlds:', error);
                const errorMsg = error?.message || 'Failed to load saved worlds. Please try reconnecting your library.';
                addNotification('error', errorMsg);
            });
        };

        verifyAndLoad();

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [props.show, loadWorlds, addNotification, refreshLibrary, libraryRestored]);

    useEffect(() => {
        if (props.hero?.name && props.hero.name.length > 2 && props.hero.base64) {
            const timer = setTimeout(() => {
                StorageService.saveCharacter(props.hero!)
                    .then(refreshLibrary)
                    .catch(error => {
                        console.error('Failed to save hero:', error);
                        actions.addNotification('warning', 'Hero saved locally but failed to persist to library');
                    });
            }, 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [props.hero]);

    useEffect(() => {
        if (props.friend?.name && props.friend.name.length > 2 && props.friend.base64) {
            const timer = setTimeout(() => {
                StorageService.saveCharacter(props.friend!)
                    .then(refreshLibrary)
                    .catch(error => {
                        console.error('Failed to save sidekick:', error);
                        actions.addNotification('warning', 'Sidekick saved locally but failed to persist to library');
                    });
            }, 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [props.friend]);

    useEffect(() => {
        if (!props.config.modelPresetId && presets.length) {
            const fallback = presets[0];
            props.onConfigChange({
                modelPresetId: fallback.id,
                modelPresetModel: fallback.model,
                modelPresetPrompt: fallback.prompt,
            });
        }
    }, [presets, props.config.modelPresetId, props.onConfigChange]);

    const activePreset = useMemo(() => {
        return getPresetById(props.config.modelPresetId) || presets[0];
    }, [getPresetById, presets, props.config.modelPresetId]);

    const handlePresetSelect = (id: string) => {
        const preset = getPresetById(id) || presets.find(p => p.id === id);
        if (preset) {
            props.onConfigChange({
                modelPresetId: preset.id,
                modelPresetModel: preset.model,
                modelPresetPrompt: preset.prompt,
            });
        }
    };

    const sortedCharacters = useMemo(() => {
        if (!state.currentWorld) return savedCharacters;
        return [...savedCharacters].sort((a, b) => {
            const aLinked = state.currentWorld?.linkedPersonaIds.includes(a.id);
            const bLinked = state.currentWorld?.linkedPersonaIds.includes(b.id);
            if (aLinked && !bLinked) return -1;
            if (!aLinked && bLinked) return 1;
            return 0;
        });
    }, [savedCharacters, state.currentWorld]);

    if (!props.show && !props.isTransitioning) return null;

    const handleLoadCharacter = (e: React.ChangeEvent<HTMLSelectElement>, target: 'hero' | 'friend') => {
        const id = e.target.value;
        const saved = savedCharacters.find(h => h.id === id);
        if (saved) {
            if (target === 'hero') {
                props.onHeroUpdate({ ...saved });
            } else {
                props.onFriendUpdate({ ...saved });
            }
        }
    };

    const handleSaveWorld = (world: World) => {
        actions.saveWorld(world)
            .then(() => {
                actions.addNotification('success', `World "${world.name}" saved successfully!`, 3000);
                actions.setWorld(world);
                setShowWorldBuilder(false);
                setEditingWorld(null);
            })
            .catch((error: Error) => {
                console.error('Failed to save world:', error);
                actions.addNotification('error', 'Failed to save world. Please try again.');
            });
    };

    const handleEditWorld = (world: World) => {
        setEditingWorld(world);
        setShowWorldBuilder(true);
    };

    const handleSaveCharacter = async (character: Persona & { id?: string }) => {
        try {
            // Save with existing ID if editing, otherwise create new
            await StorageService.saveCharacter(character, character.id);
            actions.addNotification('success', `Character "${character.name}" saved successfully!`, 3000);
            
            // Refresh the library to show updated character
            await refreshLibrary();
            
            // Close the builder
            setShowCharacterBuilder(false);
            setEditingCharacter(null);
        } catch (error) {
            console.error('Failed to save character:', error);
            actions.addNotification('error', 'Failed to save character. Please try again.');
        }
    };

    const handleEditCharacter = (character: Persona & {id:string}) => {
        setEditingCharacter(character);
        setShowCharacterBuilder(true);
    };

    const handleDeleteCharacter = async (id: string) => {
        try {
            await StorageService.deleteCharacter(id);
            actions.addNotification('success', 'Character deleted successfully', 3000);
            
            // Refresh library to update the list
            await refreshLibrary();
            
            // Close the builder
            setShowCharacterBuilder(false);
            setEditingCharacter(null);
        } catch (error) {
            console.error('Failed to delete character:', error);
            actions.addNotification('error', 'Failed to delete character. Please try again.');
        }
    };

    const handleConnectStorage = async () => {
        try {
            const connected = await StorageService.connectLocalLibrary();
            if (connected) {
                actions.addNotification('success', 'Local library connected successfully!', 3000);
                refreshLibrary();
                actions.loadWorlds().catch((error: Error) => {
                    console.error('Failed to load worlds after connection:', error);
                    const errorMsg = error?.message || 'Library connected but failed to load worlds';
                    actions.addNotification('warning', errorMsg);
                });
            } else {
                actions.addNotification('info', 'Library connection cancelled');
            }
        } catch (error) {
            console.error('Failed to connect library:', error);
            actions.addNotification('error', 'Failed to connect to local library. Please try again.');
        }
    };

    const handleDeleteWorld = (worldId: string, worldName: string) => {
        if (!window.confirm(`Are you sure you want to delete the world "${worldName}"? This action cannot be undone.`)) {
            return;
        }

        actions.deleteWorld(worldId)
            .then(() => {
                actions.addNotification('success', `World "${worldName}" deleted successfully`, 3000);
                actions.setWorld(null);
            })
            .catch((error: Error) => {
                console.error('Failed to delete world:', error);
                actions.addNotification('error', `Failed to delete world "${worldName}". Please try again.`);
            });
    };

    return (
        <>
        {showCharacterBuilder && (
            <CharacterBuilder
                existingCharacter={editingCharacter}
                onSave={handleSaveCharacter}
                onDelete={handleDeleteCharacter}
                onCancel={() => {
                    setShowCharacterBuilder(false);
                    setEditingCharacter(null);
                }}
                addNotification={actions.addNotification}
            />
        )}

        {showWorldBuilder && (
            <WorldBuilder
                existingWorld={editingWorld}
                savedHeroes={savedCharacters}
                onSave={handleSaveWorld}
                onCancel={() => {
                    setShowWorldBuilder(false);
                    setEditingWorld(null);
                }}
                addNotification={actions.addNotification}
            />
        )}

        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none animate-pow-enter">
                <svg viewBox="0 0 200 150" className="w-[500px] h-[400px] drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]">
                    <path d="M95.7,12.8 L110.2,48.5 L148.5,45.2 L125.6,74.3 L156.8,96.8 L119.4,105.5 L122.7,143.8 L92.5,118.6 L60.3,139.7 L72.1,103.2 L34.5,108.8 L59.9,79.9 L24.7,57.3 L62.5,54.4 L61.2,16.5 z" fill="#FFD700" stroke="black" strokeWidth="4"/>
                    <text x="100" y="95" textAnchor="middle" fontFamily="'Bangers', cursive" fontSize="70" fill="#DC2626" stroke="black" strokeWidth="2" transform="rotate(-5 100 75)">POW!</text>
                </svg>
                {state.loadingProgress && (
                    <div className="absolute top-[80%] left-1/2 -translate-x-1/2 w-64 text-center">
                        <p className="font-comic text-2xl text-white drop-shadow-[2px_2px_0_black] animate-pulse mb-1">
                            {state.loadingProgress.label}
                        </p>
                        <div className="w-full h-4 border-2 border-black bg-white">
                            <div className="h-full bg-yellow-400 transition-all duration-300" style={{width: `${(state.loadingProgress.current / state.loadingProgress.total) * 100}%`}}></div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); actions.abortGeneration(); }}
                          className="comic-btn bg-red-500 text-white text-xs px-3 py-1 mt-2 hover:bg-red-400"
                        >
                          Abort Generation
                        </button>
                    </div>
                )}
            </div>
        )}
        
        <div className={`fixed inset-0 z-[200] overflow-y-auto transition-all duration-1000 ${props.isTransitioning ? 'bg-transparent backdrop-blur-none pointer-events-none animate-knockout-exit' : 'bg-black/85 backdrop-blur-sm'}`}>
          <div className="min-h-full flex items-center justify-center p-3 sm:p-4 pb-28 sm:pb-32 md:pb-24">
            <div className="max-w-[1100px] w-full bg-white p-3 sm:p-4 md:p-5 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] text-center relative">
                
                <div className="mb-3 sm:mb-4">
                  <h1 className="font-comic text-3xl sm:text-4xl text-red-600 leading-none mb-1 tracking-wide inline-block mr-2 sm:mr-3" style={{textShadow: '2px 2px 0px black'}}>INFINITE</h1>
                  <h1 className="font-comic text-3xl sm:text-4xl text-yellow-400 leading-none tracking-wide inline-block" style={{textShadow: '2px 2px 0px black'}}>HEROES</h1>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 font-sans px-2">Focus on the essentials first. You can collapse sections you are done with to keep the workspace clear.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 text-left">

                    <SectionCard
                      title="1. The Cast"
                      subtitle="Upload and describe your leads."
                      actions={
                        <button 
                            onClick={() => {
                                setEditingCharacter(null);
                                setShowCharacterBuilder(true);
                            }} 
                            className="text-xs bg-black text-white px-3 py-2 sm:px-2 sm:py-1 font-bold uppercase hover:bg-gray-800 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center"
                        >
                            + NEW
                        </button>
                      }
                    >
                        <div className={`p-3 border-2 border-dashed ${props.hero ? 'border-green-500 bg-green-50' : 'border-blue-200 bg-blue-50'} transition-colors relative group rounded-md`}>
                            <div className="flex justify-between items-center mb-2 gap-2">
                                <p className="font-comic text-base sm:text-lg uppercase font-bold text-blue-900">HERO (REQUIRED)</p>
                                {savedCharacters.length > 0 && (
                                    <select onChange={(e) => handleLoadCharacter(e, 'hero')} className="text-xs font-sans border border-black p-1.5 sm:p-1 bg-yellow-100 rounded w-24 sm:w-28 touch-manipulation">
                                        <option value="">📂 {props.hero ? 'Swap' : 'Load'}...</option>
                                        {sortedCharacters.map(h => (
                                            <option key={h.id} value={h.id}>
                                                {state.currentWorld?.linkedPersonaIds.includes(h.id) ? '★ ' : ''}{h.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {props.hero ? (
                                <div className="flex gap-2 sm:gap-3 items-start mt-1">
                                     <div className="flex flex-col gap-2">
                                        <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero Preview" className="w-20 h-20 sm:w-16 sm:h-16 object-cover border-2 border-black bg-white rounded" />
                                        <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-[10px] px-2 py-2 sm:px-1 sm:py-1 hover:bg-yellow-300 uppercase flex items-center justify-center touch-manipulation min-h-[44px] sm:min-h-0">
                                            REPLACE
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                        </label>
                                     </div>
                                     <div className="flex-1 flex flex-col gap-2">
                                         <input
                                            type="text"
                                            placeholder="Hero Name"
                                            className="w-full border-2 border-black p-2 sm:p-2 font-comic text-base sm:text-base focus:outline-none rounded touch-manipulation min-h-[44px] sm:min-h-0"
                                            value={props.hero.name || ''}
                                            onChange={(e) => props.onHeroUpdate({name: e.target.value})}
                                         />
                                         <textarea
                                            placeholder="Description..."
                                            className="w-full border-2 border-black p-2 sm:p-2 font-comic text-sm sm:text-xs h-20 sm:h-16 resize-none focus:outline-none leading-tight rounded touch-manipulation"
                                            value={props.hero.description || ''}
                                            onChange={(e) => props.onHeroUpdate({description: e.target.value})}
                                         />
                                     </div>
                                </div>
                            ) : (
                                <label className="comic-btn bg-blue-500 text-white text-base sm:text-lg px-4 py-4 sm:px-3 sm:py-3 block w-full hover:bg-blue-400 cursor-pointer text-center rounded touch-manipulation min-h-[56px]">
                                    UPLOAD HERO
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>

                        <div className={`p-3 border-2 border-dashed ${props.friend ? 'border-green-500 bg-green-50' : 'border-purple-200 bg-purple-50'} transition-colors rounded-md`}>
                            <div className="flex justify-between items-center mb-1 gap-2">
                                <p className="font-comic text-base sm:text-lg uppercase font-bold text-purple-900">CO-STAR</p>
                                {savedCharacters.length > 0 && (
                                    <select onChange={(e) => handleLoadCharacter(e, 'friend')} className="text-xs font-sans border border-black p-1.5 sm:p-1 bg-yellow-100 rounded w-24 sm:w-28 touch-manipulation">
                                        <option value="">📂 {props.friend ? 'Swap' : 'Load'}...</option>
                                        {sortedCharacters.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {props.friend ? (
                                <div className="flex gap-2 sm:gap-3 items-start mt-1">
                                    <div className="flex flex-col gap-2">
                                        <img src={`data:image/jpeg;base64,${props.friend.base64}`} alt="Co-Star Preview" className="w-20 h-20 sm:w-16 sm:h-16 object-cover border-2 border-black bg-white rounded" />
                                        <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-[10px] px-2 py-2 sm:px-1 sm:py-1 hover:bg-yellow-300 uppercase flex items-center justify-center touch-manipulation min-h-[44px] sm:min-h-0">
                                            REPLACE
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                        </label>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                         <input
                                            type="text"
                                            placeholder="Co-Star Name"
                                            className="w-full border-2 border-black p-2 sm:p-2 font-comic text-base sm:text-base focus:outline-none rounded touch-manipulation min-h-[44px] sm:min-h-0"
                                            value={props.friend.name || ''}
                                            onChange={(e) => props.onFriendUpdate({name: e.target.value})}
                                         />
                                         <textarea
                                            placeholder="Description..."
                                            className="w-full border-2 border-black p-2 sm:p-2 font-comic text-sm sm:text-xs h-20 sm:h-16 resize-none focus:outline-none leading-tight rounded touch-manipulation"
                                            value={props.friend.description || ''}
                                            onChange={(e) => props.onFriendUpdate({description: e.target.value})}
                                         />
                                     </div>
                                </div>
                            ) : (
                                <label className="comic-btn bg-purple-500 text-white text-base sm:text-base px-3 py-3 sm:px-2 sm:py-2 block w-full hover:bg-purple-400 cursor-pointer text-center rounded touch-manipulation min-h-[52px] sm:min-h-0">
                                    UPLOAD CO-STAR
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>

                        {savedCharacters.length > 0 && (
                            <div className="mt-2 p-3 border-2 border-gray-200 bg-gray-50 rounded-md">
                                <p className="font-comic text-sm font-bold text-gray-700 mb-2">CHARACTER LIBRARY ({savedCharacters.length})</p>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {sortedCharacters.map(char => (
                                        <button
                                            key={char.id}
                                            onClick={() => handleEditCharacter(char)}
                                            className="px-2 py-1 border-2 border-black text-xs font-bold uppercase bg-white hover:bg-blue-100 transition-colors shadow-[2px_2px_0px_black] hover:shadow-[1px_1px_0px_black] active:shadow-none"
                                            title={`Click to edit ${char.name}`}
                                        >
                                            ✏️ {char.name}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Click any character to edit details or add more reference images</p>
                            </div>
                        )}
                    </SectionCard>

                    <div className="flex flex-col gap-4">
                        <SectionCard
                          title="2. The World"
                          subtitle="Optional setting, references stay hidden when you collapse."
                          actions={<button onClick={() => setShowWorldBuilder(true)} className="text-xs bg-black text-white px-3 py-2 sm:px-2 sm:py-1 font-bold uppercase hover:bg-gray-800 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center">+ NEW</button>}
                          defaultOpen={false}
                        >
                            <div className="flex flex-col gap-3">
                                <select
                                    value={state.currentWorld?.id || ""}
                                    onChange={(e) => {
                                        const w = state.availableWorlds.find(w => w.id === e.target.value) || null;
                                        actions.setWorld(w);
                                    }}
                                    className="w-full font-comic text-base sm:text-lg p-2.5 sm:p-2 border-2 border-black bg-white shadow-[3px_3px_0px_rgba(0,0,0,0.1)] focus:outline-none rounded touch-manipulation min-h-[44px] sm:min-h-0"
                                >
                                    <option value="">(No World Selected)</option>
                                    {state.availableWorlds.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>

                                {state.currentWorld ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="bg-white border-2 border-black p-3 flex-1 rounded">
                                            <p className="font-comic text-xl text-blue-600 border-b-2 border-gray-200 mb-1">{state.currentWorld.name}</p>
                                            <p className="text-xs text-gray-700 leading-tight font-sans">{state.currentWorld.description}</p>

                                            {state.currentWorld.images.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {state.currentWorld.images.map((img, i) => (
                                                        <img key={i} src={`data:image/jpeg;base64,${img}`} className="w-10 h-10 object-cover border border-black rounded" alt="tiny ref" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button 
                                                onClick={() => handleEditWorld(state.currentWorld!)} 
                                                className="text-[12px] text-blue-500 underline hover:text-blue-700"
                                            >
                                                Edit World
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteWorld(state.currentWorld!.id, state.currentWorld!.name)} 
                                                className="text-[12px] text-red-500 underline hover:text-red-700"
                                            >
                                                Delete World
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 border-2 border-dashed border-gray-300 flex items-center justify-center text-center p-4 rounded">
                                        <p className="text-gray-500 font-comic text-lg">Keep it simple or add a custom world when ready.</p>
                                    </div>
                                )}
                             </div>
                        </SectionCard>

                        <SectionCard
                          title="3. The Story"
                          subtitle="Pick a vibe and opening."
                        >
                            <div className="bg-yellow-50 p-3 border-2 border-black flex flex-col gap-3 rounded">
                                <div className="mb-1">
                                    <p className="font-comic text-sm sm:text-base mb-1 font-bold text-gray-800">GENRE</p>
                                    <select value={props.config.genre} onChange={(e) => props.onConfigChange({ genre: e.target.value })} className="w-full font-comic text-base sm:text-lg p-2.5 sm:p-2 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none transition-all rounded touch-manipulation min-h-[44px] sm:min-h-0">
                                        {GENRES.map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                                    </select>
                                </div>

                                <div className="mb-1">
                                    <p className="font-comic text-sm sm:text-base mb-1 font-bold text-gray-800">LANGUAGE</p>
                                    <select value={props.config.language} onChange={(e) => props.onConfigChange({ language: e.target.value })} className="w-full font-comic text-base sm:text-lg p-2.5 sm:p-2 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)] rounded touch-manipulation min-h-[44px] sm:min-h-0">
                                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-black">{l.name}</option>)}
                                    </select>
                                </div>

                                <div className="mb-1">
                                    <p className="font-comic text-sm sm:text-base mb-1 font-bold text-gray-800">MODEL PRESET</p>
                                    <select
                                        value={activePreset?.id || ''}
                                        onChange={(e) => handlePresetSelect(e.target.value)}
                                        className="w-full font-comic text-base sm:text-lg p-2.5 sm:p-2 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)] rounded touch-manipulation min-h-[44px] sm:min-h-0"
                                    >
                                        {presets.map((preset) => (
                                            <option key={preset.id} value={preset.id} className="text-black">
                                                {preset.name} ({preset.model})
                                            </option>
                                        ))}
                                    </select>
                                    {activePreset && (
                                        <p className="text-[10px] sm:text-[11px] text-gray-600 mt-1 leading-snug">
                                            <span className="font-semibold">Guidance:</span> {activePreset.prompt}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-1">
                                    <p className="font-comic text-sm sm:text-base mb-1 font-bold text-gray-800">OPENING SCENE / PROMPT</p>
                                    <textarea
                                        value={props.config.openingPrompt}
                                        onChange={(e) => props.onConfigChange({ openingPrompt: e.target.value })}
                                        placeholder="E.g., The hero wakes up in a dumpster behind a neon-lit sushi bar..."
                                        className="w-full p-2.5 sm:p-2 border-2 border-black font-comic text-base sm:text-lg h-28 sm:h-24 resize-none shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none leading-tight rounded touch-manipulation"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Be specific! This sets the initial direction.</p>
                                </div>

                                <label className="flex items-center gap-2 sm:gap-2 font-comic text-sm sm:text-base cursor-pointer text-black mt-1 p-3 sm:p-2 hover:bg-yellow-100 rounded border-2 border-transparent hover:border-yellow-300 transition-colors touch-manipulation min-h-[52px] sm:min-h-0">
                                    <input type="checkbox" checked={props.config.richMode} onChange={(e) => props.onConfigChange({ richMode: e.target.checked })} className="w-5 h-5 sm:w-4 sm:h-4 accent-black flex-shrink-0" />
                                    <span className="text-black">NOVEL MODE (Rich Dialogue)</span>
                                </label>
                            </div>
                        </SectionCard>
                    </div>
                </div>

                <button onClick={props.onLaunch} disabled={!props.hero || props.isTransitioning || !isOnline} className="comic-btn bg-red-600 text-white text-xl sm:text-2xl md:text-3xl px-4 py-4 sm:px-6 sm:py-3 w-full hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-wider touch-manipulation min-h-[60px]">
                    {props.isTransitioning ? 'LAUNCHING...' : isOnline ? 'START ADVENTURE!' : 'OFFLINE - CANNOT LAUNCH'}
                </button>
            </div>
          </div>
        </div>

        <Footer isInstallable={isInstallable} isInstalled={isInstalled} onInstall={promptInstall} onConnectStorage={handleConnectStorage} />
        </>
    );
}
