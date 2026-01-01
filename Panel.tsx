
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useBook } from './context/BookContext';
import { LoadingFX } from './LoadingFX';
import { ComicFace, INITIAL_PAGES, GATE_PAGE } from './types';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[];
    onOpenBook: () => void;
    onDownload: () => void;
}

export const Panel: React.FC<PanelProps> = React.memo(({ face, allFaces, onOpenBook, onDownload }) => {
    const { actions } = useBook();

    if (!face) return <div className="w-full h-full bg-gray-950" />;
    if (face.isLoading && !face.imageUrl) return <LoadingFX />;
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <div className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}>
            <div className="gloss"></div>
            {face.imageUrl && <img src={face.imageUrl} alt="Comic panel" className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />}
            
            {/* Decision Buttons - Enhanced for mobile with better touch targets */}
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 pb-10 sm:pb-12 flex flex-col gap-3 sm:gap-4 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20`}>
                    <p className="text-white font-comic text-lg sm:text-2xl uppercase tracking-widest animate-pulse text-center">What drives you?</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) actions.handleChoice(face.pageIndex, choice); }}
                          className={`comic-btn w-full py-4 sm:py-4 text-base sm:text-xl font-bold tracking-wider touch-manipulation min-h-[56px] active:scale-95 transition-transform ${i===0?'bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500':'bg-blue-500 text-white hover:bg-blue-400 active:bg-blue-600'}`}>
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            {/* Cover Action - Enhanced for mobile */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-16 sm:bottom-20 inset-x-0 flex justify-center z-20 px-4">
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                      className="comic-btn bg-yellow-400 px-6 sm:px-10 py-5 text-2xl sm:text-3xl font-bold hover:scale-105 animate-bounce disabled:animate-none disabled:bg-gray-400 disabled:cursor-wait touch-manipulation min-h-[64px] active:scale-95 transition-transform w-full sm:w-auto max-w-sm">
                         {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? `PRINTING... ${allFaces.filter(f => f.type==='story' && f.imageUrl && (f.pageIndex||0) <= GATE_PAGE).length}/${INITIAL_PAGES}` : 'READ ISSUE #1'}
                     </button>
                 </div>
            )}

            {/* Back Cover Actions - Enhanced for mobile */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-20 sm:bottom-24 inset-x-0 flex flex-col items-center gap-4 sm:gap-5 z-20 px-4">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="comic-btn bg-blue-500 text-white px-6 sm:px-8 py-4 text-lg sm:text-xl font-bold hover:scale-105 active:scale-95 transition-transform touch-manipulation min-h-[56px] w-full sm:w-auto max-w-sm">DOWNLOAD ISSUE</button>
                    <button onClick={(e) => { e.stopPropagation(); actions.reset(); }} className="comic-btn bg-green-500 text-white px-6 sm:px-8 py-5 text-xl sm:text-2xl font-bold hover:scale-105 active:scale-95 transition-transform touch-manipulation min-h-[64px] w-full sm:w-auto max-w-sm">CREATE NEW ISSUE</button>
                </div>
            )}
        </div>
    );
});
