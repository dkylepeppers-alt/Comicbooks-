/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useBook } from '../context/BookContext';

export const GlobalLoadingIndicator: React.FC = () => {
  const { state } = useBook();

  // Initialize with function to avoid calling Date.now() during render
  const [now, setNow] = useState(() => Date.now());

  const progress = state.loadingProgress;
  const loadingFaces = useMemo(() => state.comicFaces.filter(face => face.isLoading), [state.comicFaces]);
  const showIndicator = progress || loadingFaces.length > 0;

  useEffect(() => {
    if (!showIndicator) return;
    const interval = setInterval(() => setNow(Date.now()), progress ? 500 : 1200);
    return () => clearInterval(interval);
  }, [progress, showIndicator]);

  if (!showIndicator) return null;

  const percentage = progress
    ? progress.percentage ?? Math.round((progress.current / progress.total) * 100)
    : undefined;

  const elapsedSeconds = progress?.startTime ? Math.max(0, Math.floor((now - progress.startTime) / 1000)) : undefined;
  const estimatedSeconds = progress && progress.current > 0 && elapsedSeconds !== undefined
    ? Math.max(
        0,
        Math.round((elapsedSeconds / progress.current) * progress.total) - elapsedSeconds
      )
    : undefined;

  const stageLabel = progress?.label?.toLowerCase() ?? '';
  const stageHint = stageLabel.includes('writing')
    ? 'Drafting beats and pacing the story'
    : stageLabel.includes('inking')
      ? 'Painting panels and adding effects'
      : stageLabel.includes('binding')
        ? 'Sequencing pages and transitions'
        : 'Coordinating your next steps';

  const pipeline = [
    { label: 'Outline & cadence', done: !!progress && progress.current > 0, active: stageLabel.includes('generating') || stageLabel.includes('writing') },
    { label: 'Dialogue polish', done: !!progress && stageLabel.includes('writing'), active: stageLabel.includes('writing') },
    { label: 'Inking & color', done: !!progress && stageLabel.includes('inking'), active: stageLabel.includes('inking') },
    { label: 'Quality checks', done: !!progress && progress.current === progress.total, active: stageLabel.includes('binding') || stageLabel.includes('starting') },
  ];

  return (
    <div className="fixed top-20 right-4 w-80 max-w-[90vw] rounded-lg shadow-2xl bg-white/95 backdrop-blur-sm border-2 border-black z-50" aria-live="polite" role="status">
      <div className="px-4 py-3 border-b-2 border-black flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-comic font-bold text-gray-900 truncate">{progress?.label ?? 'Preparing next panel...'}</p>
          <p className="text-xs text-gray-700 line-clamp-2">{progress?.substep ?? 'Hang tight while the AI inks the frame.'}</p>
        </div>
        <div className="text-xs font-mono text-gray-600 text-right flex-shrink-0">
          <p>{new Date().toLocaleTimeString()}</p>
          <p className="text-amber-600 font-semibold">{loadingFaces.length} task(s)</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {/* Progress bar with better mobile visibility */}
        <div className="w-full h-4 bg-gray-200 border border-black rounded-sm overflow-hidden">
          {percentage !== undefined ? (
            <div
              className="h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          ) : (
            <div className="h-full w-1/2 bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 animate-pulse" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-800">
          {progress?.current && (
            <p className="font-comic">Step {progress.current} of {progress.total}</p>
          )}
          <p className="text-right font-semibold">{percentage !== undefined ? `${percentage}%` : 'Tracking queue'}</p>
          <p className="font-semibold text-gray-700 col-span-2 text-[11px]">{stageHint}</p>
          {elapsedSeconds !== undefined && (
            <p className="text-right text-gray-600 col-start-2">⏱️ {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</p>
          )}
        </div>

        {loadingFaces.length > 0 && (
          <p className="text-xs text-gray-600 font-mono">
            Active pages: {loadingFaces.map(face => face.pageIndex ?? '?').join(', ')}
          </p>
        )}

        {(elapsedSeconds !== undefined || estimatedSeconds !== undefined) && (
          <div className="flex items-center justify-between text-xs text-gray-700 font-mono">
            <span>Elapsed: {elapsedSeconds !== undefined ? `${elapsedSeconds}s` : '—'}</span>
            <span>ETA: {estimatedSeconds !== undefined ? `${estimatedSeconds}s` : 'calibrating'}</span>
          </div>
        )}

        {/* Pipeline stages with better mobile layout */}
        <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-[11px] text-gray-700">
          {pipeline.map(stage => (
            <span
              key={stage.label}
              className={`px-2 py-1 rounded-full border border-black/20 flex-shrink-0 ${stage.active ? 'bg-yellow-100 text-yellow-800 font-semibold' : stage.done ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}
            >
              {stage.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
