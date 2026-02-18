import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, Loader2, Quote, ArrowRight, Brain, Target } from 'lucide-react';
import { useData } from '@/lib/store';
import { toast } from 'sonner';

interface DailyReviewResponse {
    summary: string;
    mood: string;
    focusForTomorrow: string[];
    score: number;
    completedCount: number;
    totalCount: number;
    focusPoints: string[];
}

import { useSubscription } from '@/hooks/useSubscription';
import { ScrollArea } from '@/components/ui/scroll-area';

export function DailyReviewDialog({ customTrigger }: { customTrigger?: React.ReactNode }) {
    const { isPro } = useSubscription() || { isPro: false };
    const { state } = useData();
    const [isOpen, setIsOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [review, setReview] = useState<DailyReviewResponse | null>(null);

    const [step, setStep] = useState<'info' | 'loading' | 'result'>('info');
    const [limits, setLimits] = useState({ count: 0, lastRun: 0 });

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('nexis-ai-daily-usage');
            if (stored) {
                const data = JSON.parse(stored);
                const today = new Date().toDateString();
                if (data.date === today) {
                    setLimits({ count: data.count, lastRun: data.lastRun });
                } else {
                    setLimits({ count: 0, lastRun: 0 });
                }
            }
            setStep('info'); // Reset to info on open
        }
    }, [isOpen]);

    const checkLimits = () => {
        if (limits.count >= 2) return { allowed: false, reason: 'Ви використали ліміт 2 аналізи на день.' };
        const timeSince = Date.now() - limits.lastRun;
        const fourHours = 4 * 60 * 60 * 1000;
        if (limits.lastRun > 0 && timeSince < fourHours) {
            const waitHours = Math.ceil((fourHours - timeSince) / (60 * 60 * 1000));
            return { allowed: false, reason: `Спробуйте пізніше. Наступний аналіз доступний через ${waitHours} год.` };
        }
        return { allowed: true };
    };

    const handleStart = () => {
        const check = checkLimits();
        if (!check.allowed) {
            toast.error(check.reason || "Ліміт вичерпано");
            return;
        }
        generateReview();
    };

    const generateReview = async () => {
        setStep('loading');
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
            setStep('result');

            // Update limits
            const newLimits = {
                date: new Date().toDateString(),
                count: limits.count + 1,
                lastRun: Date.now()
            };
            localStorage.setItem('nexis-ai-daily-usage', JSON.stringify(newLimits));
            setLimits({ count: newLimits.count, lastRun: newLimits.lastRun });

        } catch (error) {
            console.error(error);
            toast.error("Не вдалося згенерувати аналіз");
            setStep('info');
        } finally {
            setIsLoading(false);
        }
    };

    // Note: Removed useEffect that auto-triggered generateReview

    if (!isPro) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {customTrigger ? customTrigger : (
                    <Button
                        variant="outline"
                        className="gap-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Аналіз Дня
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="w-[95%] sm:max-w-md bg-white dark:bg-card border-none shadow-2xl overflow-hidden p-0 gap-0 max-h-[90vh] overflow-y-auto">
                <div className="sr-only">
                    <DialogTitle>AI Аналіз Дня</DialogTitle>
                    <DialogDescription>
                        Ваш персональний коуч з аналізом продуктивності та фокусом на завтра.
                    </DialogDescription>
                </div>

                {step === 'info' && (
                    <div className="p-8 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">AI Аналіз Дня</h3>
                            <p className="text-muted-foreground text-sm">
                                Отримайте персональні рекомендації, аналіз продуктивності та фокусу.
                                AI проаналізує ваші виконані задачі та цілі.
                            </p>
                        </div>

                        <div className="flex justify-center gap-4 text-sm font-medium">
                            <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {2 - limits.count} доступно сьогодні
                            </div>
                            <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Інтервал 4 години
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleStart}
                                size="lg"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20"
                                disabled={limits.count >= 2 || (limits.lastRun > 0 && Date.now() - limits.lastRun < 4 * 60 * 60 * 1000)}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Розпочати Аналіз
                            </Button>
                            {limits.count >= 2 && (
                                <p className="text-xs text-red-500 mt-2 font-medium">Ліміт на сьогодні вичерпано (2/2)</p>
                            )}
                        </div>
                    </div>
                )}

                {step === 'loading' && (
                    <div className="p-12 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">
                            Аналізуємо ваші дані...
                        </p>
                    </div>
                )}

                {step === 'result' && review && (
                    <>
                        {/* Header */}
                        <div className="relative p-6 pb-8 bg-gradient-to-br from-amber-500 to-orange-600 overflow-hidden">
                            {/* ... existing header content ... */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-5 -mb-5 blur-xl"></div>

                            <div className="relative z-10 flex items-start justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-amber-100" />
                                        Аналіз Дня
                                    </h2>
                                    <p className="text-amber-100 text-sm font-medium">
                                        {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                                    <span className="text-xs font-bold text-white">Nexis AI</span>
                                </div>
                            </div>

                            <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                                    <p className="text-amber-100 text-xs font-medium mb-1">Фокус</p>
                                    <p className="text-2xl font-bold text-white">{review.score}/100</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                                    <p className="text-amber-100 text-xs font-medium mb-1">Задач</p>
                                    <p className="text-2xl font-bold text-white">{review.completedCount} <span className="text-sm font-normal opacity-70">/ {review.totalCount}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white dark:bg-card">
                            <ScrollArea className="h-[400px]">
                                <div className="p-6 space-y-6">
                                    {/* Summary */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Brain className="w-4 h-4" />
                                            Висновки
                                        </h3>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-border text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                            {review.summary}
                                        </div>
                                    </div>

                                    {/* Focus Areas */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            На чому зосередитись
                                        </h3>
                                        <div className="space-y-2">
                                            {review.focusPoints.map((point, i) => (
                                                <div key={i} className="flex gap-3 items-start p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{point}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-border bg-slate-50/50 dark:bg-card/50">
                                <Button className="w-full" onClick={() => setIsOpen(false)}>
                                    Чудово, дякую!
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
