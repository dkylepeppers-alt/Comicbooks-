/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import { useBook } from '../context/BookContext';

export const GlobalLoadingIndicator: React.FC = () => {
  const { state } = useBook();

  const progress = state.loadingProgress;
  const loadingFaces = useMemo(() => state.comicFaces.filter(face => face.isLoading), [state.comicFaces]);
  const showIndicator = progress || loadingFaces.length > 0;

  if (!showIndicator) return null;

  const percentage = progress
    ? progress.percentage ?? Math.round((progress.current / progress.total) * 100)
    : undefined;

  return (
    <div className="fixed top-20 right-4 w-80 max-w-[90vw] rounded-lg shadow-2xl bg-white/90 backdrop-blur border-2 border-black z-50">
      <div className="px-4 py-3 border-b-2 border-black flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-comic font-bold text-gray-900">{progress?.label ?? 'Preparing next panel...'}</p>
          <p className="text-xs text-gray-700">{progress?.substep ?? 'Hang tight while the AI inks the frame.'}</p>
        </div>
        <div className="text-xs font-mono text-gray-600 text-right">
          <p>{new Date().toLocaleTimeString()}</p>
          <p className="text-amber-600 font-semibold">{loadingFaces.length} task(s)</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="w-full h-3 bg-gray-200 border border-black rounded-sm overflow-hidden">
          {percentage !== undefined ? (
            <div
              className="h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          ) : (
            <div className="h-full w-1/2 bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 animate-pulse" />
          )}
        </div>

        {progress?.current && (
          <p className="text-xs font-comic text-gray-800">
            Step {progress.current} of {progress.total}
          </p>
        )}

        {loadingFaces.length > 0 && (
          <p className="text-[11px] text-gray-600 font-mono">
            Active pages: {loadingFaces.map(face => face.pageIndex ?? '?').join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};
