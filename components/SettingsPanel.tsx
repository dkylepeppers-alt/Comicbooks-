/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useSettings } from '../context/SettingsContext';

const Section: React.FC<{ title: string; children: React.ReactNode; description?: string }>
  = ({ title, children, description }) => (
  <section className="space-y-2">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="font-comic text-lg text-gray-900">{title}</p>
        {description && <p className="text-xs text-gray-600 leading-snug">{description}</p>}
      </div>
    </div>
    <div className="grid grid-cols-1 gap-3">{children}</div>
  </section>
);

const FieldLabel: React.FC<{ label: string; hint?: string }>
  = ({ label, hint }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-semibold text-gray-800">{label}</span>
    {hint && <span className="text-[11px] text-gray-500">{hint}</span>}
  </div>
);

export const SettingsPanel: React.FC = () => {
  const {
    draft,
    isPanelOpen,
    isDirty,
    lastSavedAt,
    closePanel,
    updateDraft,
    saveSettings,
    resetSettings,
  } = useSettings();

  if (!isPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        aria-hidden
        onClick={closePanel}
      />

      <div className="relative w-full max-w-[420px] h-full bg-gradient-to-b from-white to-slate-50 border-l-4 border-black shadow-2xl animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-comic text-xl text-gray-900">Settings</p>
            <p className="text-xs text-gray-600">Fine-tune models, rendering, and accessibility</p>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold border border-amber-300">Unsaved</span>}
            {lastSavedAt && (
              <span className="text-[11px] text-gray-500">Saved {new Date(lastSavedAt).toLocaleTimeString()}</span>
            )}
            <button
              className="w-8 h-8 rounded-full border-2 border-black bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              aria-label="Close settings"
              onClick={closePanel}
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-5">
          <Section title="Quick Toggles" description="Common switches surface at the top for speed">
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`comic-btn text-sm py-2 ${draft.theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}
                onClick={() => updateDraft({ theme: draft.theme === 'dark' ? 'light' : 'dark' })}
              >
                {draft.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <button
                className={`comic-btn text-sm py-2 ${draft.reducedMotion ? 'bg-emerald-600 text-white' : 'bg-white text-black'}`}
                onClick={() => updateDraft({ reducedMotion: !draft.reducedMotion })}
              >
                {draft.reducedMotion ? 'Reduced Motion' : 'Motion On'}
              </button>
              <button
                className="comic-btn text-sm py-2 bg-white text-black col-span-2"
                onClick={() => updateDraft({ model: draft.model === 'gemini-2.0-flash' ? 'gemini-2.0-pro' : 'gemini-2.0-flash' })}
              >
                ⚙️ Model: {draft.model}
              </button>
            </div>
          </Section>

          <Section title="Models & Performance" description="Control cost, latency, and quality trade-offs">
            <div className="space-y-3">
              <div>
                <FieldLabel label="Max tokens" hint="Affects narrative depth" />
                <input
                  type="range"
                  min={400}
                  max={1600}
                  step={50}
                  value={draft.maxTokens}
                  onChange={e => updateDraft({ maxTokens: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">{draft.maxTokens} tokens</p>
              </div>

              <div>
                <FieldLabel label="Creativity" hint="Lower = deterministic" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={draft.creativity}
                  onChange={e => updateDraft({ creativity: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">{draft.creativity.toFixed(1)} temperature</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="Parallel pages" hint="Throttle generation" />
                  <select
                    value={draft.concurrentGenerations}
                    onChange={e => updateDraft({ concurrentGenerations: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-2 py-2"
                  >
                    {[1, 2, 3, 4].map(count => (
                      <option key={count} value={count}>{count} at once</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Image resolution" />
                  <select
                    value={draft.imageResolution}
                    onChange={e => updateDraft({ imageResolution: e.target.value as 'standard' | 'high' })}
                    className="w-full border border-gray-300 rounded-md px-2 py-2"
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Rendering" description="Balance fidelity with responsiveness">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Thumbnails" />
                <select
                  value={draft.thumbnailQuality}
                  onChange={e => updateDraft({ thumbnailQuality: e.target.value as typeof draft.thumbnailQuality })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                >
                  <option value="balanced">Balanced</option>
                  <option value="performance">Performance</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={draft.lazyThumbnails}
                  onChange={e => updateDraft({ lazyThumbnails: e.target.checked })}
                />
                Lazy-load outline art
              </label>
              <div>
                <FieldLabel label="Animation density" />
                <select
                  value={draft.animationDensity}
                  onChange={e => updateDraft({ animationDensity: e.target.value as typeof draft.animationDensity })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                >
                  <option value="minimal">Minimal</option>
                  <option value="balanced">Balanced</option>
                  <option value="cinematic">Cinematic</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Prefetch depth" />
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={draft.prefetchDepth}
                  onChange={e => updateDraft({ prefetchDepth: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                />
              </div>
            </div>
          </Section>

          <Section title="Accessibility & Theme" description="Improve readability and comfort">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Theme" />
                <select
                  value={draft.theme}
                  onChange={e => updateDraft({ theme: e.target.value as typeof draft.theme })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">Auto</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Font scale" hint="%" />
                <input
                  type="number"
                  min={90}
                  max={120}
                  value={draft.fontScale}
                  onChange={e => updateDraft({ fontScale: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={draft.highContrast}
                  onChange={e => updateDraft({ highContrast: e.target.checked })}
                />
                High contrast mode
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={draft.reducedMotion}
                  onChange={e => updateDraft({ reducedMotion: e.target.checked })}
                />
                Reduce motion
              </label>
            </div>
          </Section>

          <Section title="Notifications & Logging" description="Control signal-to-noise for system feedback">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="Log verbosity" />
                <select
                  value={draft.logVerbosity}
                  onChange={e => updateDraft({ logVerbosity: e.target.value as typeof draft.logVerbosity })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                >
                  <option value="errors">Errors only</option>
                  <option value="normal">Normal</option>
                  <option value="verbose">Verbose</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={draft.stickyNotifications}
                  onChange={e => updateDraft({ stickyNotifications: e.target.checked })}
                />
                Persist toasts until dismissed
              </label>
            </div>
          </Section>

          <Section title="Exports" description="Defaults for PDF and downloads">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel label="PDF quality" />
                <select
                  value={draft.pdfQuality}
                  onChange={e => updateDraft({ pdfQuality: e.target.value as typeof draft.pdfQuality })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                >
                  <option value="compact">Compact</option>
                  <option value="standard">Standard</option>
                  <option value="print">Print</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={draft.includeMetadata}
                  onChange={e => updateDraft({ includeMetadata: e.target.checked })}
                />
                Include metadata
              </label>
              <div>
                <FieldLabel label="Default export range" />
                <select
                  value={draft.defaultExportRange}
                  onChange={e => updateDraft({ defaultExportRange: e.target.value as typeof draft.defaultExportRange })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2"
                >
                  <option value="all">All pages</option>
                  <option value="story-only">Story only</option>
                  <option value="covers-only">Covers</option>
                </select>
              </div>
            </div>
          </Section>
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Changes auto-save locally. Press <kbd className="px-1 border border-gray-400 rounded">S</kbd> to toggle.
          </div>
          <div className="flex items-center gap-2">
            <button
              className="comic-btn bg-white text-black text-sm px-3 py-2"
              onClick={resetSettings}
            >
              Reset
            </button>
            <button
              className="comic-btn bg-black text-white text-sm px-3 py-2 disabled:opacity-60"
              onClick={saveSettings}
              disabled={!isDirty}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
