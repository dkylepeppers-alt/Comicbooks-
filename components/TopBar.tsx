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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const activeTasks = state.loadingProgress
    ? `${state.loadingProgress.current}/${state.loadingProgress.total}`
    : 'Idle';

  const handleNewBook = () => {
    const canReset = state.status === 'setup'
      ? true
      : window.confirm('Start a brand new book? Ongoing generation will be cancelled.');

    if (!canReset) return;

    actions.startNewBook();
    actions.addNotification('info', 'Starting a fresh book — set up your next adventure!');
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

  const quickStatus = state.loadingProgress
    ? `${state.loadingProgress.label} · ${state.loadingProgress.substep ?? 'Working…'}`
    : 'Ready for your next move';

  return (
    <header className={`fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b-4 border-black shadow-lg transition-all duration-300 ${isCollapsed ? 'translate-y-0' : ''}`}>
      <div className={`max-w-6xl mx-auto px-4 ${isCollapsed ? 'py-2' : 'py-3'} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 rounded-lg border-2 border-black bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center font-comic text-base text-black shadow-sm"
            onClick={() => setIsCollapsed(prev => !prev)}
            aria-label={isCollapsed ? 'Expand top bar' : 'Collapse top bar'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? '▾' : '▴'}
          </button>
          <div>
            <p className="font-comic text-xl text-gray-900 leading-none">Infinite Heroes</p>
            <p className="text-[11px] text-gray-600">Model: {settings.model}</p>
          </div>
        </div>

        {!isCollapsed && (
          <nav className="hidden md:flex items-center gap-2">
            <button className="comic-btn bg-white text-black text-sm px-3 py-2" onClick={handleNewBook}>New Book</button>
            <button className="comic-btn bg-white text-black text-sm px-3 py-2" onClick={handleLibrary}>Library</button>
            <button className="comic-btn bg-white text-black text-sm px-3 py-2" onClick={handleExportHint}>Export</button>
          </nav>
        )}

        <div className={`flex items-center ${isCollapsed ? 'gap-1' : 'gap-2'}`}>
          <div className={`flex flex-col ${isCollapsed ? 'items-end' : 'items-start'} max-w-[220px]`}>
            <p className="text-[11px] text-gray-600 leading-tight">{quickStatus}</p>
            {!isCollapsed && <p className="text-[11px] text-gray-500">Status: {statusLabel}</p>}
          </div>
          {!isCollapsed && (
            <>
              <StatusChip label={statusLabel} tone={state.status === 'generating' ? 'warn' : 'info'} />
              <StatusChip label={`Tasks: ${activeTasks}`} tone={state.loadingProgress ? 'warn' : 'success'} />
              {isDirty && <StatusChip label="Unsaved settings" tone="warn" />}
            </>
          )}
          <button
            className={`comic-btn ${isCollapsed ? 'bg-white text-black text-xs px-2 py-1' : 'bg-black text-white text-sm px-3 py-2'}`}
            onClick={togglePanel}
            aria-label="Open settings"
          >
            ⚙️ {isCollapsed ? 'Settings' : 'Settings'}
          </button>
        </div>
      </div>
    </header>
  );
};
