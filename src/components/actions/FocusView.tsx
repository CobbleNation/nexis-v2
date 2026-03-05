'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { Action } from '@/types';
import { Button } from '@/components/ui/button';
import { Zap, Plus, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function FocusView() {
    const { state, dispatch } = useData();
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    const focusTasks = state.actions.filter(a => a.isFocus && !a.completed);

    // Candidates: Active tasks that are NOT focus
    const candidates = state.actions.filter(a =>
        a.type === 'task' && !a.completed && !a.isFocus && a.status !== 'canceled'
    );

    const addToFocus = (task: Action) => {
        if (focusTasks.length >= 3) {
            toast.warning("Фокус - це вибір. Максимум 3 задачі.");
            return;
        }
        dispatch({ type: 'UPDATE_ACTION' as any, payload: { ...task, isFocus: true } as Action });
    };

    const removeFromFocus = (task: Action) => {
        dispatch({ type: 'UPDATE_ACTION' as any, payload: { ...task, isFocus: false } as Action });
    };

    const completeFocusTask = (task: Action) => {
        dispatch({ type: 'TOGGLE_ACTION', payload: { id: task.id } });
        toast.success("Фокус завершено! Чудова робота.");
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-3 md:p-4">
            <div className="max-w-xl w-full space-y-6">
                <div className="text-center space-y-2 md:space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-full bg-slate-900 dark:bg-primary text-white mb-1 md:mb-2 ring-6 md:ring-8 ring-slate-100 dark:ring-secondary/50">
                        <Zap className="w-7 h-7 md:w-10 md:h-10" />
                    </div>
                    <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-foreground">Ваш Фокус</h2>
                    <p className="text-muted-foreground text-xs md:text-base">Саме те, що має значення сьогодні. (Макс 3)</p>
                </div>

                {/* Focus Slots */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {focusTasks.map(task => (
                            <motion.div
                                key={task.id}
                                layoutId={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white dark:bg-card border-2 border-slate-900/10 dark:border-primary/20 p-4 md:p-6 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none"
                            >
                                {/* Task title */}
                                <p className="text-sm md:text-lg font-semibold text-slate-800 dark:text-foreground mb-3 leading-snug">
                                    {task.title}
                                </p>
                                {/* Buttons row - pinned to bottom on mobile */}
                                <div className="flex items-center gap-2 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFromFocus(task)}
                                        className="text-slate-400 dark:text-muted-foreground/50 hover:text-slate-600 dark:hover:text-foreground text-xs px-2"
                                    >
                                        <X className="w-4 h-4 mr-1" /> Видалити
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => completeFocusTask(task)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-orange-200 dark:shadow-none text-xs"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-1" /> Готово
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Placeholder / Add Button */}
                    {focusTasks.length < 3 && (
                        <Button
                            variant="ghost"
                            onClick={() => setIsSelectorOpen(true)}
                            className="w-full h-16 md:h-20 border-dashed border-2 border-slate-200 dark:border-border rounded-2xl text-slate-400 dark:text-muted-foreground hover:border-slate-400 dark:hover:border-primary/50 hover:text-slate-600 dark:hover:text-primary bg-transparent hover:bg-slate-50 dark:hover:bg-secondary/20 transition-all text-sm md:text-lg font-medium"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Додати до фокусу
                        </Button>
                    )}
                </div>

                {/* Task Selector Modal */}
                {isSelectorOpen && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg p-5 shadow-2xl dark:shadow-black/50 space-y-4 border dark:border-border">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-base dark:text-foreground">Оберіть для фокусу</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsSelectorOpen(false)}><X className="w-5 h-5" /></Button>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto space-y-2">
                                {candidates.map(candidate => (
                                    <div key={candidate.id} onClick={() => { addToFocus(candidate); setIsSelectorOpen(false); }} className="p-3 bg-slate-50 dark:bg-secondary/20 hover:bg-orange-50 dark:hover:bg-primary/10 rounded-xl cursor-pointer transition-colors text-sm font-medium dark:text-foreground">
                                        {candidate.title}
                                    </div>
                                ))}
                                {candidates.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">Немає доступних завдань. Створіть нове.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
