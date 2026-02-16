'use client';

import React from 'react';
import { Target, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Goal } from '@/types';

interface ContextGoalsProps {
    goals: Goal[];
    areaColor?: string;
}

export function ContextGoals({ goals, areaColor }: ContextGoalsProps) {
    if (goals.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Активні Стратегічні Цілі
            </h3>
            <div className="grid gap-3">
                {goals.slice(0, 3).map((goal) => (
                    <div
                        key={goal.id}
                        className="group flex items-center justify-between p-4 bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-secondary text-slate-400 dark:text-muted-foreground group-hover:bg-slate-100 dark:group-hover:bg-accent group-hover:text-foreground transition-colors",
                                areaColor && "bg-opacity-10 text-opacity-100"
                            )}>
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground leading-tight">
                                    {goal.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {goal.description || "Strategic Objective"}
                                </p>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
