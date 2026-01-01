/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useBook } from '../context/BookContext';
import { useSettings } from '../context/SettingsContext';

const StatusChip: React.FC<{ label: string; tone?: 'info' | 'warn' | 'success' }>
  = ({ label, tone = 'info' }) => {
  const toneStyles = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warn: 'bg-amber-100 text-amber-800 border-amber-300',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  }[tone];

  return (
    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${toneStyles}`}>
      {label}
    </span>
  );
};

export const TopBar: React.FC = () => {
  const { state, actions } = useBook();
  const { togglePanel, isDirty, settings } = useSettings();

  const activeTasks = state.loadingProgress
    ? `${state.loadingProgress.current}/${state.loadingProgress.total}`
    : 'Idle';

  const handleHome = () => {
    if (state.status !== 'setup') {
      actions.reset();
      actions.addNotification('info', 'Returned to setup to start a fresh book');
    }
  };

  const handleLibrary = () => {
    actions.loadWorlds().catch(() => actions.addNotification('warning', 'Unable to refresh library right now'));
    actions.addNotification('info', 'Refreshing your saved worlds…');
  };

  const handleExportHint = () => {
    actions.addNotification('info', 'Use the Download option inside the book to export to PDF');
  };

  const statusLabel = state.status === 'generating'
    ? 'Generating panels'
    : state.status === 'reading'
      ? 'Reading mode'
      : 'Setup';

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b-4 border-black shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border-2 border-black bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center font-comic text-lg text-black shadow-sm">
            IH
          </div>
          <div>
            <p className="font-comic text-xl text-gray-900 leading-none">Infinite Heroes</p>
            <p className="text-[11px] text-gray-600">Model: {settings.model}</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <button className="comic-btn bg-white text-black text-sm px-3 py-2" onClick={handleHome}>Home</button>
          <button className="comic-btn bg-white text-black text-sm px-3 py-2" onClick={handleLibrary}>Library</button>
          <button className="comic-btn bg-white text-black text-sm px-3 py-2" onClick={handleExportHint}>Export</button>
        </nav>

        <div className="flex items-center gap-2">
          <StatusChip label={statusLabel} tone={state.status === 'generating' ? 'warn' : 'info'} />
          <StatusChip label={`Tasks: ${activeTasks}`} tone={state.loadingProgress ? 'warn' : 'success'} />
          {isDirty && <StatusChip label="Unsaved settings" tone="warn" />}
          <button
            className="comic-btn bg-black text-white text-sm px-3 py-2"
            onClick={togglePanel}
            aria-label="Open settings"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>
    </header>
  );
};
