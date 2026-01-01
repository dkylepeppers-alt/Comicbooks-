/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useMemo, useState } from 'react';
import { useBook } from '../context/BookContext';

export const GlobalLoadingIndicator: React.FC = () => {
  const { state } = useBook();

  const [now, setNow] = useState(Date.now());

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
    <div className="fixed top-20 right-4 w-80 max-w-[90vw] rounded-lg shadow-2xl bg-white/90 backdrop-blur border-2 border-black z-50" aria-live="polite">
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

        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-800">
          {progress?.current && (
            <p className="font-comic">Step {progress.current} of {progress.total}</p>
          )}
          <p className="text-right font-semibold">{percentage !== undefined ? `${percentage}%` : 'Tracking queue'}</p>
          <p className="font-semibold text-gray-700">{stageHint}</p>
          {elapsedSeconds !== undefined && (
            <p className="text-right text-gray-600">⏱️ {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</p>
          )}
        </div>

        {loadingFaces.length > 0 && (
          <p className="text-[11px] text-gray-600 font-mono">
            Active pages: {loadingFaces.map(face => face.pageIndex ?? '?').join(', ')}
          </p>
        )}

        {(elapsedSeconds !== undefined || estimatedSeconds !== undefined) && (
          <div className="flex items-center justify-between text-[11px] text-gray-700 font-mono">
            <span>Elapsed: {elapsedSeconds !== undefined ? `${elapsedSeconds}s` : '—'}</span>
            <span>ETA: {estimatedSeconds !== undefined ? `${estimatedSeconds}s` : 'calibrating'}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1 text-[11px] text-gray-700">
          {pipeline.map(stage => (
            <span
              key={stage.label}
              className={`px-2 py-1 rounded-full border border-black/20 ${stage.active ? 'bg-yellow-100 text-yellow-800' : stage.done ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}
            >
              {stage.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
