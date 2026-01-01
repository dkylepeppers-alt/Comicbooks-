
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';
import { GENRES, LANGUAGES, Persona, StoryConfig, World } from './types';
import { usePWA } from './hooks/usePWA';
import { StorageService } from './services/storage';
import { useBook } from './context/BookContext';
import { WorldBuilder } from './components/WorldBuilder';

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
  const [remixIndex, setRemixIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const remixes = [
    "Add sounds to panels",
    "Animate panels with Veo 3",
    "Localize to Klingon",
    "Add a villain generator",
    "Print physical copies",
    "Add voice narration",
    "Create a shared universe"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRemixIndex(prev => (prev + 1) % remixes.length);
    }, 3000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    }
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic transition-colors ${isOnline ? 'bg-black text-white' : 'bg-red-800 text-gray-200'}`}>
        <div className="flex items-center gap-2 text-lg md:text-xl">
            {!isOnline ? (
                <span className="text-white font-bold animate-pulse">⚠️ OFFLINE MODE - CHECK CONNECTION</span>
            ) : (
                <>
                    <span className="text-yellow-400 font-bold">REMIX IDEA:</span>
                    <span className="animate-pulse">{remixes[remixIndex]}</span>
                </>
            )}
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
            <button onClick={onConnectStorage} className="comic-btn bg-blue-600 text-white text-xs px-2 py-1 hover:bg-blue-500 uppercase">
                📂 Connect Local Library
            </button>
            
            {isInstallable && (
                <button onClick={onInstall} className="comic-btn bg-white text-black text-xs px-2 py-1 hover:bg-gray-200 uppercase animate-bounce">
                    📲 Install App
                </button>
            )}
            
            {isInstalled && (
                <span className="text-green-400 text-xs font-bold border border-green-400 px-2 py-1 rounded">
                    ✓ INSTALLED
                </span>
            )}

            <span className="text-gray-500 text-sm hidden md:inline">Build with Gemini</span>
        </div>
    </div>
  );
};

export const Setup: React.FC<SetupProps> = (props) => {
    const { isInstallable, isInstalled, promptInstall } = usePWA();
    const { state, actions } = useBook();
    const { addNotification, loadWorlds } = actions;
    const [savedCharacters, setSavedCharacters] = useState<(Persona & {id:string})[]>([]);
    const [showWorldBuilder, setShowWorldBuilder] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const refreshLibrary = React.useCallback(() => {
        StorageService.getCharacters()
            .then(setSavedCharacters)
            .catch(error => {
                console.error('Failed to load character library:', error);
                addNotification('error', 'Failed to load saved characters. Please try reconnecting your library.');
            });
    }, [addNotification]);

    useEffect(() => {
        refreshLibrary();
        loadWorlds().catch((error: Error) => {
            console.error('Failed to load worlds:', error);
            addNotification('error', 'Failed to load saved worlds. Please try reconnecting your library.');
        });

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [props.show, loadWorlds, addNotification, refreshLibrary]);

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
            })
            .catch((error: Error) => {
                console.error('Failed to save world:', error);
                actions.addNotification('error', 'Failed to save world. Please try again.');
            });
    };

    const handleConnectStorage = async () => {
        try {
            const connected = await StorageService.connectLocalLibrary();
            if (connected) {
                actions.addNotification('success', 'Local library connected successfully!', 3000);
                refreshLibrary();
                actions.loadWorlds().catch((error: Error) => {
                    console.error('Failed to load worlds after connection:', error);
                    actions.addNotification('warning', 'Library connected but failed to load worlds');
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
        {showWorldBuilder && (
            <WorldBuilder
                savedHeroes={savedCharacters}
                onSave={handleSaveWorld}
                onCancel={() => setShowWorldBuilder(false)}
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
          <div className="min-h-full flex items-center justify-center p-4 pb-32 md:pb-24">
            <div className="max-w-[1100px] w-full bg-white p-4 md:p-5 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] text-center relative">
                
                <h1 className="font-comic text-5xl text-red-600 leading-none mb-1 tracking-wide inline-block mr-3" style={{textShadow: '2px 2px 0px black'}}>INFINITE</h1>
                <h1 className="font-comic text-5xl text-yellow-400 leading-none mb-4 tracking-wide inline-block" style={{textShadow: '2px 2px 0px black'}}>HEROES</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-left">
                    
                    {/* COLUMN 1: THE CAST */}
                    <div className="flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1 flex justify-between items-end">
                            <span>1. THE CAST</span>
                        </div>
                        
                        <div className={`p-3 border-4 border-dashed ${props.hero ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50'} transition-colors relative group`}>
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-comic text-lg uppercase font-bold text-blue-900">HERO (REQUIRED)</p>
                                {savedCharacters.length > 0 && (
                                    <select onChange={(e) => handleLoadCharacter(e, 'hero')} className="text-xs font-sans border border-black p-1 bg-yellow-100 rounded w-24">
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
                                <div className="flex gap-2 items-start mt-1">
                                     <div className="flex flex-col gap-2">
                                        <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero Preview" className="w-16 h-16 object-cover border-2 border-black bg-white rotate-[-2deg]" />
                                        <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-[10px] px-1 py-1 hover:bg-yellow-300 uppercase flex items-center justify-center">
                                            REPLACE
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                        </label>
                                     </div>
                                     <div className="flex-1 flex flex-col gap-1">
                                         <input 
                                            type="text" 
                                            placeholder="Hero Name" 
                                            className="w-full border-2 border-black p-1 font-comic text-base focus:outline-none"
                                            value={props.hero.name || ''}
                                            onChange={(e) => props.onHeroUpdate({name: e.target.value})}
                                         />
                                         <textarea 
                                            placeholder="Description..." 
                                            className="w-full border-2 border-black p-1 font-comic text-xs h-12 resize-none focus:outline-none leading-tight"
                                            value={props.hero.description || ''}
                                            onChange={(e) => props.onHeroUpdate({description: e.target.value})}
                                         />
                                     </div>
                                </div>
                            ) : (
                                <label className="comic-btn bg-blue-500 text-white text-lg px-3 py-3 block w-full hover:bg-blue-400 cursor-pointer text-center">
                                    UPLOAD HERO 
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>

                        <div className={`p-3 border-4 border-dashed ${props.friend ? 'border-green-500 bg-green-50' : 'border-purple-300 bg-purple-50'} transition-colors`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-comic text-lg uppercase font-bold text-purple-900">CO-STAR</p>
                                {savedCharacters.length > 0 && (
                                    <select onChange={(e) => handleLoadCharacter(e, 'friend')} className="text-xs font-sans border border-black p-1 bg-yellow-100 rounded w-24">
                                        <option value="">📂 {props.friend ? 'Swap' : 'Load'}...</option>
                                        {sortedCharacters.map(h => (
                                            <option key={h.id} value={h.id}>{h.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {props.friend ? (
                                <div className="flex gap-2 items-start mt-1">
                                    <div className="flex flex-col gap-2">
                                        <img src={`data:image/jpeg;base64,${props.friend.base64}`} alt="Co-Star Preview" className="w-16 h-16 object-cover border-2 border-black bg-white rotate-[2deg]" />
                                        <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-[10px] px-1 py-1 hover:bg-yellow-300 uppercase flex items-center justify-center">
                                            REPLACE
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                        </label>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                         <input 
                                            type="text" 
                                            placeholder="Co-Star Name" 
                                            className="w-full border-2 border-black p-1 font-comic text-base focus:outline-none"
                                            value={props.friend.name || ''}
                                            onChange={(e) => props.onFriendUpdate({name: e.target.value})}
                                         />
                                         <textarea 
                                            placeholder="Description..." 
                                            className="w-full border-2 border-black p-1 font-comic text-xs h-12 resize-none focus:outline-none leading-tight"
                                            value={props.friend.description || ''}
                                            onChange={(e) => props.onFriendUpdate({description: e.target.value})}
                                         />
                                     </div>
                                </div>
                            ) : (
                                <label className="comic-btn bg-purple-500 text-white text-base px-2 py-2 block w-full hover:bg-purple-400 cursor-pointer text-center">
                                    UPLOAD CO-STAR 
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* COLUMN 2: THE WORLD */}
                    <div className="flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">2. THE WORLD</div>
                        
                        <div className="bg-gray-100 p-3 border-4 border-black h-full flex flex-col relative overflow-hidden">
                             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>

                             <div className="relative z-10 flex flex-col gap-3 h-full">
                                <div className="flex justify-between items-center">
                                    <label className="font-comic text-base font-bold text-gray-800">SELECT WORLD</label>
                                    <button onClick={() => setShowWorldBuilder(true)} className="text-xs bg-black text-white px-2 py-1 font-bold uppercase hover:bg-gray-800">+ NEW</button>
                                </div>

                                <select 
                                    value={state.currentWorld?.id || ""} 
                                    onChange={(e) => {
                                        const w = state.availableWorlds.find(w => w.id === e.target.value) || null;
                                        actions.setWorld(w);
                                    }}
                                    className="w-full font-comic text-lg p-2 border-2 border-black bg-white shadow-[3px_3px_0px_rgba(0,0,0,0.1)] focus:outline-none"
                                >
                                    <option value="">(No World Selected)</option>
                                    {state.availableWorlds.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>

                                {state.currentWorld ? (
                                    <div className="flex-1 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="bg-white border-2 border-black p-2 flex-1 relative">
                                            <p className="font-comic text-xl text-blue-600 border-b-2 border-gray-200 mb-1">{state.currentWorld.name}</p>
                                            <p className="text-xs text-gray-600 line-clamp-4 leading-tight font-sans">{state.currentWorld.description}</p>
                                            
                                            {state.currentWorld.images.length > 0 && (
                                                <div className="flex gap-1 mt-2 absolute bottom-2 right-2">
                                                    {state.currentWorld.images.map((img, i) => (
                                                        <img key={i} src={`data:image/jpeg;base64,${img}`} className="w-8 h-8 object-cover border border-black rounded-full" alt="tiny ref" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => handleDeleteWorld(state.currentWorld!.id, state.currentWorld!.name)} className="text-[10px] text-red-500 underline self-end hover:text-red-700">Delete World</button>
                                    </div>
                                ) : (
                                    <div className="flex-1 border-2 border-dashed border-gray-400 flex items-center justify-center text-center p-4">
                                        <p className="text-gray-400 font-comic text-xl">Select or Create a World to ground your story.</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>

                    {/* COLUMN 3: THE STORY */}
                    <div className="flex flex-col gap-2">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">3. THE STORY</div>
                        
                        <div className="bg-yellow-50 p-3 border-4 border-black h-full flex flex-col justify-between">
                            <div>
                                <div className="mb-2">
                                    <p className="font-comic text-base mb-1 font-bold text-gray-800">GENRE</p>
                                    <select value={props.config.genre} onChange={(e) => props.onConfigChange({ genre: e.target.value })} className="w-full font-comic text-lg p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none transition-all">
                                        {GENRES.map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                                    </select>
                                </div>

                                <div className="mb-2">
                                    <p className="font-comic text-base mb-1 font-bold text-gray-800">LANGUAGE</p>
                                    <select value={props.config.language} onChange={(e) => props.onConfigChange({ language: e.target.value })} className="w-full font-comic text-lg p-1 border-2 border-black uppercase bg-white text-black cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                                        {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-black">{l.name}</option>)}
                                    </select>
                                </div>

                                <div className="mb-2">
                                    <p className="font-comic text-base mb-1 font-bold text-gray-800">OPENING SCENE / PROMPT</p>
                                    <textarea 
                                        value={props.config.openingPrompt} 
                                        onChange={(e) => props.onConfigChange({ openingPrompt: e.target.value })} 
                                        placeholder="E.g., The hero wakes up in a dumpster behind a neon-lit sushi bar..." 
                                        className="w-full p-2 border-2 border-black font-comic text-lg h-24 resize-none shadow-[3px_3px_0px_rgba(0,0,0,0.2)] focus:outline-none leading-tight" 
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Be specific! This sets the initial direction.</p>
                                </div>
                            </div>
                            
                            <label className="flex items-center gap-2 font-comic text-base cursor-pointer text-black mt-1 p-1 hover:bg-yellow-100 rounded border-2 border-transparent hover:border-yellow-300 transition-colors">
                                <input type="checkbox" checked={props.config.richMode} onChange={(e) => props.onConfigChange({ richMode: e.target.checked })} className="w-4 h-4 accent-black" />
                                <span className="text-black">NOVEL MODE (Rich Dialogue)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <button onClick={props.onLaunch} disabled={!props.hero || props.isTransitioning || !isOnline} className="comic-btn bg-red-600 text-white text-3xl px-6 py-3 w-full hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-wider">
                    {props.isTransitioning ? 'LAUNCHING...' : isOnline ? 'START ADVENTURE!' : 'OFFLINE - CANNOT LAUNCH'}
                </button>
            </div>
          </div>
        </div>

        <Footer isInstallable={isInstallable} isInstalled={isInstalled} onInstall={promptInstall} onConnectStorage={handleConnectStorage} />
        </>
    );
}
