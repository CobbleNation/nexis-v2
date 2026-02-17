import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Quote, ArrowRight, BrainCircuit } from 'lucide-react';
import { useData } from '@/lib/store';
import { toast } from 'sonner';

interface DailyReviewResponse {
    summary: string;
    mood: string;
    focusForTomorrow: string[];
}

import { useSubscription } from '@/hooks/useSubscription';

export function DailyReviewDialog() {
    const { isPro } = useSubscription() || { isPro: false };
    const { state } = useData();
    const [isOpen, setIsOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [review, setReview] = useState<DailyReviewResponse | null>(null);

    const generateReview = async () => {
        setIsLoading(true);
        try {
            // Fix: Use local date to match TasksView and QuickAddModal
            const d = new Date();
            const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            // Fix: Check boolean 'completed' instead of 'status' string
            const completedTasks = state.actions.filter(a => a.completed && a.date === todayStr);
            const pendingTasks = state.actions.filter(a => !a.completed && a.date === todayStr);
            const activeGoals = state.goals.filter(g => g.status === 'active');

            const response = await fetch('/api/ai/daily-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    completedTasks,
                    pendingTasks,
                    goals: activeGoals.map(g => ({ title: g.title, progress: g.progress }))
                })
            });

            if (!response.ok) throw new Error("Failed to generate review");

            const data = await response.json();
            setReview(data);

        } catch (error) {
            console.error(error);
            toast.error("Не вдалося згенерувати аналіз");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !review && !isLoading) {
            generateReview();
        }
    }, [isOpen]);

    if (!isPro) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="gap-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                >
                    <Sparkles className="w-4 h-4" />
                    AI Аналіз Дня
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-md bg-white dark:bg-card border-none shadow-2xl overflow-hidden p-0 gap-0 max-h-[90vh] overflow-y-auto">
                <div className="sr-only">
                    <DialogTitle>AI Аналіз Дня</DialogTitle>
                    <DialogDescription>
                        Ваш персональний коуч з аналізом продуктивності та фокусом на завтра.
                    </DialogDescription>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white text-center relative overflow-hidden">
                    <BrainCircuit className="w-20 h-20 text-white/10 absolute -top-4 -right-4" />
                    <Sparkles className="w-10 h-10 mx-auto mb-3 text-amber-100 animate-pulse-slow" />
                    <h2 className="text-xl font-bold">Ваш Персональний Коуч</h2>
                    <p className="text-amber-100 text-sm mt-1">Аналіз продуктивності та фокус на завтра</p>
                </div>

                <div className="p-6 min-h-[300px] flex flex-col justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-muted-foreground animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                            <p className="text-sm">Аналізую ваш день...</p>
                        </div>
                    ) : review ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="relative pl-6 border-l-2 border-amber-200 dark:border-amber-800">
                                <Quote className="w-4 h-4 text-amber-300 absolute -top-1 -left-2.5 bg-white dark:bg-card" />
                                <p className="text-slate-700 dark:text-foreground italic leading-relaxed">
                                    {review.summary}
                                </p>
                            </div>

                            {review.focusForTomorrow?.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground">Фокус на завтра</h4>
                                    <div className="space-y-2">
                                        {review.focusForTomorrow.map((focus, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-secondary/20 border border-slate-100 dark:border-border">
                                                <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <span className="text-sm font-medium text-slate-800 dark:text-foreground">{focus}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button onClick={() => setIsOpen(false)} className="w-full bg-slate-900 dark:bg-primary text-white hover:opacity-90">
                                Зрозуміло, дякую <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center text-red-500">
                            Не вдалося отримати дані. Спробуйте пізніше.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
