'use client';

import { useData } from '@/lib/store';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { subDays, isSameDay, format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Activity } from 'lucide-react';

export function WeeklyActivity() {
    const { state } = useData();

    // Generate last 7 days activity
    const activityData = useMemo(() => {
        const today = new Date();
        const days = [];

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);

            // Count completed actions for this date
            const completedCount = state.actions.filter(a =>
                a.completed && a.date && isSameDay(new Date(a.date), date)
            ).length;

            // Count completed routines for this date
            // Using habitLogs since routines no longer has daily entries
            const routinesCount = state.habitLogs.filter(e =>
                e.completed && isSameDay(new Date(e.date), date)
            ).length;

            // Metrics omitted to avoid missing metrics properties error

            const totalScore = completedCount + routinesCount;

            days.push({
                date,
                score: totalScore,
                label: format(date, 'EEE', { locale: uk }), // Пн, Вт...
                fullDate: format(date, 'd MMMM', { locale: uk })
            });
        }

        // Calculate intensity for coloring the blocks
        const maxScore = Math.max(...days.map(d => d.score), 1); // Avoid division by zero

        return days.map(d => ({
            ...d,
            intensity: d.score / maxScore
        }));
    }, [state.actions, state.habitLogs]);

    const getColorClass = (intensity: number) => {
        if (intensity === 0) return 'bg-slate-100 dark:bg-slate-800/50';
        if (intensity < 0.3) return 'bg-emerald-200 dark:bg-emerald-900/40';
        if (intensity < 0.7) return 'bg-emerald-400 dark:bg-emerald-600';
        return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Активність (Тиждень)
            </h3>

            <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-end justify-between gap-2 h-32 px-2">
                    {activityData.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform origin-bottom bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap z-10">
                                {day.score} активностей
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-2 border-transparent border-t-slate-900 dark:border-t-slate-100" />
                            </div>

                            {/* Bar Container */}
                            <div className="w-full max-w-[12px] md:max-w-[20px] h-full bg-slate-50 dark:bg-slate-800/20 rounded-t-full flex items-end overflow-hidden">
                                <div
                                    className={cn(
                                        "w-full rounded-t-full rounded-b-sm transition-all duration-700 ease-out",
                                        getColorClass(day.intensity)
                                    )}
                                    style={{ height: `${Math.max(day.intensity * 100, day.score > 0 ? 10 : 0)}%` }} // Ensure minimum visible height if score > 0
                                />
                            </div>

                            {/* Label */}
                            <span className={cn(
                                "text-[10px] sm:text-xs font-bold uppercase tracking-wider",
                                i === 6 ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {day.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-end gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-2">
                <span>Менше</span>
                <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800/50 ml-1" />
                <span className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" />
                <span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="ml-1">Більше</span>
            </div>
        </div>
    );
}
