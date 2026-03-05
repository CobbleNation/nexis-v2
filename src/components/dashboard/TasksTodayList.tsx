'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/lib/store';
import { isToday } from 'date-fns';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function TasksTodayList() {
    const { state, dispatch } = useData();
    const [selectedArea, setSelectedArea] = useState<string>('all');

    // All today tasks
    const allTodayTasks = useMemo(() => {
        return state.actions
            .filter(a => a.type === 'task' && a.date && isToday(new Date(a.date)));
    }, [state.actions]);

    // Used areas by these tasks
    const usedAreas = useMemo(() => {
        const areaIds = new Set(allTodayTasks.map(t => t.areaId).filter(Boolean));
        return state.areas.filter(a => areaIds.has(a.id));
    }, [allTodayTasks, state.areas]);

    // Filter tasks
    const filteredTasks = useMemo(() => {
        let tasks = allTodayTasks;
        if (selectedArea !== 'all') {
            tasks = tasks.filter(t => t.areaId === selectedArea);
        }
        return tasks.sort((a, b) => {
            // High priority first, then sort by name or created date
            const pw: Record<string, number> = { high: 3, medium: 2, low: 1 };
            return (pw[b.priority || 'low'] || 0) - (pw[a.priority || 'low'] || 0);
        });
    }, [allTodayTasks, selectedArea]);

    const activeTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    const displayTasks = [...activeTasks, ...completedTasks];

    const toggleTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const action = state.actions.find(a => a.id === id);
        if (action) {
            dispatch({ type: 'UPDATE_ACTION', payload: { ...action, completed: !action.completed } });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold tracking-tight">Завдання на сьогодні</h3>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-muted-foreground">
                    {allTodayTasks.filter(t => t.completed).length} / {allTodayTasks.length}
                </span>
            </div>

            {/* Area filter chips */}
            {usedAreas.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 mb-2 -mx-2 px-2 border-b border-border/50">
                    <button
                        onClick={() => setSelectedArea('all')}
                        className={cn(
                            "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                            selectedArea === 'all'
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                    >
                        Всі
                    </button>
                    {usedAreas.map(area => (
                        <button
                            key={area.id}
                            onClick={() => setSelectedArea(area.id)}
                            className={cn(
                                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                selectedArea === area.id
                                    ? 'text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                            )}
                            style={selectedArea === area.id ? { backgroundColor: area.color || '#f97316' } : {}}
                        >
                            <span
                                className={cn("w-2 h-2 rounded-full shrink-0", selectedArea === area.id && 'bg-white/50')}
                                style={selectedArea !== area.id ? { backgroundColor: area.color || '#f97316' } : {}}
                            />
                            {area.title}
                        </button>
                    ))}
                </div>
            )}

            {filteredTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl">
                    <p className="text-sm font-bold text-foreground">Завдань немає</p>
                    <p className="text-xs text-muted-foreground">Для обраної сфери на сьогодні</p>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {/* Active tasks */}
                    {displayTasks.filter(t => !t.completed).length > 0 && (
                        <div className="mb-2">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2">Активні</h4>
                            <div className="flex flex-col gap-2">
                                {displayTasks.filter(t => !t.completed).map(task => (
                                    <div
                                        key={task.id}
                                        onClick={(e) => toggleTask(task.id, e)}
                                        className="flex items-start gap-4 p-3 rounded-2xl border bg-white dark:bg-card border-border/50 hover:border-border/80 transition-all cursor-pointer group"
                                    >
                                        <button className="mt-0.5 shrink-0 transition-colors">
                                            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                                        </button>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium tracking-tight text-sm text-foreground">
                                                {task.title}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed tasks */}
                    {displayTasks.filter(t => t.completed).length > 0 && (
                        <div className="mt-2">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-2">Виконані</h4>
                            <div className="flex flex-col gap-2">
                                {displayTasks.filter(t => t.completed).map(task => (
                                    <div
                                        key={task.id}
                                        onClick={(e) => toggleTask(task.id, e)}
                                        className="flex items-start gap-4 p-3 rounded-2xl border bg-slate-50 dark:bg-slate-900/20 border-transparent opacity-60 transition-all cursor-pointer hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-900/50"
                                    >
                                        <button className="mt-0.5 shrink-0 transition-colors">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </button>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium tracking-tight text-sm line-through text-muted-foreground">
                                                {task.title}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Link to all actions */}
                    <div className="mt-auto pt-4 shrink-0">
                        <Link
                            href="/actions"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Керувати всіма завданнями
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
