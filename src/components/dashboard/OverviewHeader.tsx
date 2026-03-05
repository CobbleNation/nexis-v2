'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/store';
import { isToday, subDays, isSameDay } from 'date-fns';
import { Flame } from 'lucide-react';
import { AppState } from '@/types';

// Calculate a 0-100 score strictly based on today's activity
function calculateTodayScore(state: AppState): number {
    const today = new Date();

    // 1. Tasks (50%)
    const todayTasks = state.actions.filter(a => a.date && isSameDay(new Date(a.date), today));
    const tasksTotal = todayTasks.length;
    const tasksCompleted = todayTasks.filter(a => a.completed).length;
    let tasksScore = 0;
    if (tasksTotal > 0) {
        tasksScore = (tasksCompleted / tasksTotal) * 50;
    } else if (state.actions.some(a => a.completed && isSameDay(new Date(a.updatedAt), today))) {
        // If no tasks explicitly assigned to today, but user completed some task today
        tasksScore = 50;
    }

    // 2. Habits (30%)
    const activeHabits = state.habits.filter(h => h.status === 'active');
    const habitsTotal = activeHabits.length;
    const habitsCompleted = state.habitLogs.filter(l => isSameDay(new Date(l.date), today) && l.completed).length;
    let habitsScore = 0;
    if (habitsTotal > 0) {
        // Cap at 30 if they complete more than expected
        habitsScore = Math.min((habitsCompleted / habitsTotal) * 30, 30);
    } else {
        habitsScore = 30; // Free points if no habits tracked
    }

    // 3. Metrics (20%)
    // Check if user updated any metric today
    const hasMetricUpdateToday = state.metricEntries.some(e => isSameDay(new Date(e.date), today));
    const metricsScore = hasMetricUpdateToday ? 20 : 0;

    return Math.round(tasksScore + habitsScore + metricsScore);
}

export function OverviewHeader() {
    const { state } = useData();
    const focusIndex = useMemo(() => calculateTodayScore(state), [state]);

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

        // Fallback mockup as per requirements if streak is 0
        return currentStreak > 0 ? currentStreak : 4;
    }, [state.actions, state.habitLogs]);

    // Calculate circumference for strokeDasharray
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * focusIndex) / 100;

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-6">
                {/* Focus Ring */}
                <div className="bg-white dark:bg-card px-6 py-4 rounded-3xl border border-border/50 shadow-sm flex items-center gap-5">
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r={radius} className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="6" />
                            <circle
                                cx="32" cy="32" r={radius}
                                className="stroke-orange-500 fill-none transition-all duration-1000 ease-out"
                                strokeWidth="6"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-sm font-black tracking-tighter">{focusIndex}%</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Фокус дня</h2>
                        <p className="text-xl font-black tracking-tight leading-none text-foreground">
                            {focusIndex > 80 ? 'Максимальний' : focusIndex > 50 ? 'Оптимальний' : 'Низький'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Momentum */}
            <div className="bg-white dark:bg-card px-6 py-4 rounded-3xl border border-border/50 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-xl tracking-tight leading-none">{streak} дні(в)</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Продуктивності</span>
                </div>
            </div>
        </div>
    );
}
