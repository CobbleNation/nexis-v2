'use client';

import { Play, Pause, Square } from 'lucide-react';
import { useState, useEffect } from 'react';

export function TimeTracker() {
    const [time, setTime] = useState(5048); // 01:24:08 in seconds
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-[#1a2e22] p-8 rounded-[2rem] shadow-sm relative overflow-hidden text-white flex flex-col justify-between h-full min-h-[220px]">
            {/* Abstract Waves Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 50 Q 25 20 50 50 T 100 50 L 100 100 L 0 100 Z" fill="currentColor" className="text-emerald-500" />
                    <path d="M0 60 Q 30 30 60 60 T 120 60 L 120 120 L 0 120 Z" fill="currentColor" className="text-emerald-700" />
                </svg>
            </div>

            <div className="relative z-10">
                <h3 className="text-sm font-medium opacity-80 mb-6">Time Tracker</h3>
                <div className="text-5xl font-mono font-bold tracking-wider mb-8">
                    {formatTime(time)}
                </div>
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className="h-12 w-12 rounded-full bg-white text-primary flex items-center justify-center hover:bg-white/90 transition-colors"
                >
                    {isActive ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
                </button>
                <button
                    onClick={() => { setIsActive(false); setTime(0); }}
                    className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                >
                    <Square className="fill-current w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
