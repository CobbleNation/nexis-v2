'use client';

import React from 'react';
import { AlertCircle, TrendingUp, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SignalType = 'warning' | 'positive' | 'neutral';

export interface Signal {
    id: string;
    type: SignalType;
    message: string;
    area?: string;
}

interface SignalsProps {
    signals: Signal[];
}

export function Signals({ signals }: SignalsProps) {
    if (signals.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {signals.map((signal) => (
                <div
                    key={signal.id}
                    className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border transition-all",
                        signal.type === 'warning' ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-900 dark:text-red-200" :
                            signal.type === 'positive' ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200" :
                                "bg-slate-50 dark:bg-card border-slate-100 dark:border-border text-slate-700 dark:text-muted-foreground"
                    )}
                >
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        signal.type === 'warning' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                            signal.type === 'positive' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                                "bg-slate-200 dark:bg-secondary text-slate-500 dark:text-muted-foreground"
                    )}>
                        {signal.type === 'warning' && <AlertCircle className="h-4 w-4" />}
                        {signal.type === 'positive' && <TrendingUp className="h-4 w-4" />}
                        {signal.type === 'neutral' && <PauseCircle className="h-4 w-4" />}
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">{signal.message}</p>
                        {signal.area && <p className="text-xs opacity-80 mt-0.5 font-medium uppercase tracking-wide">{signal.area}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}
