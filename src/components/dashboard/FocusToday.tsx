'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/store';
import { Target, CheckCircle2, Circle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday } from 'date-fns';

export function FocusToday() {
    const { state, dispatch } = useData();
    const [isFocusMode, setIsFocusMode] = useState(false);

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

    if (isFocusMode && mainTask) {
        return (
            <div className="relative flex flex-col items-center justify-center h-full min-h-[400px] bg-orange-500 text-white rounded-3xl p-10 md:p-14 shadow-lg animate-in zoom-in-95 duration-300">
                <button
                    onClick={() => setIsFocusMode(false)}
                    className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full transition"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="p-4 bg-black/10 rounded-full mb-6">
                    <Target className="w-10 h-10 opacity-90" />
                </div>
                <h2 className="text-orange-100 font-bold text-sm uppercase tracking-widest mb-4">Поточна задача</h2>
                <h1 className="text-3xl md:text-5xl font-black text-center mb-10 leading-tight max-w-3xl">
                    {mainTask.title}
                </h1>
                <button className="px-12 py-5 bg-white text-orange-600 font-black text-lg md:text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform uppercase tracking-wider">
                    Почати
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-8 h-full bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-background border border-orange-200/80 dark:border-orange-900/40 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl" />

            {/* Left side: Main Focus */}
            <div className="flex-1 flex flex-col justify-center z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full shadow-md shadow-orange-500/30">
                        <Target className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-orange-950 dark:text-orange-100 uppercase">
                        Фокус Дня
                    </h2>
                </div>

                {/* Main Task */}
                {mainTask && (
                    <div
                        className="group cursor-pointer"
                        onClick={() => !mainTask.completed && setIsFocusMode(true)}
                    >
                        <div className={cn(
                            "flex flex-col p-6 md:p-8 bg-white/70 dark:bg-card/70 backdrop-blur-md border rounded-3xl transition-all shadow-sm group-hover:shadow-md",
                            mainTask.completed ? "border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-orange-200/50 dark:border-orange-900/30 hover:bg-white dark:hover:bg-card"
                        )}>
                            <div className="flex items-start gap-4">
                                <button
                                    className="mt-1 flex-shrink-0 text-orange-500 z-20"
                                    onClick={(e) => toggleTask(mainTask.id, e)}
                                >
                                    {mainTask.completed ? (
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-8 h-8 opacity-50 hover:opacity-100 transition-opacity" />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                        "text-2xl md:text-3xl font-black leading-tight tracking-tight",
                                        mainTask.completed ? "line-through text-muted-foreground" : "text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
                                    )}>
                                        {mainTask.title}
                                    </h3>
                                    {mainTask.areaId && (
                                        <div className="inline-flex mt-3 items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {state.areas.find(a => a.id === mainTask.areaId)?.title || 'Загальне'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right side: Secondary tasks */}
            {secondaryTasks.length > 0 && (
                <div className="flex-1 md:max-w-xs flex flex-col justify-center border-t md:border-t-0 md:border-l border-orange-200/50 dark:border-white/10 pt-6 md:pt-0 md:pl-8 z-10">
                    <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-4">
                        Другорядні завдання
                    </p>
                    <div className="space-y-3">
                        {secondaryTasks.map(task => (
                            <div
                                key={task.id}
                                className={cn(
                                    "flex items-start gap-3 p-4 bg-white/40 dark:bg-card/40 border rounded-2xl transition-colors cursor-pointer group hover:shadow-sm",
                                    task.completed ? "border-transparent opacity-60" : "border-orange-100 dark:border-white/5 hover:bg-white/80 dark:hover:bg-card/80 hover:border-orange-200 dark:hover:border-white/10"
                                )}
                                onClick={(e) => toggleTask(task.id, e)}
                            >
                                <button className="mt-0.5 flex-shrink-0 text-orange-500/70 transition-colors">
                                    {task.completed ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </button>
                                <span className={cn(
                                    "text-sm font-bold tracking-tight leading-snug",
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
