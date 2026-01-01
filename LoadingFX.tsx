
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { useBook } from './context/BookContext';

const LOADING_FX = ["POW!", "BAM!", "ZAP!", "KRAK!", "SKREEE!", "WHOOSH!", "THWIP!", "BOOM!"];

interface LogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export const LoadingFX: React.FC = () => {
    const { state, actions } = useBook();
    const [particles, setParticles] = useState<{id: number, text: string, x: string, y: string, rot: number, color: string}[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showDetailedLogs, setShowDetailedLogs] = useState(false);
    const [apiLogs, setApiLogs] = useState<LogEntry[]>([]);
    const [position, setPosition] = useState({ x: 18, y: 18 });
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const dragCaptureRef = useRef<HTMLElement | null>(null);
    const isDraggingRef = useRef(false);
    const shellRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Progress Data from Engine
    const progress = state.loadingProgress;

    // Calculate percentage - default to indeterminate loading if no progress data
    const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;
    const hasProgress = progress !== null;
    
    // Capture console logs for API operations
    useEffect(() => {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      const captureLog = (message: string, type: 'info' | 'success' | 'error' | 'warning') => {
        // Only capture AI Service logs
        if (message.includes('[AI Service]') || message.includes('[API Key Test]')) {
          setApiLogs(prev => {
            const newLogs = [...prev, {
              timestamp: Date.now(),
              message: message.replace('[AI Service]', '').replace('[API Key Test]', '').trim(),
              type
            }];
            // Keep last 50 logs
            return newLogs.slice(-50);
          });
        }
      };
      
      console.log = (...args) => {
        const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        captureLog(message, 'info');
        originalLog.apply(console, args);
      };
      
      console.error = (...args) => {
        const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        captureLog(message, 'error');
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        captureLog(message, 'warning');
        originalWarn.apply(console, args);
      };
      
      return () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      };
    }, []);
    
    // Auto-scroll logs to bottom
    useEffect(() => {
      if (showDetailedLogs && logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    }, [apiLogs, showDetailedLogs]);

    // Center the card after first render so it does not cover the same place every time
    useEffect(() => {
        const shell = shellRef.current;
        const card = cardRef.current;
        if (!shell || !card) return;

        const shellRect = shell.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const centeredX = Math.max(12, (shellRect.width - cardRect.width) / 2);
        const centeredY = Math.max(12, shellRect.height * 0.12);
        setPosition({ x: centeredX, y: centeredY });
    }, []);

    const handlePointerDown = (event: React.PointerEvent) => {
        const shell = shellRef.current;
        const card = cardRef.current;
        if (!shell || !card) return;

        const shellRect = shell.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        dragOffsetRef.current = {
            x: event.clientX - shellRect.left - position.x,
            y: event.clientY - shellRect.top - position.y,
        };
        isDraggingRef.current = true;
        // Prevent text selection while dragging
        const target = event.currentTarget as HTMLElement;
        dragCaptureRef.current = target;
        target.setPointerCapture(event.pointerId);
        event.preventDefault();

        // Ensure we clamp inside the shell
        const maxX = Math.max(8, shellRect.width - cardRect.width - 8);
        const maxY = Math.max(8, shellRect.height - cardRect.height - 8);
        setPosition(prev => ({
            x: Math.min(maxX, Math.max(8, prev.x)),
            y: Math.min(maxY, Math.max(8, prev.y)),
        }));
    };

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            if (!isDraggingRef.current || !shellRef.current || !cardRef.current) return;
            const shellRect = shellRef.current.getBoundingClientRect();
            const cardRect = cardRef.current.getBoundingClientRect();
            const maxX = Math.max(8, shellRect.width - cardRect.width - 8);
            const maxY = Math.max(8, shellRect.height - cardRect.height - 8);
            const x = event.clientX - shellRect.left - dragOffsetRef.current.x;
            const y = event.clientY - shellRect.top - dragOffsetRef.current.y;
            setPosition({
                x: Math.min(maxX, Math.max(8, x)),
                y: Math.min(maxY, Math.max(8, y)),
            });
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                if (dragCaptureRef.current) {
                    try {
                        dragCaptureRef.current.releasePointerCapture(event.pointerId);
                    } catch (e) {
                        // no-op
                    }
                    dragCaptureRef.current = null;
                }
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, []);

    // Particle animation effect
    useEffect(() => {
        const interval = setInterval(() => {
            const id = Date.now();
            const text = LOADING_FX[Math.floor(Math.random() * LOADING_FX.length)] ?? 'POW!';
            const x = `${20 + Math.random() * 60}%`;
            const y = `${20 + Math.random() * 60}%`;
            const rot = Math.random() * 60 - 30;
            const colors = ['text-yellow-400', 'text-red-500', 'text-blue-400', 'text-orange-500', 'text-purple-500'];
            const color = colors[Math.floor(Math.random() * colors.length)] ?? 'text-yellow-400';
            setParticles(prev => [...prev, { id, text, x, y, rot, color }].slice(-4));
        }, 600);
        return () => clearInterval(interval);
    }, []);

    // Elapsed time tracker
    useEffect(() => {
        const startTime = progress?.startTime || Date.now();
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(elapsed);
        }, 100);

        return () => clearInterval(interval);
    }, [progress]);

    return (
        <div ref={shellRef} className="absolute inset-0 bg-transparent overflow-hidden pointer-events-none">
            <style>{`
              @keyframes comic-pop {
                  0% { transform: translate(-50%, -50%) scale(0.2) rotate(var(--rot)); opacity: 0; }
                  20% { transform: translate(-50%, -50%) scale(1.5) rotate(var(--rot)); opacity: 1; }
                  40% { transform: translate(-50%, -50%) scale(1.0) rotate(var(--rot)); opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes slide {
                  0% { transform: translateX(-100%); }
                  50% { transform: translateX(250%); }
                  100% { transform: translateX(-100%); }
              }
            `}</style>
            <div
              ref={cardRef}
              className={`pointer-events-auto ${isCollapsed ? 'w-44 h-16' : 'w-[min(640px,95vw)]'} bg-white/95 border-4 border-black rounded-2xl shadow-2xl overflow-hidden transition-all duration-300`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`
              }}
            >
                {isCollapsed ? (
                  <button
                    onPointerDown={handlePointerDown}
                    onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
                    className="w-full h-full flex items-center justify-between px-4 font-comic text-sm bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-300"
                    aria-label="Expand inking panel"
                  >
                    <span className="text-lg">🖌️</span>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-900">Inking</p>
                      <p className="text-[11px] text-gray-700">{hasProgress ? `${percentage}% ready` : 'Summoning ink'}</p>
                    </div>
                    <span className="text-lg">⤢</span>
                  </button>
                ) : (
                  <div className="relative p-4 pb-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 to-white opacity-80" />
                    {particles.map(p => (
                        <div key={p.id}
                            className={`absolute font-comic text-4xl md:text-5xl font-bold ${p.color} select-none whitespace-nowrap z-0`}
                            style={{ left: p.x, top: p.y, '--rot': `${p.rot}deg`, animation: 'comic-pop 1.8s forwards ease-out', textShadow: '2px 2px 0px black, 0 0 12px rgba(255,255,255,0.8)' } as React.CSSProperties}>
                            {p.text}
                        </div>
                    ))}

                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🖌️</span>
                                <div>
                                    <p className="font-comic text-lg text-gray-900 leading-tight">{progress ? progress.label : 'INKING PAGE...'}</p>
                                    <p className="text-[11px] text-gray-600">{progress?.substep ?? 'AI is sketching outlines and strokes.'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                  onPointerDown={handlePointerDown}
                                  className="w-8 h-8 rounded-full border-2 border-black bg-yellow-200 text-sm font-semibold" 
                                  title="Drag to reposition"
                                  aria-label="Drag inking panel"
                                >
                                  ⠿
                                </button>
                                <button
                                  onClick={() => setIsCollapsed(true)}
                                  className="w-8 h-8 rounded-full border-2 border-black bg-gray-100 hover:bg-gray-200"
                                  aria-label="Collapse inking panel"
                                >
                                  –
                                </button>
                            </div>
                        </div>

                        <div className="w-full space-y-1">
                            <div className="w-full h-7 border-[3px] border-black bg-white relative shadow-[3px_3px_0px_rgba(0,0,0,0.35)] overflow-hidden rounded-sm">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                                {hasProgress ? (
                                    <div
                                      className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 border-r-2 border-black transition-all duration-500 ease-out relative"
                                      style={{ width: `${percentage}%` }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                                    </div>
                                ) : (
                                    <div className="h-full relative overflow-hidden">
                                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 animate-pulse" style={{ width: '45%', animation: 'slide 1.6s ease-in-out infinite' }} />
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-comic font-bold text-black drop-shadow-[1px_1px_0px_rgba(255,255,255,0.8)]">
                                    <span>{hasProgress ? `${percentage}%` : 'Loading…'}</span>
                                    {hasProgress && <span>Step {progress.current}/{progress.total}</span>}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-comic">
                                <span className="text-gray-700">⏱️ {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
                                <span className="text-gray-500 italic">{progress?.substep ?? 'AI is thinking...'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-gray-800">
                            <div className="bg-yellow-50 border border-black/10 rounded-md px-2 py-1">Ink pass: color, shading</div>
                            <div className="bg-blue-50 border border-black/10 rounded-md px-2 py-1">Layout: speech bubbles</div>
                            <div className="bg-emerald-50 border border-black/10 rounded-md px-2 py-1">Detailing: textures & FX</div>
                            <div className="bg-rose-50 border border-black/10 rounded-md px-2 py-1">Quality check & polish</div>
                        </div>

                        {/* API Activity Log Section */}
                        <div className="border-t-2 border-black/10 pt-3">
                            <button
                              onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                              className="w-full flex items-center justify-between text-sm font-comic font-semibold text-gray-700 hover:text-gray-900 mb-2"
                            >
                              <span>🔍 API Activity Log ({apiLogs.length})</span>
                              <span className="text-xs">{showDetailedLogs ? '▼' : '▶'}</span>
                            </button>
                            
                            {showDetailedLogs && (
                              <div 
                                ref={logContainerRef}
                                className="bg-black/90 text-green-400 font-mono text-[10px] p-2 rounded max-h-48 overflow-y-auto space-y-1"
                                style={{ scrollBehavior: 'smooth' }}
                              >
                                {apiLogs.length === 0 ? (
                                  <div className="text-gray-500 italic">No API activity yet...</div>
                                ) : (
                                  apiLogs.map((log, idx) => {
                                    const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', { 
                                      hour12: false, 
                                      hour: '2-digit', 
                                      minute: '2-digit', 
                                      second: '2-digit' 
                                    });
                                    const colorClass = 
                                      log.type === 'error' ? 'text-red-400' :
                                      log.type === 'warning' ? 'text-yellow-400' :
                                      log.type === 'success' ? 'text-green-300' :
                                      'text-blue-300';
                                    
                                    return (
                                      <div key={idx} className="leading-tight">
                                        <span className="text-gray-500">[{timeStr}]</span>{' '}
                                        <span className={colorClass}>{log.message}</span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                        </div>

                        <div className="flex justify-between gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setApiLogs([])}
                              className="comic-btn bg-gray-500 text-white px-3 py-1 text-xs font-bold hover:bg-gray-400"
                              disabled={apiLogs.length === 0}
                            >
                              Clear Logs
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); actions.abortGeneration(); }}
                              className="comic-btn bg-red-500 text-white px-4 py-2 text-sm font-bold hover:bg-red-400"
                            >
                              Abort Generation
                            </button>
                        </div>
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
};
