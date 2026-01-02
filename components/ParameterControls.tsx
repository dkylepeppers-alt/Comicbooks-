/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ModelParameters } from '../types';

interface ParameterControlsProps {
  params: ModelParameters;
  onChange: (updates: Partial<ModelParameters>) => void;
  provider: 'gemini' | 'openrouter';
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({ params, onChange, provider }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Temperature */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-gray-800 flex justify-between">
            <span>Temperature</span>
            <span className="text-[10px] sm:text-[11px] text-gray-500">{(params.temperature ?? 0.7).toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={params.temperature ?? 0.7}
            onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
            className="w-full mt-1"
          />
          <p className="text-[10px] text-gray-600 mt-1">Controls randomness (0=deterministic, 2=very creative)</p>
        </div>

        {/* Top P */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-gray-800 flex justify-between">
            <span>Top P</span>
            <span className="text-[10px] sm:text-[11px] text-gray-500">{(params.topP ?? 0.95).toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.topP ?? 0.95}
            onChange={(e) => onChange({ topP: parseFloat(e.target.value) })}
            className="w-full mt-1"
          />
          <p className="text-[10px] text-gray-600 mt-1">Nucleus sampling threshold</p>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="text-xs sm:text-sm font-semibold text-gray-800 flex justify-between">
            <span>Max Tokens</span>
            <span className="text-[10px] sm:text-[11px] text-gray-500">{params.maxTokens ?? 800}</span>
          </label>
          <input
            type="range"
            min="100"
            max="4000"
            step="50"
            value={params.maxTokens ?? 800}
            onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) })}
            className="w-full mt-1"
          />
          <p className="text-[10px] text-gray-600 mt-1">Maximum length of response</p>
        </div>

        {/* Top K (Gemini only) */}
        {provider === 'gemini' && (
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-800 flex justify-between">
              <span>Top K</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">{params.topK ?? 40}</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={params.topK ?? 40}
              onChange={(e) => onChange({ topK: parseInt(e.target.value) })}
              className="w-full mt-1"
            />
            <p className="text-[10px] text-gray-600 mt-1">Number of highest probability tokens to consider</p>
          </div>
        )}

        {/* Frequency Penalty (OpenRouter) */}
        {provider === 'openrouter' && (
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-800 flex justify-between">
              <span>Frequency Penalty</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">{(params.frequencyPenalty ?? 0).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={params.frequencyPenalty ?? 0}
              onChange={(e) => onChange({ frequencyPenalty: parseFloat(e.target.value) })}
              className="w-full mt-1"
            />
            <p className="text-[10px] text-gray-600 mt-1">Penalize repeated tokens (-2 to 2)</p>
          </div>
        )}

        {/* Presence Penalty (OpenRouter) */}
        {provider === 'openrouter' && (
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-800 flex justify-between">
              <span>Presence Penalty</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">{(params.presencePenalty ?? 0).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={params.presencePenalty ?? 0}
              onChange={(e) => onChange({ presencePenalty: parseFloat(e.target.value) })}
              className="w-full mt-1"
            />
            <p className="text-[10px] text-gray-600 mt-1">Penalize new topics (-2 to 2)</p>
          </div>
        )}
      </div>
    </div>
  );
};
