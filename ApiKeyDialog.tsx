
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-lg w-full bg-white border-[6px] border-black shadow-[16px_16px_0px_rgba(0,0,0,1)] p-8 rotate-1 animate-in fade-in zoom-in duration-300">
        
        {/* Floating Icon Badge */}
        <div className="absolute -top-8 -left-8 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-bounce">
           <span className="text-5xl">🔑</span>
        </div>

        <h2 className="font-comic text-5xl text-red-600 mb-4 uppercase tracking-wide leading-none" style={{textShadow: '2px 2px 0px black'}}>
          Secret Identity Required!
        </h2>
        
        <p className="font-comic text-xl text-black mb-6 leading-relaxed">
          Halt, Citizen! To access the infinite multiverse (and generate these amazing comics), you need a <span className="font-bold bg-yellow-200 px-1 border border-black">Paid API Key</span>.
        </p>

        <div className="bg-gray-100 border-2 border-black border-dashed p-4 mb-6 text-left relative">
             <div className="absolute -top-3 left-4 bg-black text-white px-2 font-comic text-sm uppercase">Mission Briefing</div>
             <p className="font-sans text-sm text-gray-800 leading-relaxed">
                Gemini 3 Pro Image Preview is a powerful model that require a billing-enabled project to operate. 
                <br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 font-bold">Read the Billing Docs &rarr;</a>
             </p>
        </div>

        <button 
          onClick={onContinue}
          className="comic-btn bg-blue-500 text-white text-2xl px-8 py-4 w-full hover:bg-blue-400 transition-transform active:scale-95 uppercase tracking-widest"
        >
          Unlock The Multiverse
        </button>
        
        <p className="text-center text-xs text-gray-400 mt-4 font-mono">ERROR_CODE: PAYWALL_VILLAIN_DETECTED</p>
      </div>
    </div>
  );
};
