'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface ContextBriefProps {
    activeCount: number;
    highPriorityCount: number;
    stagnantAreas: string[];
    focusArea?: string;
}

export function ContextBrief({ activeCount, highPriorityCount, stagnantAreas, focusArea }: ContextBriefProps) {
    // Logic to generate the message
    const getMessage = () => {
        if (focusArea) {
            return `Сьогодні фокус на ${focusArea}. Тут у вас ${activeCount} завдань.`;
        }
        if (stagnantAreas.length > 0) {
            return `Баланс порушено: сфера "${stagnantAreas[0]}" без активності останнім часом.`;
        }
        if (highPriorityCount > 0) {
            return `Чистий простір попереду. ${highPriorityCount} пріоритетних завдань потребують уваги.`;
        }
        return "Система стабільна. Визначте ваш наступний хід.";
    };

    return (
        <div className="flex items-start gap-4 p-6 bg-slate-50 dark:bg-card border border-slate-100 dark:border-border rounded-2xl">
            <div className="h-10 w-10 shrink-0 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">
                    {getMessage()}
                </h3>
                <p className="text-muted-foreground text-sm">
                    {activeCount === 0
                        ? "Без відволікань. Ідеальний час для глибокої роботи або планування."
                        : "Фокусуйтесь на впливі, а не на кількості."}
                </p>
            </div>
        </div>
    );
}
