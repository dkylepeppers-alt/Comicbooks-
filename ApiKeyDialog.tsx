
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ApiKeyDialogProps {
  onContinue: () => void;
  onSaveKey: () => void;
  onTestKey: () => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  isTesting: boolean;
  testResult: string | null;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({
  onContinue,
  onSaveKey,
  onTestKey,
  apiKey,
  onApiKeyChange,
  isTesting,
  testResult,
}) => {
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

        <div className="space-y-3 mb-4">
          <label className="block font-comic text-lg text-black">Enter your Gemini API key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="w-full border-2 border-black p-3 font-mono text-sm"
            placeholder="AIza..."
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={onSaveKey}
              className="comic-btn bg-green-500 text-white text-base px-4 py-2 hover:bg-green-400 flex-1"
            >
              Save API Key
            </button>
            <button
              onClick={onTestKey}
              disabled={isTesting}
              className={`comic-btn text-base px-4 py-2 flex-1 ${isTesting ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
            >
              {isTesting ? 'Testing...' : 'Test API Key'}
            </button>
          </div>
          {testResult && (
            <p className="font-sans text-sm text-gray-700 bg-yellow-100 border border-black p-2">{testResult}</p>
          )}
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
