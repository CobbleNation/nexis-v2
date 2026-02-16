'use client';

import React from 'react';
import { CheckCircle2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Action } from '@/types';

interface OneFocusProps {
    action?: Action; // The chosen focus task
    onComplete?: (id: string) => void;
    onSetFocus?: () => void; // Callback if no focus
}

export function OneFocus({ action, onComplete, onSetFocus }: OneFocusProps) {
    if (!action) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-card border border-slate-200 dark:border-border border-dashed rounded-3xl text-center space-y-4 shadow-sm group hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
                <div className="h-16 w-16 bg-slate-50 dark:bg-secondary group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 rounded-full flex items-center justify-center mb-2 transition-colors">
                    <Target className="h-8 w-8 text-slate-300 dark:text-muted-foreground group-hover:text-orange-400 dark:group-hover:text-orange-500 transition-colors" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">Фокус не встановлено</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                        Успіх приходить з ясністю. Оберіть одне головне завдання на цю сесію.
                    </p>
                </div>
                {onSetFocus && (
                    <Button onClick={onSetFocus} className="mt-4 rounded-full font-bold bg-foreground text-background hover:bg-slate-800">
                        Обрати Фокус
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-card border-2 border-orange-100 dark:border-orange-900/30 p-8 lg:p-10 shadow-xl transition-all hover:scale-[1.005] hover:shadow-2xl group">
            {/* Orange Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-orange-500 to-amber-600" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 pl-6">
                <div className="space-y-4 flex-1">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-orange-600/80">
                            <Target className="h-4 w-4" />
                            <span className="text-xs font-bold tracking-[0.2em] uppercase">Головний Фокус</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground/90">
                            {action.title}
                        </h2>
                    </div>

                    {action.areaId && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                {action.areaId === 'general' ? 'Загальне' : 'Проектна Сфера'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0">
                    <Button
                        size="lg"
                        className="h-16 w-16 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center p-0"
                        onClick={() => onComplete?.(action.id)}
                    >
                        <CheckCircle2 className="h-8 w-8" />
                        <span className="sr-only">Завершити Фокус</span>
                    </Button>
                </div>
            </div>

            {/* Decorative background glow (Subtle) */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-orange-500/5 blur-[80px] pointer-events-none" />
        </div>
    );
}
