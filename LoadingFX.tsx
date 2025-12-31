
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useBook } from './context/BookContext';

const LOADING_FX = ["POW!", "BAM!", "ZAP!", "KRAK!", "SKREEE!", "WHOOSH!", "THWIP!", "BOOM!"];

export const LoadingFX: React.FC = () => {
    const { state } = useBook();
    const [particles, setParticles] = useState<{id: number, text: string, x: string, y: string, rot: number, color: string}[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Progress Data from Engine
    const progress = state.loadingProgress;

    // Calculate percentage
    const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

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
        if (!progress) {
            setElapsedTime(0);
            return;
        }

        const startTime = progress.startTime || Date.now();
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(elapsed);
        }, 100);

        return () => clearInterval(interval);
    }, [progress]);

    return (
        <div className="w-full h-full bg-white overflow-hidden relative border-r-4 border-gray-300">
            <style>{`
              @keyframes comic-pop {
                  0% { transform: translate(-50%, -50%) scale(0.2) rotate(var(--rot)); opacity: 0; }
                  20% { transform: translate(-50%, -50%) scale(1.5) rotate(var(--rot)); opacity: 1; }
                  40% { transform: translate(-50%, -50%) scale(1.0) rotate(var(--rot)); opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rot)); opacity: 0; }
              }
            `}</style>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 to-white opacity-50" />
            
            {particles.map(p => (
                <div key={p.id} 
                     className={`absolute font-comic text-5xl md:text-7xl font-bold ${p.color} select-none whitespace-nowrap z-10`}
                     style={{ left: p.x, top: p.y, '--rot': `${p.rot}deg`, animation: 'comic-pop 1.8s forwards ease-out', textShadow: '3px 3px 0px black, 0 0 20px rgba(255,255,255,0.8)' } as React.CSSProperties}>
                    {p.text}
                </div>
            ))}
            
            <div className="absolute bottom-16 inset-x-6 z-20 flex flex-col items-center gap-3">
                {/* Main Status Label */}
                <div className="relative">
                    <p className="font-comic text-xl text-black bg-white/90 px-4 py-1 border-2 border-black tracking-widest shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
                        {progress ? progress.label.toUpperCase() : "INKING PAGE..."}
                    </p>
                    {/* Pulsing indicator dot */}
                    <div className="absolute -right-1 -top-1 w-3 h-3 bg-red-500 border-2 border-black rounded-full animate-pulse" />
                </div>

                {/* Substep (if available) */}
                {progress?.substep && (
                    <p className="font-comic text-sm text-gray-700 bg-yellow-100/80 px-3 py-1 border border-black italic">
                        {progress.substep}
                    </p>
                )}

                {/* Progress Bar */}
                {progress && (
                    <div className="w-full space-y-1">
                        <div className="w-full h-8 border-4 border-black bg-white relative shadow-[4px_4px_0px_rgba(0,0,0,0.5)] overflow-hidden">
                            {/* Animated background stripes */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />

                            {/* Progress fill with gradient */}
                            <div
                                className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 border-r-2 border-black transition-all duration-500 ease-out relative"
                                style={{ width: `${percentage}%` }}
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                            </div>

                            {/* Text overlay */}
                            <div className="absolute inset-0 flex items-center justify-center gap-2">
                                <span className="font-comic text-sm font-bold text-black drop-shadow-[1px_1px_0px_rgba(255,255,255,0.8)]">
                                    {percentage}%
                                </span>
                                <span className="font-comic text-xs font-bold text-black/70 drop-shadow-[1px_1px_0px_rgba(255,255,255,0.8)]">
                                    ({progress.current}/{progress.total})
                                </span>
                            </div>
                        </div>

                        {/* Elapsed time */}
                        <div className="flex justify-between items-center text-xs font-comic">
                            <span className="text-gray-600">⏱️ {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
                            <span className="text-gray-500 italic">AI is thinking...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
