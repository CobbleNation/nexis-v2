'use client';

import { useData } from '@/lib/store';
import { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { isToday, isYesterday } from 'date-fns';
import { DailyReviewDialog } from '../features/DailyReviewDialog';

export function AIInsight() {
    const { state } = useData();

    const insight = useMemo(() => {
        const todayActions = state.actions.filter(a => a.date && isToday(new Date(a.date)));
        const yesterdayActions = state.actions.filter(a => a.date && isYesterday(new Date(a.date)));

        const completedToday = todayActions.filter(a => a.completed).length;
        const completedYesterday = yesterdayActions.filter(a => a.completed).length;

        if (completedToday > completedYesterday && completedYesterday > 0) {
            return {
                title: 'Чудовий темп!',
                message: `Сьогодні ви перевершили вчорашній результат на ${completedToday - completedYesterday} завд.`,
            };
        } else if (completedToday < completedYesterday && todayActions.length > 0) {
            return {
                title: 'Аналіз Продуктивності',
                message: 'Менш продуктивний день. Зосередьтесь хоча б на одному головному завданні.',
            };
        } else if (todayActions.length === 0) {
            return {
                title: 'Новий День',
                message: 'Заплануйте дії на сьогодні та синхронізуйте з вашими цілями.',
            };
        }

        return {
            title: 'Тактичний Аналіз',
            message: 'Система працює стабільно. Продовжуйте рухатись за планом.',
        };
    }, [state.actions]);

    const triggerButton = (
        <button className="w-full mt-auto flex items-center justify-center gap-2 py-3 px-5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-700 dark:text-amber-400 rounded-2xl font-bold text-sm transition-all group">
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
            AI Аналіз дня
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/20 dark:to-background border border-indigo-100/50 dark:border-indigo-900/40 rounded-3xl p-6 md:p-8 shadow-sm gap-5">
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Аналіз
            </h3>

            <div className="flex flex-col flex-1 gap-3">
                <h4 className="font-bold text-foreground">
                    {insight.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.message}
                </p>
            </div>

            <DailyReviewDialog customTrigger={triggerButton} />
        </div>
    );
}
