'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/store';
import { calculateFocusLevel } from '@/lib/metrics';
import { Activity, Target, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday } from 'date-fns';

export function LifeStatus() {
    const { state } = useData();
    const metrics = useMemo(() => calculateFocusLevel(state), [state]);

    // Calculate Tasks Today Progress
    const tasksToday = useMemo(() => {
        const todayActions = state.actions.filter(a => a.date && isToday(new Date(a.date)));
        const completedToday = todayActions.filter(a => a.completed).length;
        const totalToday = todayActions.length;

        return { completed: completedToday, total: totalToday };
    }, [state.actions]);

    // Calculate Energy Level (Mock based on Focus/Mood or defaults)
    const energyLevel = useMemo(() => {
        // Here we could use real energy tracking if available, 
        // for now we use a derived metric or mock from Journal entries
        const recentMoods = state.journal
            .filter(j => isToday(new Date(j.date)) && j.mood !== undefined)
            .map(j => j.mood as number);

        if (recentMoods.length > 0) {
            const avgMood = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
            // Assuming mood is out of 10
            return Math.round((avgMood / 10) * 100);
        }

        // Fallback to focus score slightly randomized
        return Math.min(100, Math.max(0, metrics.score + (Math.random() * 10 - 5)));
    }, [state.journal, metrics.score]);

    // Calculate Goals Progress
    const goalsProgress = useMemo(() => {
        if (state.goals.length === 0) return 0;

        const totalProgress = state.goals.reduce((acc, goal) => {
            const completedSteps = goal.subGoals?.filter((s) => s.completed).length || 0;
            const totalSteps = goal.subGoals?.length || 1; // Avoid division by zero
            return acc + (completedSteps / totalSteps);
        }, 0);

        return Math.round((totalProgress / state.goals.length) * 100);
    }, [state.goals]);

    const cards = [
        {
            title: 'Індекс Фокусу',
            value: `${metrics.score}%`,
            icon: Activity,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            title: 'Завдання (Сьогодні)',
            value: `${tasksToday.completed} / ${tasksToday.total}`,
            icon: CheckCircle2,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Рівень Енергії',
            value: `${Math.round(energyLevel)}%`,
            icon: Zap,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            title: 'Прогрес Цілей',
            value: `${goalsProgress}%`,
            icon: Target,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        className="flex flex-col p-4 bg-white dark:bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={cn("p-2 rounded-xl shrink-0 flex items-center justify-center", card.bg, card.color)}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
                                {card.title}
                            </span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight">
                                {card.value}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
