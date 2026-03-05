'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/store';
import { isSameDay, subDays } from 'date-fns';
import { Flame, Info } from 'lucide-react';
import { AppState } from '@/lib/store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FocusScoreData {
    score: number;
    tasksScore: number;
    habitsScore: number;
    metricsScore: number;
    tasksCompleted: number;
    tasksTotal: number;
    habitsCompleted: number;
    habitsTotal: number;
    hasMetricsUpdate: boolean;
}

// Calculate a 0-100 score strictly based on today's activity
function calculateTodayScore(state: AppState): FocusScoreData {
    const today = new Date();

    // 1. Tasks (50%)
    const todayTasks = state.actions.filter(a => a.date && isSameDay(new Date(a.date), today));
    const tasksTotal = todayTasks.length;
    const tasksCompleted = todayTasks.filter(a => a.completed).length;
    let tasksScore = 0;
    if (tasksTotal > 0) {
        tasksScore = (tasksCompleted / tasksTotal) * 50;
    }

    // 2. Habits (30%)
    const activeHabits = state.habits.filter(h => h.status === 'active');
    const habitsTotal = activeHabits.length;
    const habitsCompleted = state.habitLogs.filter(l => isSameDay(new Date(l.date), today) && l.completed).length;
    let habitsScore = 0;
    if (habitsTotal > 0) {
        habitsScore = Math.min((habitsCompleted / habitsTotal) * 30, 30);
    }

    // 3. Metrics (20%)
    const hasMetricUpdateToday = state.metricEntries.some(e => isSameDay(new Date(e.date), today));
    const metricsScore = hasMetricUpdateToday ? 20 : 0;

    const totalScore = Math.round(tasksScore + habitsScore + metricsScore);

    return {
        score: totalScore,
        tasksScore: Math.round(tasksScore),
        habitsScore: Math.round(habitsScore),
        metricsScore: Math.round(metricsScore),
        tasksCompleted,
        tasksTotal,
        habitsCompleted,
        habitsTotal,
        hasMetricsUpdate: hasMetricUpdateToday
    };
}

function getFocusStatusName(score: number): string {
    if (score === 0) return 'Відсутній';
    if (score < 40) return 'Низький';
    if (score < 60) return 'Середній';
    if (score < 80) return 'Гарний';
    if (score < 100) return 'Високий';
    return 'Максимальний';
}

export function OverviewHeader() {
    const { state } = useData();
    const focusData = useMemo(() => calculateTodayScore(state), [state]);
    const focusIndex = focusData.score;

    // Calculate Momentum (Streak of productive days)
    const streak = useMemo(() => {
        let currentStreak = 0;
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const dateToCheck = subDays(today, i);
            const hasCompletedAction = state.actions.some(a => a.completed && a.date && isSameDay(new Date(a.date), dateToCheck));
            const hasCompletedHabit = state.habitLogs.some(l => l.completed && isSameDay(new Date(l.date), dateToCheck));

            if (hasCompletedAction || hasCompletedHabit) {
                currentStreak++;
            } else if (i > 0) { // Don't break streak if today has no actions yet
                break;
            }
        }

        return currentStreak > 0 ? currentStreak : 0;
    }, [state.actions, state.habitLogs]);

    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * focusIndex) / 100;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center flex-1">
                {/* Focus Ring with Popover Explainer */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="w-full bg-white dark:bg-card px-3 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl border border-border/50 shadow-sm flex items-center gap-3 md:gap-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left group">
                            <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="28" cy="28" r={radius} className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="5" />
                                    <circle
                                        cx="28" cy="28" r={radius}
                                        className="stroke-orange-500 fill-none transition-all duration-1000 ease-out"
                                        strokeWidth="5"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-xs font-black tracking-tighter">{focusIndex}%</span>
                                </div>
                            </div>
                            <div className="flex flex-col relative pr-2 md:pr-4">
                                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                                    Фокус дня
                                    <Info className="w-3 h-3 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
                                </h2>
                                <p className="text-lg md:text-xl font-black tracking-tight leading-none text-foreground">
                                    {getFocusStatusName(focusIndex)}
                                </p>
                            </div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-border/50" sideOffset={8}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-1 text-sm font-bold">
                                Фокус {focusIndex}%
                                <span className="text-xs font-normal text-muted-foreground">/ 100%</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Задачі (до 50%)</span>
                                <span className="font-medium">
                                    {focusData.tasksScore}% <span className="text-xs text-muted-foreground ml-1">({focusData.tasksCompleted}/{focusData.tasksTotal})</span>
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Звички (до 30%)</span>
                                <span className="font-medium">
                                    {focusData.habitsScore}% <span className="text-xs text-muted-foreground ml-1">({focusData.habitsCompleted}/{focusData.habitsTotal})</span>
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Метрики (до 20%)</span>
                                <span className="font-medium">
                                    {focusData.metricsScore}% <span className="text-xs text-muted-foreground ml-1">({focusData.hasMetricsUpdate ? 'так' : 'ні'})</span>
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/80 mt-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
                                Розраховується лише на основі запланованого і виконаного сьогодні.
                            </p>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Momentum */}
            <div className="bg-white dark:bg-card px-3 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl border border-border/50 shadow-sm flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-lg md:text-xl tracking-tight leading-none">{streak} дні(в)</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Продуктивності</span>
                </div>
            </div>
        </div>
    );
}
