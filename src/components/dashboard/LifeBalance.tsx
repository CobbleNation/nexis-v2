'use client';

import { useData } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function LifeBalance() {
    const { state } = useData();

    // Calculate progress for each area
    const areaStats = useMemo(() => {
        return state.areas.map(area => {
            // Find related goals
            const areaGoals = state.goals.filter(g => g.areaId === area.id);
            // Find related actions
            const areaActions = state.actions.filter(a => a.areaId === area.id);

            let totalItems = 0;
            let completedItems = 0;

            // Add actions
            totalItems += areaActions.length;
            completedItems += areaActions.filter(a => a.completed).length;

            // Add goals progress
            areaGoals.forEach(goal => {
                const totalSteps = goal.subGoals?.length || 1;
                const completedSteps = goal.subGoals?.filter((s) => s.completed).length || (goal.status === 'completed' ? 1 : 0);

                totalItems += totalSteps;
                completedItems += completedSteps;
            });

            // Calculate percentage
            const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

            return {
                id: area.id,
                title: area.title,
                progress,
                color: area.color || 'bg-slate-500' // Ensure fallback color
            };
        }).sort((a, b) => b.progress - a.progress); // Sort by highest progress first
    }, [state.areas, state.goals, state.actions]);

    if (areaStats.length === 0) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Баланс Життя</h3>
                <div className="flex-1 flex items-center justify-center text-center p-6 text-muted-foreground/60">
                    <p className="text-sm">Сфери життя не додані</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 tracking-tight">Баланс Життя</h3>

            <div className="flex flex-col gap-4 flex-1 justify-center">
                {areaStats.map((area) => {
                    // Extract color class safely (e.g., 'bg-blue-500' -> 'bg-blue-500' for bar)
                    const colorClass = area.color.startsWith('bg-') ? area.color : `bg-${area.color}-500`;

                    return (
                        <div key={area.id} className="flex flex-col gap-1.5 group cursor-default">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors truncate pr-2">
                                    {area.title}
                                </span>
                                <span className="font-mono font-bold text-xs text-muted-foreground">
                                    {area.progress}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorClass)}
                                    style={{ width: `${area.progress}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
