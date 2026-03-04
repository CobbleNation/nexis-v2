'use client';

import { Sun } from 'lucide-react';

interface StartDayPanelProps {
    onStartDay: () => void;
}

export function StartDayPanel({ onStartDay }: StartDayPanelProps) {
    return (
        <div className="w-full bg-white dark:bg-card border border-border/50 rounded-3xl p-10 md:p-14 shadow-sm flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Sun className="w-12 h-12" />
            </div>
            <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">Почати День</h1>
                <p className="text-lg text-muted-foreground font-medium">Схоже, ти ще не спланував сьогоднішній день.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                <button className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Обрати фокус
                </button>
                <button className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors uppercase tracking-wider text-muted-foreground hover:text-foreground">
                    Додати задачі
                </button>
            </div>

            <button
                onClick={onStartDay}
                className="w-full max-w-md py-4 rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-lg shadow-primary/20 text-lg tracking-wider uppercase mt-2"
            >
                Почати день
            </button>
        </div>
    );
}
