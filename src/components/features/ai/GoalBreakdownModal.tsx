'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store';
import { Target, ArrowRight, Sparkles, CheckCircle2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface GoalBreakdownModalProps {
    customTrigger?: React.ReactNode;
}

interface BreakdownProposal {
    metrics: { name: string; target: number; unit: string }[];
    projects: { title: string; tasks: string[] }[];
}

export function GoalBreakdownModal({ customTrigger }: GoalBreakdownModalProps) {
    const { state, dispatch } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'select' | 'analyzing' | 'preview' | 'creating'>('select');
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [proposal, setProposal] = useState<BreakdownProposal | null>(null);

    // Mock AI Generation
    const generateBreakdown = async () => {
        if (!selectedGoalId) return;
        setStep('analyzing');

        // Simulate AI thinking time
        setTimeout(() => {
            const goal = state.goals.find(g => g.id === selectedGoalId);
            if (!goal) return;

            // Mock "Smart" Proposal based on goal title
            // In real app, this would call an API
            setProposal({
                metrics: [
                    { name: 'Прогрес виконання', target: 100, unit: '%' },
                    { name: 'Ключові етапи', target: 5, unit: 'шт' }
                ],
                projects: [
                    {
                        title: `Стратегія для "${goal.title}"`,
                        tasks: ['Дослідити ринок', 'Скласти план дій', 'Визначити ресурси']
                    },
                    {
                        title: `Реалізація: Етап 1`,
                        tasks: ['Запустити MVP', 'Зібрати фідбек']
                    }
                ]
            });
            setStep('preview');
        }, 2000);
    };

    const handleCreate = async () => {
        if (!proposal || !selectedGoalId) return;
        setStep('creating');

        try {
            // Simulate creation delay
            await new Promise(r => setTimeout(r, 1500));

            // Create projects and tasks (Mock dispatch/action)
            // In real app, dispatch 'ADD_PROJECT', 'ADD_TASK' actions
            // For now, we just show success toast

            toast.success("Ціль успішно декомпозовано!");
            setIsOpen(false);
            setStep('select');
            setSelectedGoalId(null);
            setProposal(null);
        } catch (error) {
            toast.error("Помилка при створенні");
            setStep('preview');
        }
    };

    const activeGoals = state.goals.filter(g => g.status === 'active');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {customTrigger ? customTrigger : (
                    <Button variant="outline" className="gap-2">
                        <Target className="w-4 h-4" />
                        AI Розбиття Цілей
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        AI Розбиття Цілей
                    </DialogTitle>
                    <DialogDescription>
                        Обери ціль, а штучний інтелект розіб'є її на проекти, задачі та метрики.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'select' && (
                        <div className="space-y-4">
                            <Label>Оберіть активну ціль:</Label>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-2">
                                    {activeGoals.map(goal => (
                                        <div
                                            key={goal.id}
                                            onClick={() => setSelectedGoalId(goal.id)}
                                            className={cn(
                                                "p-3 rounded-xl border border-border cursor-pointer transition-all hover:bg-accent",
                                                selectedGoalId === goal.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                            )}
                                        >
                                            <div className="font-medium">{goal.title}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{goal.areaId || 'Загальне'}</div>
                                        </div>
                                    ))}
                                    {activeGoals.length === 0 && (
                                        <div className="text-center text-muted-foreground py-10">
                                            Немає активних цілей. Створіть спочатку ціль.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {step === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
                                <Sparkles className="w-12 h-12 text-amber-500 animate-spin-slow" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">Аналізуємо ціль...</h3>
                                <p className="text-sm text-muted-foreground">Формуємо стратегію та план дій</p>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && proposal && (
                        <div className="space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50 text-sm text-amber-800 dark:text-amber-300 flex gap-2">
                                <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Я пропоную розбити цю ціль на {proposal.projects.length} проекти та додати метрики успіху. Перевірте та відредагуйте за потреби.</p>
                            </div>

                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Проекти та Задачі</h4>
                                        {proposal.projects.map((proj, idx) => (
                                            <div key={idx} className="border border-border p-4 rounded-xl space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <Input defaultValue={proj.title} className="font-medium h-8" />
                                                </div>
                                                <div className="pl-4 space-y-2">
                                                    {proj.tasks.map((task, tIdx) => (
                                                        <div key={tIdx} className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-sm bg-slate-300" />
                                                            <Input defaultValue={task} className="text-sm h-7" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Метрики</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {proposal.metrics.map((metric, mIdx) => (
                                                <div key={mIdx} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-border">
                                                    <div className="text-xs text-muted-foreground mb-1">Метрика</div>
                                                    <div className="font-medium text-sm">{metric.name}</div>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <span className="text-lg font-bold">{metric.target}</span>
                                                        <span className="text-xs text-muted-foreground">{metric.unit}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {step === 'creating' && (
                        <div className="flex flex-col items-center justify-center h-[300px] space-y-6">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>Створення об'єктів...</span>
                                    <span>85%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-progress w-[85%]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === 'select' && (
                        <Button onClick={generateBreakdown} disabled={!selectedGoalId} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Згенерувати План
                        </Button>
                    )}
                    {step === 'preview' && (
                        <>
                            <Button variant="ghost" onClick={() => setStep('select')}>Назад</Button>
                            <Button onClick={handleCreate} className="bg-primary">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Затвердити та Створити
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
