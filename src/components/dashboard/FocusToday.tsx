'use client';

import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/lib/store';
import { Target, CheckCircle2, Circle, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, format } from 'date-fns';
import { SelectFocusModal, FocusItem } from './SelectFocusModal';

const FOCUS_STORAGE_KEY = 'nexis-day-focus';

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadFocusFromStorage(): FocusItem | null {
    try {
        const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
        if (!raw) return null;
        const { date, item } = JSON.parse(raw);
        if (date !== getTodayKey()) return null; // Expired — new day
        return item as FocusItem;
    } catch {
        return null;
    }
}

function saveFocusToStorage(item: FocusItem) {
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({
        date: getTodayKey(),
        item
    }));
}

export function FocusToday() {
    const { state, dispatch } = useData();
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [selectModalOpen, setSelectModalOpen] = useState(false);
    const [focusItem, setFocusItem] = useState<FocusItem | null>(null);

    // Load focus from localStorage on mount (client only)
    useEffect(() => {
        setFocusItem(loadFocusFromStorage());
    }, []);

    const handleSelectFocus = (item: FocusItem) => {
        saveFocusToStorage(item);
        setFocusItem(item);
    };

    const handleClearFocus = () => {
        localStorage.removeItem(FOCUS_STORAGE_KEY);
        setFocusItem(null);
    };

    // Related info for the selected focus item
    const relatedInfo = useMemo(() => {
        if (!focusItem) return null;

        if (focusItem.type === 'task') {
            const task = state.actions.find(a => a.id === focusItem.id);
            if (!task) return null;
            const project = task.projectId ? state.projects.find(p => p.id === task.projectId) : null;
            const todayHabits = state.habits.slice(0, 1); // Show first habit as example
            return {
                projectTitle: project?.title,
                relatedTasksCount: project
                    ? state.actions.filter(a => a.projectId === project.id && !a.completed).length
                    : undefined,
                habitTitle: todayHabits[0]?.title,
                isCompleted: task.completed
            };
        }

        if (focusItem.type === 'project') {
            const project = state.projects.find(p => p.id === focusItem.id);
            if (!project) return null;
            return {
                relatedTasksCount: state.actions.filter(a => a.projectId === focusItem.id && !a.completed).length,
            };
        }

        if (focusItem.type === 'goal') {
            const goal = state.goals.find(g => g.id === focusItem.id);
            if (!goal) return null;
            return {
                relatedTasksCount: state.actions.filter(a => a.linkedGoalId === focusItem.id && !a.completed).length,
            };
        }

        return null;
    }, [focusItem, state.actions, state.projects, state.habits, state.goals]);

    // Secondary tasks (for when no explicit focus — show today's task list)
    const todayTasks = useMemo(() => {
        return state.actions
            .filter(a => a.date && isToday(new Date(a.date)))
            .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
                return (priorityWeight[b.priority || 'low'] || 0) - (priorityWeight[a.priority || 'low'] || 0);
            });
    }, [state.actions]);

    const secondaryTasks = todayTasks.slice(0, 3);

    const toggleTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const actionToUpdate = state.actions.find(a => a.id === id);
        if (actionToUpdate) {
            dispatch({ type: 'UPDATE_ACTION', payload: { ...actionToUpdate, completed: !actionToUpdate.completed } });
        }
    };

    // FOCUS MODE — full-screen immersion
    if (isFocusMode && focusItem) {
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
                <h2 className="text-orange-100 font-bold text-sm uppercase tracking-widest mb-4">Поточний фокус</h2>
                <h1 className="text-3xl md:text-5xl font-black text-center mb-10 leading-tight max-w-3xl">
                    {focusItem.title}
                </h1>
                <button className="px-12 py-5 bg-white text-orange-600 font-black text-lg md:text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform uppercase tracking-wider">
                    Почати
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col md:flex-row gap-8 h-full bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-background border border-orange-200/80 dark:border-orange-900/40 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl" />

                {/* Left: Focus Content */}
                <div className="flex-1 flex flex-col justify-center z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full shadow-md shadow-orange-500/30">
                            <Target className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-orange-950 dark:text-orange-100 uppercase">
                            Фокус Дня
                        </h2>
                        {focusItem && (
                            <button
                                onClick={handleClearFocus}
                                className="ml-auto p-1.5 hover:bg-orange-200/50 dark:hover:bg-orange-900/30 rounded-full transition text-orange-500/60 hover:text-orange-600"
                                title="Скинути фокус"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Focus Item or Empty State */}
                    {focusItem ? (
                        <div
                            className="group cursor-pointer"
                            onClick={() => setIsFocusMode(true)}
                        >
                            <div className="flex flex-col p-6 md:p-8 bg-white/70 dark:bg-card/70 backdrop-blur-md border border-orange-200/50 dark:border-orange-900/30 rounded-3xl transition-all shadow-sm group-hover:shadow-md hover:bg-white dark:hover:bg-card">
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                            {focusItem.title}
                                        </h3>

                                        {/* Related info */}
                                        {relatedInfo && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {relatedInfo.projectTitle && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                        Проєкт: {relatedInfo.projectTitle}
                                                    </span>
                                                )}
                                                {relatedInfo.relatedTasksCount !== undefined && relatedInfo.relatedTasksCount > 0 && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                        Задач: {relatedInfo.relatedTasksCount}
                                                    </span>
                                                )}
                                                {relatedInfo.habitTitle && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                        Звичка: {relatedInfo.habitTitle}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-orange-600/60 dark:text-orange-400/40 text-center mt-2 font-medium">
                                Натисніть щоб увійти в режим фокусу
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-orange-200/80 dark:border-orange-900/40 rounded-3xl gap-4 text-center">
                            <div className="w-14 h-14 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center">
                                <Target className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="font-bold text-orange-900 dark:text-orange-200">Фокус дня не визначено</p>
                                <p className="text-sm text-orange-700/60 dark:text-orange-400/50 mt-1">Оберіть головну ціль для підвищення продуктивності</p>
                            </div>
                            <button
                                onClick={() => setSelectModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm transition shadow-md shadow-orange-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Обрати фокус дня
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Secondary Tasks */}
                {secondaryTasks.length > 0 && (
                    <div className="flex-1 md:max-w-xs flex flex-col justify-center border-t md:border-t-0 md:border-l border-orange-200/50 dark:border-white/10 pt-6 md:pt-0 md:pl-8 z-10">
                        <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-4">
                            Задачі на сьогодні
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

                        {!focusItem && (
                            <button
                                onClick={() => setSelectModalOpen(true)}
                                className="mt-4 text-xs text-orange-500 hover:text-orange-600 font-bold transition"
                            >
                                + Обрати фокус з цих задач
                            </button>
                        )}
                    </div>
                )}
            </div>

            <SelectFocusModal
                open={selectModalOpen}
                onOpenChange={setSelectModalOpen}
                onSelect={handleSelectFocus}
            />
        </>
    );
}
