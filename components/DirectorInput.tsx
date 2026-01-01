
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useState } from 'react';
import { useBook } from '../context/BookContext';

interface DirectorInputProps {
    onContinue: (instruction: string) => void;
    isGenerating?: boolean;
}

export const DirectorInput: React.FC<DirectorInputProps> = ({ onContinue, isGenerating = false }) => {
    const [instruction, setInstruction] = useState("");
    const { state } = useBook();

    const heroName = state.hero?.name?.trim() || 'your hero';
    const friendName = state.friend?.name?.trim() || 'your sidekick';
    const setting = state.currentWorld?.name?.trim() || state.config.genre || 'the city';

    const branchOptions = useMemo(() => ([
        `${heroName} leads a stealthy infiltration into ${setting}, slipping past patrols to plant evidence of the villain's hidden lair.`,
        `${friendName} stages a bold distraction while ${heroName} races to free civilians trapped in a collapsing tower downtown.`,
        `A forbidden relic activates, warping ${setting} into a surreal battleground where allies and enemies suddenly switch sides.`
    ]), [friendName, heroName, setting]);

    return (
        <div className="w-full h-full bg-[#f0f0f0] p-8 flex flex-col items-center justify-center relative overflow-hidden border-r-4 border-gray-300">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
             </div>

             <div className="relative z-10 w-full max-w-md bg-white border-4 border-black p-6 shadow-[10px_10px_0px_rgba(0,0,0,0.2)] rotate-1">
                 <div className="bg-black text-white font-comic text-xl px-4 py-1 inline-block absolute -top-5 left-4 border-2 border-white shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                     DIRECTOR MODE
                 </div>

                 <h3 className="font-comic text-3xl text-center mb-4 mt-2">WHAT HAPPENS NEXT?</h3>
                 
                 <p className="font-sans text-sm text-gray-600 mb-2">
                     You are the director. Guide the AI for the next few pages. Be specific about plot twists, character actions, or sudden events.
                 </p>

                 <div className="grid grid-cols-1 gap-3 mb-4">
                     {branchOptions.map((option, index) => (
                         <button
                            key={option}
                            type="button"
                            onClick={() => onContinue(option)}
                            disabled={isGenerating}
                            className={`comic-btn w-full text-left text-lg py-3 px-4 ${isGenerating ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-yellow-300 hover:bg-yellow-200'}`}
                         >
                             <span className="font-comic mr-2">{String.fromCharCode(65 + index)}.</span>
                             {option}
                         </button>
                     ))}
                 </div>

                 <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="E.g., The villain reveals he is actually a robot, or a dragon crashes through the ceiling..."
                    className="w-full h-32 border-2 border-black p-3 font-comic text-xl mb-4 focus:outline-none focus:shadow-[4px_4px_0px_rgba(0,0,0,0.1)] resize-none"
                    autoFocus
                 />

                 <button
                    onClick={() => onContinue(instruction || "Something unexpected happens!")}
                    disabled={isGenerating}
                    className={`comic-btn w-full py-4 text-2xl ${isGenerating ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
                 >
                    {isGenerating ? 'GENERATING...' : 'GENERATE NEXT PAGES →'}
                 </button>

                 {isGenerating && (
                     <p className="text-center text-xs text-gray-500 mt-2">
                         Please wait for current pages to finish generating
                     </p>
                 )}
             </div>
        </div>
    );
};
