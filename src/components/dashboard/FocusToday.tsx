'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '@/lib/store';
import { Target, CheckCircle2, Circle, X, Plus, Sparkles, Play, Timer, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday } from 'date-fns';
import { SelectFocusModal, FocusItem } from './SelectFocusModal';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/common/UpgradeModal';
import { FocusHistoryModal, FocusSessionLog } from './FocusHistoryModal';
import { History } from 'lucide-react';

const FOCUS_STORAGE_KEY = 'nexis-day-focus';
const FOCUS_HISTORY_KEY = 'nexis-focus-history';

interface StoredFocus {
    date: string;
    item: FocusItem;
    isAuto: boolean;
    aiReasoning?: string | null;
}

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadFocusFromStorage(): StoredFocus | null {
    try {
        const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
        if (!raw) return null;
        const stored: StoredFocus = JSON.parse(raw);
        if (stored.date !== getTodayKey()) return null;
        return stored;
    } catch {
        return null;
    }
}

function saveFocusToStorage(item: FocusItem, isAuto: boolean, aiReasoning?: string | null) {
    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({
        date: getTodayKey(),
        item,
        isAuto,
        aiReasoning
    }));
}

function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusToday() {
    const { state, dispatch } = useData();
    const { isPro } = useSubscription();

    const [isFocusMode, setIsFocusMode] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [selectModalOpen, setSelectModalOpen] = useState(false);

    // Focus state
    const [focusItem, setFocusItem] = useState<FocusItem | null>(null);
    const [isAutoFocus, setIsAutoFocus] = useState(false);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

    // Auto-compute focus based on today's activity
    const autoFocusSuggestion = useMemo((): FocusItem | null => {
        // 1. Find highest-priority incomplete task for today
        const todayTasks = state.actions.filter(
            a => a.type === 'task' && !a.completed && a.date && isToday(new Date(a.date))
        );
        const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const topTask = todayTasks.sort(
            (a, b) => (priorityWeight[b.priority || 'low'] || 1) - (priorityWeight[a.priority || 'low'] || 1)
        )[0];

        if (topTask) {
            const project = topTask.projectId ? state.projects.find(p => p.id === topTask.projectId) : null;
            return {
                type: 'task',
                id: topTask.id,
                title: topTask.title,
                relatedProjectTitle: project?.title
            };
        }

        // 2. Fallback: project with most incomplete tasks
        const activeProjects = state.projects.filter(p => p.status !== 'completed' && p.status !== 'deferred');
        const topProject = activeProjects
            .map(p => ({
                project: p,
                count: state.actions.filter(a => a.projectId === p.id && !a.completed).length
            }))
            .sort((a, b) => b.count - a.count)[0];

        if (topProject && topProject.count > 0) {
            return {
                type: 'project',
                id: topProject.project.id,
                title: topProject.project.title,
                relatedTasksCount: topProject.count
            };
        }

        // 3. Fallback: active goal
        const activeGoal = state.goals.find(g => g.status === 'active');
        if (activeGoal) {
            return { type: 'goal', id: activeGoal.id, title: activeGoal.title };
        }

        return null;
    }, [state.actions, state.projects, state.goals]);

    // Load focus from localStorage on mount
    useEffect(() => {
        const stored = loadFocusFromStorage();
        if (stored) {
            setFocusItem(stored.item);
            setIsAutoFocus(stored.isAuto);
            setAiReasoning(stored.aiReasoning || null);
        }
    }, []);

    const handleSelectFocus = (item: FocusItem) => {
        saveFocusToStorage(item, false);
        setFocusItem(item);
        setIsAutoFocus(false);
        setAiReasoning(null);
    };

    const handleClearFocus = () => {
        localStorage.removeItem(FOCUS_STORAGE_KEY);
        setFocusItem(null);
        setIsAutoFocus(false);
        setIsFocusMode(false);
        setSessionActive(false);
        setAiReasoning(null);
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedSeconds(0);
    };

    const handleStartSession = () => {
        setSessionActive(true);
        setElapsedSeconds(0);
        setSessionStartTime(new Date().toISOString());
        timerRef.current = setInterval(() => {
            setElapsedSeconds(s => s + 1);
        }, 1000);
    };

    const handleEndSession = () => {
        if (sessionActive && focusItem && sessionStartTime && elapsedSeconds > 0) {
            // Save to history
            const log: FocusSessionLog = {
                id: Math.random().toString(36).substring(2, 9),
                focusItemId: focusItem.id,
                focusItemTitle: focusItem.title,
                durationSeconds: Math.floor(elapsedSeconds),
                startTime: sessionStartTime,
                endTime: new Date().toISOString()
            };
            try {
                const existingRaw = localStorage.getItem(FOCUS_HISTORY_KEY);
                const existing = existingRaw ? JSON.parse(existingRaw) : [];
                existing.push(log);
                localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(existing));
            } catch (e) {
                console.error("Failed to save focus history", e);
            }
        }

        setSessionActive(false);
        setIsFocusMode(false);
        setSessionStartTime(null);
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedSeconds(0);
    };

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);



    // Related tasks for the focus item (shown in focus mode)
    const relatedTasks = useMemo(() => {
        if (!focusItem) return [];
        if (focusItem.type === 'project') {
            return state.actions.filter(a => a.projectId === focusItem.id && !a.completed).slice(0, 5);
        }
        if (focusItem.type === 'goal') {
            return state.actions.filter(a => a.linkedGoalId === focusItem.id && !a.completed).slice(0, 5);
        }
        if (focusItem.type === 'task') {
            const task = state.actions.find(a => a.id === focusItem.id);
            if (task) return [task];
        }
        return [];
    }, [focusItem, state.actions]);

    // Related info for the selected focus item (card badges)
    const relatedInfo = useMemo(() => {
        if (!focusItem) return null;
        if (focusItem.type === 'task') {
            const task = state.actions.find(a => a.id === focusItem.id);
            if (!task) return null;
            const project = task.projectId ? state.projects.find(p => p.id === task.projectId) : null;
            return {
                projectTitle: project?.title,
                isCompleted: task.completed
            };
        }
        if (focusItem.type === 'project') {
            return {
                relatedTasksCount: state.actions.filter(a => a.projectId === focusItem.id && !a.completed).length,
            };
        }
        if (focusItem.type === 'goal') {
            return {
                relatedTasksCount: state.actions.filter(a => a.linkedGoalId === focusItem.id && !a.completed).length,
            };
        }
        return null;
    }, [focusItem, state.actions, state.projects]);

    const todayTasks = useMemo(() => {
        return state.actions
            .filter(a => a.date && isToday(new Date(a.date)))
            .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                const pw: Record<string, number> = { high: 3, medium: 2, low: 1 };
                return (pw[b.priority || 'low'] || 0) - (pw[a.priority || 'low'] || 0);
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

    // ─── FOCUS MODE (Full-Screen) ────────────────────────────────────────────
    if (isFocusMode && focusItem) {
        return (
            <div className="relative flex flex-col h-full min-h-[380px] bg-slate-50 dark:bg-card border border-border/50 text-foreground rounded-3xl p-4 sm:p-8 md:p-12 shadow-sm animate-in zoom-in-95 duration-300 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Top bar */}
                <div className="flex items-center justify-between mb-8 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                            <Target className="w-4 h-4" />
                        </div>
                        <span className="text-primary font-bold text-sm uppercase tracking-widest hidden sm:inline-block">
                            Фокус-режим
                        </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {!sessionActive && (
                            <button
                                onClick={() => setHistoryModalOpen(true)}
                                className="flex items-center gap-1.5 p-2 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 border border-border/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-muted-foreground rounded-full sm:rounded-2xl transition shadow-sm text-sm font-bold"
                                title="Історія сесій"
                            >
                                <History className="w-4 h-4" />
                                <span className="hidden sm:inline-block">Історія</span>
                            </button>
                        )}
                        {sessionActive && (
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-border/50 shadow-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                                <Timer className="w-4 h-4 text-primary animate-pulse" />
                                <span className="font-mono font-black text-sm text-foreground">{formatElapsed(elapsedSeconds)}</span>
                            </div>
                        )}
                        <button
                            onClick={handleEndSession}
                            className="p-2 bg-white dark:bg-slate-800 border border-border/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-muted-foreground rounded-full transition"
                            title="Вийти з фокус-режиму"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Focus title */}
                <div className="flex-1 flex flex-col items-center justify-center text-center z-10 py-4">
                    <h1 className="text-lg sm:text-2xl md:text-4xl font-black leading-tight max-w-2xl mb-4 md:mb-6 text-foreground break-words hyphens-auto">
                        {focusItem.title}
                    </h1>

                    {/* Related tasks checklist */}
                    {relatedTasks.length > 0 && (
                        <div className="w-full max-w-md mt-2 mb-8 space-y-2">
                            {relatedTasks.map(task => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        "flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800/50 border border-border/50 hover:border-primary/20 rounded-2xl cursor-pointer transition-colors text-left shadow-sm",
                                        task.completed && "opacity-50 bg-slate-50 dark:bg-slate-900/30 border-transparent"
                                    )}
                                    onClick={(e) => toggleTask(task.id, e)}
                                >
                                    {task.completed
                                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        : <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                                    }
                                    <span className={cn(
                                        "text-sm font-bold text-foreground",
                                        task.completed && "line-through text-muted-foreground"
                                    )}>
                                        {task.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Start / Active indicator */}
                    {!sessionActive ? (
                        <button
                            onClick={handleStartSession}
                            className="flex items-center gap-3 px-12 py-5 bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Play className="w-6 h-6" />
                            Почати
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 text-primary text-sm font-bold">
                                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                                Сесія активна
                            </div>
                            <button
                                onClick={handleEndSession}
                                className="px-10 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground font-bold text-base rounded-2xl border border-border/50 shadow-sm transition"
                            >
                                Завершити сесію
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── NORMAL VIEW ─────────────────────────────────────────────────────────
    return (
        <>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 h-full bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-background border border-primary/20 rounded-3xl p-4 md:p-10 shadow-sm relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {/* Left: Focus Content */}
                <div className="flex-1 flex flex-col justify-center z-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-md shadow-primary/30">
                            <Target className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-foreground uppercase">
                            Фокус Дня
                        </h2>
                        {focusItem && (
                            <div className="ml-auto flex items-center gap-2">
                                <button
                                    onClick={() => setHistoryModalOpen(true)}
                                    className="p-1.5 hover:bg-primary/10 rounded-full transition text-primary/60 hover:text-primary"
                                    title="Історія сесій"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleClearFocus}
                                    className="p-1.5 hover:bg-primary/10 rounded-full transition text-primary/60 hover:text-primary"
                                    title="Скинути фокус"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Focus Item or Empty State */}
                    {focusItem ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col p-4 md:p-8 bg-white/70 dark:bg-card/70 backdrop-blur-md border border-primary/20 rounded-3xl shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-xl md:text-2xl font-black leading-tight tracking-tight text-foreground">
                                            {focusItem.title}
                                        </h3>

                                        {/* Related info badges */}
                                        {relatedInfo && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {relatedInfo.projectTitle && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                        Проєкт: {relatedInfo.projectTitle}
                                                    </span>
                                                )}
                                                {'relatedTasksCount' in relatedInfo && relatedInfo.relatedTasksCount !== undefined && relatedInfo.relatedTasksCount > 0 && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                        Задач: {relatedInfo.relatedTasksCount}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* AI Reasoning display if auto generated */}
                                        {isAutoFocus && aiReasoning && (
                                            <div className="mt-5 flex items-start gap-2.5 bg-primary/5 p-3 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Bot className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <p className="text-sm text-foreground leading-relaxed max-w-sm">
                                                    <span className="font-bold opacity-80 uppercase tracking-widest text-[10px] block mb-1">AI Аналіз</span>
                                                    {aiReasoning}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsFocusMode(true)}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-sm transition shadow-md shadow-primary/20"
                                >
                                    <Play className="w-4 h-4" />
                                    Увійти у фокус-режим
                                </button>
                                <button
                                    onClick={() => setSelectModalOpen(true)}
                                    className="px-4 py-3 border border-primary/20 hover:bg-primary/5 rounded-2xl text-sm font-bold text-primary transition"
                                >
                                    Змінити
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-3xl gap-4 text-center">
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                <Target className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-lg tracking-tight">Фокус дня не визначено</p>
                                <p className="text-sm text-primary/60 mt-1">Оберіть головну ціль для підвищення продуктивності</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectModalOpen(true)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-primary/20 hover:bg-primary/5 text-primary rounded-2xl font-bold text-sm transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Вручну
                                </button>

                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Secondary Tasks */}
                {secondaryTasks.length > 0 && (
                    <div className="flex-1 md:max-w-xs flex flex-col justify-center border-t md:border-t-0 md:border-l border-primary/20 dark:border-white/10 pt-6 md:pt-0 md:pl-8 z-10">
                        <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-4">
                            Задачі на сьогодні
                        </p>
                        <div className="space-y-3">
                            {secondaryTasks.map(task => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        "flex items-start gap-3 p-4 bg-white/40 dark:bg-card/40 border rounded-2xl transition-colors cursor-pointer group hover:shadow-sm",
                                        task.completed ? "border-transparent opacity-60" : "border-primary/10 dark:border-white/5 hover:bg-white/80 dark:hover:bg-card/80 hover:border-primary/20 dark:hover:border-white/10"
                                    )}
                                    onClick={(e) => toggleTask(task.id, e)}
                                >
                                    <button className="mt-0.5 flex-shrink-0 text-primary/70 transition-colors">
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
                                className="mt-4 text-xs text-primary hover:text-primary/80 font-bold transition"
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

            <FocusHistoryModal
                open={historyModalOpen}
                onOpenChange={setHistoryModalOpen}
            />

            <UpgradeModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
                title="AI Фокус Дня"
                description="Розумний аналіз ваших завдань та пріоритетів для вибору ідеального фокусу на день доступний лише в Pro версії."
            />
        </>
    );
}
