'use client';

import { useData } from '@/lib/store';
import { useMemo } from 'react';
import { subDays, isSameDay, format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEGMENTS = 6; // Number of segments per bar

export function WeeklyActivity() {
    const { state } = useData();

    const activityData = useMemo(() => {
        const today = new Date();
        const days = [];

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);

            const completedCount = state.actions.filter(a =>
                a.completed && a.date && isSameDay(new Date(a.date), date)
            ).length;

            const routinesCount = state.habitLogs.filter(e =>
                e.completed && isSameDay(new Date(e.date), date)
            ).length;

            const totalScore = completedCount + routinesCount;

            days.push({
                date,
                score: totalScore,
                label: format(date, 'EEE', { locale: uk }),
                fullDate: format(date, 'd MMMM', { locale: uk }),
                isToday: i === 0
            });
        }

        const maxScore = Math.max(...days.map(d => d.score), 1);

        return days.map(d => ({
            ...d,
            filledSegments: d.score === 0 ? 0 : Math.max(1, Math.round((d.score / maxScore) * SEGMENTS))
        }));
    }, [state.actions, state.habitLogs]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Активність
            </h3>

            <div className="flex items-end justify-between gap-2 flex-1 px-1">
                {activityData.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-9 scale-0 group-hover:scale-100 transition-transform origin-bottom bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-10">
                            {day.score > 0 ? `${day.score} дій` : 'Немає'}
                        </div>

                        {/* Segmented Bar */}
                        <div className="flex flex-col-reverse gap-[3px] w-full items-center">
                            {Array.from({ length: SEGMENTS }).map((_, segIdx) => {
                                const isFilled = segIdx < day.filledSegments;
                                return (
                                    <div
                                        key={segIdx}
                                        className={cn(
                                            "w-full max-w-[20px] h-[10px] rounded-sm transition-all duration-700 ease-out",
                                            isFilled
                                                ? "bg-emerald-500 dark:bg-emerald-500"
                                                : "bg-[#ECEFF3] dark:bg-[#2A2F36]"
                                        )}
                                        style={{
                                            transitionDelay: isFilled ? `${segIdx * 50}ms` : '0ms',
                                            opacity: isFilled ? 1 : 1
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Label */}
                        <span className={cn(
                            "text-[10px] sm:text-xs font-bold uppercase tracking-wider",
                            day.isToday ? "text-primary" : "text-muted-foreground"
                        )}>
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                <div className="w-3 h-3 rounded-sm bg-[#ECEFF3] dark:bg-[#2A2F36]" />
                <span>Пусто</span>
                <div className="w-3 h-3 rounded-sm bg-emerald-500 ml-2" />
                <span>Виконано</span>
            </div>
        </div>
    );
}
