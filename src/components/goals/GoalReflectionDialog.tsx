'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Goal } from '@/types';
import { Star, Trophy, ArrowRight, Loader2, Target, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GoalReflectionDialogProps {
    goal: Goal;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reflection: string, rating: number, status: Goal['status']) => Promise<void>;
}

export function GoalReflectionDialog({ goal, isOpen, onClose, onConfirm }: GoalReflectionDialogProps) {
    const [reflection, setReflection] = useState('');
    const [rating, setRating] = useState(0);
    const [outcome, setOutcome] = useState<Goal['status']>('achieved');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reflection.trim()) {
            toast.error("Будь ласка, напишіть короткий висновок.");
            return;
        }
        if (rating === 0) {
            toast.error("Оцініть свій шлях до цілі.");
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm(reflection, rating, outcome);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Щось пішло не так...");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-card border-none shadow-2xl rounded-2xl overflow-hidden p-0">
                <DialogTitle className="sr-only">Рефлексія цілі: {goal.title}</DialogTitle>
                <div className={cn(
                    "p-8 text-center border-b transition-colors duration-300",
                    outcome === 'achieved' ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50" :
                        outcome === 'not_achieved' ? "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50" :
                            "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50"
                )}>
                    <div className={cn(
                        "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm transition-colors duration-300",
                        outcome === 'achieved' ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" :
                            outcome === 'not_achieved' ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400" :
                                "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                    )}>
                        {outcome === 'achieved' ? <Trophy className="w-8 h-8" /> :
                            outcome === 'not_achieved' ? <Target className="w-8 h-8" /> :
                                <Minus className="w-8 h-8" />}
                    </div>
                    <h2 className={cn(
                        "text-2xl font-bold mb-2 transition-colors",
                        outcome === 'achieved' ? "text-emerald-800 dark:text-emerald-400" :
                            outcome === 'not_achieved' ? "text-amber-800 dark:text-amber-400" :
                                "text-red-800 dark:text-red-400"
                    )}>{
                            outcome === 'achieved' ? "Ціль Досягнуто!" :
                                outcome === 'not_achieved' ? "Неповний Результат" :
                                    "Ціль Зупинено"
                        }</h2>
                    <p className={cn(
                        "text-sm transition-colors",
                        outcome === 'achieved' ? "text-emerald-600 dark:text-emerald-500/80" :
                            outcome === 'not_achieved' ? "text-amber-600 dark:text-amber-500/80" :
                                "text-red-600 dark:text-red-500/80"
                    )}>
                        {outcome === 'achieved' ? "Вітаємо! Ви досягли бажаного результату." :
                            outcome === 'not_achieved' ? "Ви доклали зусиль, але мету не досягнуто повністю." :
                                "Ви вирішили припинити роботу над цією ціллю."}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Який результат?</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setOutcome('achieved')}
                                className={cn(
                                    "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                    outcome === 'achieved'
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/50"
                                )}
                            >
                                <div className={cn("p-2 rounded-full", outcome === 'achieved' ? "bg-emerald-200 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold">Досягнуто</span>
                            </button>

                            <button
                                onClick={() => setOutcome('not_achieved')}
                                className={cn(
                                    "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                    outcome === 'not_achieved'
                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                        : "border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/50"
                                )}
                            >
                                <div className={cn("p-2 rounded-full", outcome === 'not_achieved' ? "bg-amber-200 text-amber-700" : "bg-slate-100 text-slate-400")}>
                                    <Target className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold">Не повністю</span>
                            </button>

                            <button
                                onClick={() => setOutcome('abandoned')}
                                className={cn(
                                    "p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                    outcome === 'abandoned'
                                        ? "border-red-500 bg-red-50 text-red-700"
                                        : "border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50"
                                )}
                            >
                                <div className={cn("p-2 rounded-full", outcome === 'abandoned' ? "bg-red-200 text-red-700" : "bg-slate-100 text-slate-400")}>
                                    <Minus className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold">Зупинено</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Як це було? (Рефлексія)</Label>
                        <Textarea
                            value={reflection}
                            onChange={(e) => setReflection(e.target.value)}
                            placeholder="Що допомогло? Що заважало? Які уроки винесено?"
                            className="min-h-[100px] bg-slate-50 dark:bg-secondary/20 border-slate-200 dark:border-border focus:ring-emerald-500/20 text-base"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Оцінка шляху</Label>
                        <div className="flex gap-2 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8 transition-colors",
                                            star <= rating
                                                ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                                                : "text-slate-200 dark:text-slate-700"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={cn(
                            "w-full h-12 text-base font-bold text-white shadow-lg transition-colors",
                            outcome === 'achieved' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" :
                                outcome === 'not_achieved' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" :
                                    outcome === 'abandoned' ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" :
                                        "bg-slate-900 dark:bg-primary"
                        )}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Зафіксувати та Завершити <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
