'use client';

import { useData } from '@/lib/store';
import { isToday } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function TasksTodayList() {
    const { state, dispatch } = useData();

    const todayTasks = useMemo(() => {
        return state.actions
            .filter(a => a.date && isToday(new Date(a.date)))
            .sort((a, b) => Number(a.completed) - Number(b.completed)); // incomplete first
    }, [state.actions]);

    const toggleTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const action = state.actions.find(a => a.id === id);
        if (action) {
            dispatch({ type: 'UPDATE_ACTION', payload: { ...action, completed: !action.completed } });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold tracking-tight">Завдання на сьогодні</h3>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-muted-foreground">
                    {todayTasks.filter(t => t.completed).length} / {todayTasks.length}
                </span>
            </div>

            {todayTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/50 rounded-2xl">
                    <p className="text-sm font-medium text-muted-foreground">Немає завдань на сьогодні</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {todayTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={(e) => toggleTask(task.id, e)}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                task.completed ? "bg-slate-50 dark:bg-slate-900/20 border-transparent opacity-60" : "bg-white dark:bg-card border-border/50 hover:border-border/80"
                            )}
                        >
                            <button className="mt-0.5 shrink-0 transition-colors">
                                {task.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                            </button>
                            <div className="flex flex-col flex-1">
                                <span className={cn(
                                    "font-medium tracking-tight text-sm",
                                    task.completed && "line-through text-muted-foreground"
                                )}>
                                    {task.title}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
