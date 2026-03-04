'use client';

import { useData } from '@/lib/store';
import { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { isToday, isYesterday } from 'date-fns';

export function AIInsight() {
    const { state } = useData();

    const insight = useMemo(() => {
        // Very basic simple mock logic for AI Insight based on data
        const todayActions = state.actions.filter(a => a.date && isToday(new Date(a.date)));
        const yesterdayActions = state.actions.filter(a => a.date && isYesterday(new Date(a.date)));

        const completedToday = todayActions.filter(a => a.completed).length;
        const completedYesterday = yesterdayActions.filter(a => a.completed).length;

        if (completedToday > completedYesterday && completedYesterday > 0) {
            return {
                title: 'Чудовий темп!',
                message: `Сьогодні ви перевершили свій вчорашній результат на ${completedToday - completedYesterday} завдань. Продовжуйте в тому ж дусі і не забувайте про відпочинок.`,
                tip: 'Можливо, варто запланувати вечірню рутину?'
            };
        } else if (completedToday < completedYesterday && todayActions.length > 0) {
            return {
                title: 'Аналіз Продуктивності',
                message: 'Сьогодні ви менш продуктивні, ніж вчора. Це абсолютно нормально. Сфокусуйтесь на виконанні хоча б одного головного завдання.',
                tip: 'Розбийте складне завдання на мікро-кроки.'
            };
        } else if (todayActions.length === 0) {
            return {
                title: 'Новий День',
                message: 'На сьогодні не заплановано жодної дії. Гарний час для того, щоб окинути оком свої цілі та скласти план.',
                tip: 'Зробіть ревʼю активних проєктів.'
            };
        }

        return {
            title: 'Тактичний Аналіз',
            message: 'Система працює стабільно. Значних відхилень у вашій продуктивності не виявлено.',
            tip: 'Продовжуйте рухатись за планом.'
        };
    }, [state.actions]);

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/20 dark:to-background border border-indigo-100/50 dark:border-indigo-900/40 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 tracking-tight flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Аналіз
            </h3>

            <div className="flex-1 flex flex-col justify-center">
                <h4 className="font-bold text-foreground mb-2">
                    {insight.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {insight.message}
                </p>
                <div className="mt-auto bg-white/60 dark:bg-black/20 p-4 rounded-2xl border border-indigo-100 dark:border-white/5 flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span className="text-xs font-medium text-indigo-900/80 dark:text-indigo-200/80">
                        {insight.tip}
                    </span>
                </div>
            </div>
        </div>
    );
}
