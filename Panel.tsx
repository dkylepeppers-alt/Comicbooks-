
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
            
            {/* Decision Buttons */}
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 pb-10 sm:pb-12 flex flex-col gap-2 sm:gap-3 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20`}>
                    <p className="text-white font-comic text-lg sm:text-2xl uppercase tracking-widest animate-pulse text-center">What drives you?</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) actions.handleChoice(face.pageIndex, choice); }}
                          className={`comic-btn w-full py-3 sm:py-3 text-base sm:text-xl font-bold tracking-wider touch-manipulation min-h-[52px] ${i===0?'bg-yellow-400 hover:bg-yellow-300':'bg-blue-500 text-white hover:bg-blue-400'}`}>
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            {/* Cover Action */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-16 sm:bottom-20 inset-x-0 flex justify-center z-20 px-4">
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                      className="comic-btn bg-yellow-400 px-6 sm:px-10 py-4 text-2xl sm:text-3xl font-bold hover:scale-105 animate-bounce disabled:animate-none disabled:bg-gray-400 disabled:cursor-wait touch-manipulation min-h-[60px] w-full sm:w-auto max-w-sm">
                         {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? `PRINTING... ${allFaces.filter(f => f.type==='story' && f.imageUrl && (f.pageIndex||0) <= GATE_PAGE).length}/${INITIAL_PAGES}` : 'READ ISSUE #1'}
                     </button>
                 </div>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-20 sm:bottom-24 inset-x-0 flex flex-col items-center gap-3 sm:gap-4 z-20 px-4">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="comic-btn bg-blue-500 text-white px-6 sm:px-8 py-3 text-lg sm:text-xl font-bold hover:scale-105 touch-manipulation min-h-[52px] w-full sm:w-auto max-w-sm">DOWNLOAD ISSUE</button>
                    <button onClick={(e) => { e.stopPropagation(); actions.reset(); }} className="comic-btn bg-green-500 text-white px-6 sm:px-8 py-4 text-xl sm:text-2xl font-bold hover:scale-105 touch-manipulation min-h-[60px] w-full sm:w-auto max-w-sm">CREATE NEW ISSUE</button>
                </div>
            )}
        </div>
    );
});
