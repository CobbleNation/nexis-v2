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

    // SVG ring constants - use viewBox based approach, no radius/circumference vars needed
    const R = 22;
    const CIRC = 2 * Math.PI * R;
    const dashOffset = CIRC - (CIRC * focusIndex) / 100;

    return (
        <div className="flex items-center justify-between gap-3 w-full">
            {/* Left side: Focus ring + label */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 group text-left hover:opacity-80 transition-opacity min-w-0">
                        {/* SVG ring */}
                        <div className="relative w-14 h-14 shrink-0">
                            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                                <circle cx="28" cy="28" r={R} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="5" />
                                <circle
                                    cx="28" cy="28" r={R} fill="none"
                                    className="stroke-orange-500 transition-all duration-1000 ease-out"
                                    strokeWidth="5"
                                    strokeDasharray={CIRC}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[11px] font-black tabular-nums">{focusIndex}%</span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                Фокус дня <Info className="w-3 h-3 shrink-0" />
                            </div>
                            <div className="text-base font-black tracking-tight text-foreground leading-none mt-0.5 truncate">
                                {getFocusStatusName(focusIndex)}
                            </div>
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
                            <span className="font-medium">{focusData.tasksScore}% <span className="text-xs text-muted-foreground">({focusData.tasksCompleted}/{focusData.tasksTotal})</span></span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Звички (до 30%)</span>
                            <span className="font-medium">{focusData.habitsScore}% <span className="text-xs text-muted-foreground">({focusData.habitsCompleted}/{focusData.habitsTotal})</span></span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Метрики (до 20%)</span>
                            <span className="font-medium">{focusData.metricsScore}% <span className="text-xs text-muted-foreground">({focusData.hasMetricsUpdate ? 'так' : 'ні'})</span></span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
                            Розраховується лише на основі запланованого і виконаного сьогодні.
                        </p>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Right side: Streak */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <div className="font-black text-base tracking-tight leading-none">{streak} дн.</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Стрік</div>
                </div>
            </div>
        </div>
    );
}
