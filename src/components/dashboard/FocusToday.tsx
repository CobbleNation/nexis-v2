'use client';

import { useMemo } from 'react';
import { useData } from '@/lib/store';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday } from 'date-fns';

export function FocusToday() {
    const { state, dispatch } = useData();

    // Find today's tasks
    const todayTasks = useMemo(() => {
        return state.actions
            .filter(a => a.date && isToday(new Date(a.date)))
            .sort((a, b) => {
                // Uncompleted first
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                // High priority first
                const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
                return (priorityWeight[b.priority || 'low'] || 0) - (priorityWeight[a.priority || 'low'] || 0);
            });
    }, [state.actions]);

    const mainTask = todayTasks[0];
    const secondaryTasks = todayTasks.slice(1, 4); // Take up to 3 secondary tasks

    const toggleTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const actionToUpdate = state.actions.find(a => a.id === id);
        if (actionToUpdate) {
            dispatch({ type: 'UPDATE_ACTION', payload: { ...actionToUpdate, completed: !actionToUpdate.completed } });
        }
    };

    if (todayTasks.length === 0) {
        return (
            <div className="flex flex-col h-full bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-950/20 dark:to-background border border-orange-200/50 dark:border-orange-900/40 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
                        <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-orange-950 dark:text-orange-100">
                        Фокус Дня
                    </h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-orange-200/50 dark:border-orange-900/30 rounded-2xl">
                    <Target className="w-8 h-8 text-orange-300 dark:text-orange-700 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-orange-800/60 dark:text-orange-200/50">
                        На сьогодні немає запланованих завдань
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-background border border-orange-200/80 dark:border-orange-900/40 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20">
                    <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-orange-950 dark:text-orange-100">
                    Фокус Дня
                </h2>
            </div>

            {/* Main Task */}
            {mainTask && (
                <div
                    className="mb-6 group cursor-pointer"
                    onClick={(e) => toggleTask(mainTask.id, e as any)}
                >
                    <p className="text-xs font-bold text-orange-600/80 dark:text-orange-400/80 uppercase tracking-widest mb-2">
                        Головне завдання
                    </p>
                    <div className="flex items-start gap-4 p-5 bg-white/70 dark:bg-card/70 backdrop-blur-md border border-orange-200/50 dark:border-orange-900/30 rounded-2xl hover:bg-white dark:hover:bg-card transition-all shadow-sm">
                        <button className="mt-1 flex-shrink-0 text-orange-500">
                            {mainTask.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            ) : (
                                <Circle className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                        <div className="flex-1 min-w-0">
                            <h3 className={cn(
                                "text-lg font-bold leading-tight",
                                mainTask.completed ? "line-through text-muted-foreground" : "text-foreground"
                            )}>
                                {mainTask.title}
                            </h3>
                            {mainTask.areaId && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                    {state.areas.find(a => a.id === mainTask.areaId)?.title || 'Загальне'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Secondary Tasks */}
            {secondaryTasks.length > 0 && (
                <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest mb-3">
                        Другорядні завдання
                    </p>
                    <div className="space-y-3">
                        {secondaryTasks.map(task => (
                            <div
                                key={task.id}
                                className="flex items-center gap-3 p-3 bg-white/40 dark:bg-card/40 hover:bg-white/80 dark:hover:bg-card/80 border border-orange-100 dark:border-white/5 rounded-xl transition-colors cursor-pointer group"
                                onClick={(e) => toggleTask(task.id, e as any)}
                            >
                                <button className="flex-shrink-0 text-orange-500/70">
                                    {task.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </button>
                                <span className={cn(
                                    "text-sm font-medium truncate flex-1",
                                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                                )}>
                                    {task.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
