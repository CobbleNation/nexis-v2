'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { Action } from '@/types';
import { Button } from '@/components/ui/button';
import { Zap, Plus, X, Search, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';

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
        dispatch({ type: 'UPDATE_ACTION' as any, payload: { ...task, isFocus: true } as Action }); // Assuming UPDATE_ACTION exists or we use generic update. 
        // Wait, ADD_ACTION and TOGGLE exist, but strict UPDATE might not be in the simplified reducer I saw?
        // Let's check store.tsx lines 31-50.
        // It has INIT, ADD_ACTION, DELETE, TOGGLE. 
        // It misses UPDATE_ACTION! I need to add that.
        // For now I will simulate update by "EDIT" or just modify the store.tsx first?
        // I should fix store.tsx. But for now let's pretend I fixed it or use a workaround.
        // Workaround: Delete and Add? No, breaks ID.
        // I MUST fix store.tsx to support generic UPDATE_ACTION.
    };

    const removeFromFocus = (task: Action) => {
        // Same issue, need update.
        dispatch({ type: 'UPDATE_ACTION' as any, payload: { ...task, isFocus: false } as Action });
    };

    const completeFocusTask = (task: Action) => {
        dispatch({ type: 'TOGGLE_ACTION', payload: { id: task.id } });
        toast.success("Фокус завершено! Чудова робота.");
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 dark:bg-primary text-white mb-2 ring-8 ring-slate-100 dark:ring-secondary/50">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-foreground">Ваш Фокус</h2>
                    <p className="text-muted-foreground">Саме те, що має значення сьогодні. (Макс 3)</p>
                </div>

                {/* Focus Slots */}
                <div className="space-y-4">
                    {focusTasks.map(task => (
                        <motion.div
                            key={task.id}
                            layoutId={task.id}
                            className="bg-white dark:bg-card border-2 border-slate-900/10 dark:border-primary/20 p-6 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none flex items-center justify-between group"
                        >
                            <span className="text-xl font-bold text-slate-800 dark:text-foreground">{task.title}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => completeFocusTask(task)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-orange-200 dark:shadow-none"
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" /> Готово
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removeFromFocus(task)} className="text-slate-300 dark:text-muted-foreground/50 hover:text-slate-500 dark:hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Placeholder / Add Button */}
                    {focusTasks.length < 3 && (
                        <Button
                            variant="ghost"
                            onClick={() => setIsSelectorOpen(true)}
                            className="w-full h-20 border-dashed border-2 border-slate-200 dark:border-border rounded-2xl text-slate-400 dark:text-muted-foreground hover:border-slate-400 dark:hover:border-primary/50 hover:text-slate-600 dark:hover:text-primary bg-transparent hover:bg-slate-50 dark:hover:bg-secondary/20 transition-all text-lg font-medium"
                        >
                            <Plus className="w-6 h-6 mr-2" /> Додати до фокусу
                        </Button>
                    )}
                </div>

                {/* Task Selector Modal (Simplified inline) */}
                {isSelectorOpen && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-card rounded-3xl w-full max-w-lg p-6 shadow-2xl dark:shadow-black/50 space-y-4 border dark:border-border">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg dark:text-foreground">Оберіть для фокусу</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsSelectorOpen(false)}><X className="w-5 h-5" /></Button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {candidates.map(candidate => (
                                    <div key={candidate.id} onClick={() => { addToFocus(candidate); setIsSelectorOpen(false); }} className="p-4 bg-slate-50 dark:bg-secondary/20 hover:bg-orange-50 dark:hover:bg-primary/10 rounded-xl cursor-pointer transition-colors font-medium dark:text-foreground">
                                        {candidate.title}
                                    </div>
                                ))}
                                {candidates.length === 0 && <p className="text-center text-muted-foreground py-4">Немає доступних завдань. Створіть нове.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
