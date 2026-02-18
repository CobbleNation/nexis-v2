'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store';
import { Target, ArrowRight, Sparkles, CheckCircle2, Loader2, X, BrainCircuit, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface GoalBreakdownModalProps {
    customTrigger?: React.ReactNode;
}

interface StrategyProposal {
    status: 'on_track' | 'needs_attention' | 'new';
    recommendation: string;
    newTasks: string[];
    focusArea: string;
}

export function GoalBreakdownModal({ customTrigger }: GoalBreakdownModalProps) {
    const { state, dispatch } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'select' | 'analyzing' | 'result' | 'creating'>('select');
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [proposal, setProposal] = useState<StrategyProposal | null>(null);

    // ... (rest of state)

    const generateStrategy = async () => {
        if (!selectedGoalId) return;
        setStep('analyzing');

        // Simulate AI thinking time
        setTimeout(() => {
            const goal = state.goals.find(g => g.id === selectedGoalId);
            if (!goal) return;

            // Simple context-aware logic
            const progress = goal.progress;
            // Simulated "recent activity" check (random for demo)
            const hasRecentActivity = Math.random() > 0.5;

            let status: 'on_track' | 'needs_attention' | 'new' = 'new';
            let recommendation = '';
            let focusArea = '';
            let newTasks: string[] = [];

            if (progress > 60) {
                status = 'on_track';
                recommendation = 'Чудова динаміка! Виконали більшу частину. Зараз важливо не втрачати темп. Рекомендую зосередитись на фіналізації та перевірці результатів.';
                focusArea = 'Фіналізація та Якість';
                newTasks = ['Перевірити відповідність результатів', 'Підготувати звіт', 'Запланувати ретроспективу'];
            } else if (progress < 20 && !hasRecentActivity) {
                status = 'needs_attention';
                recommendation = 'Прогрес повільний. Схоже, ціль занадто велика. Давайте розіб\'ємо її на менші спринти.';
                focusArea = 'Декомпозиція та Спрощення';
                newTasks = ['Розділити на 3 під-етапи', 'Виділити 15 хв на старт', 'Знайти блокери'];
            } else {
                status = 'new';
                recommendation = 'Бачу ціль, але мало активності. Давайте створимо початковий імпульс.';
                focusArea = 'Швидкий Старт';
                newTasks = ['Визначити перший крок', 'Зробити чернетку', 'Знайти референси'];
            }

            setProposal({
                status,
                recommendation,
                newTasks,
                focusArea
            });
            setStep('result');
        }, 2000);
    };

    const handleApply = async () => {
        if (!proposal || !selectedGoalId) return;
        setStep('creating');

        try {
            // Simulate creation delay
            await new Promise(r => setTimeout(r, 1500));

            // Create projects and tasks (Mock dispatch/action)
            // In real app, dispatch 'ADD_PROJECT', 'ADD_TASK' actions

            toast.success("Стратегію успішно застосовано!");
            setIsOpen(false);
            setStep('select');
            setSelectedGoalId(null);
            setProposal(null);
        } catch (error) {
            toast.error("Помилка при збереженні");
            setStep('result');
        }
    };

    const activeGoals = state.goals.filter(g => g.status === 'active');

    // Group goals by area
    const goalsByArea = activeGoals.reduce((acc, goal) => {
        const areaId = goal.areaId || 'unassigned';
        if (!acc[areaId]) acc[areaId] = [];
        acc[areaId].push(goal);
        return acc;
    }, {} as Record<string, typeof activeGoals>);

    const getAreaName = (areaId: string) => {
        if (areaId === 'unassigned') return 'Загальне';
        return state.areas.find(a => a.id === areaId)?.title || 'Невідома Сфера';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {customTrigger ? customTrigger : (
                    <Button variant="outline" className="gap-2">
                        <Target className="w-4 h-4" />
                        AI Стратегія
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-card">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BrainCircuit className="w-5 h-5 text-violet-500" />
                        AI Стратегія Цілі
                    </DialogTitle>
                    <DialogDescription>
                        Оберіть ціль для отримання персональної стратегії та аналізу прогресу.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'select' && (
                        <div className="space-y-4">
                            <Label>Оберіть ціль для аналізу:</Label>
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-6">
                                    {Object.entries(goalsByArea).map(([areaId, goals]) => (
                                        <div key={areaId} className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                                                {getAreaName(areaId)}
                                            </h4>
                                            {goals.map(goal => (
                                                <div
                                                    key={goal.id}
                                                    onClick={() => setSelectedGoalId(goal.id)}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50",
                                                        selectedGoalId === goal.id ? "border-violet-500 bg-violet-50 dark:bg-violet-900/10 ring-1 ring-violet-500" : ""
                                                    )}
                                                >
                                                    <div>
                                                        <div className="font-medium">{goal.title}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-violet-500 transition-all" style={{ width: `${goal.progress}%` }} />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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
                                <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
                                <BrainCircuit className="w-12 h-12 text-violet-500 animate-pulse" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">Аналізуємо контекст...</h3>
                                <p className="text-sm text-muted-foreground">Перевіряємо прогрес, задачі та метрики</p>
                            </div>
                        </div>
                    )}

                    {step === 'result' && proposal && (
                        <div className="space-y-6">
                            {/* Status Card */}
                            <div className={cn(
                                "p-4 rounded-xl border flex items-start gap-4",
                                proposal.status === 'on_track' ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900" :
                                    proposal.status === 'needs_attention' ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900" :
                                        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                            )}>
                                <div className={cn(
                                    "p-2 rounded-full shrink-0",
                                    proposal.status === 'on_track' ? "bg-green-100 text-green-600" :
                                        proposal.status === 'needs_attention' ? "bg-red-100 text-red-600" :
                                            "bg-blue-100 text-blue-600"
                                )}>
                                    {proposal.status === 'on_track' ? <TrendingUp className="w-5 h-5" /> :
                                        proposal.status === 'needs_attention' ? <AlertCircle className="w-5 h-5" /> :
                                            <Sparkles className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm uppercase tracking-wider opacity-80 mb-1">
                                        {proposal.status === 'on_track' ? 'Чудова Динаміка' :
                                            proposal.status === 'needs_attention' ? 'Потрібна Увага' :
                                                'Нова Стратегія'}
                                    </h4>
                                    <p className="text-sm leading-relaxed opacity-90">{proposal.recommendation}</p>
                                </div>
                            </div>

                            {/* Action Plan */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Target className="w-4 h-4 text-violet-500" />
                                    Рекомендовані дії: {proposal.focusArea}
                                </h4>
                                <div className="space-y-2">
                                    {proposal.newTasks.map((task, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-border rounded-lg">
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                            <span className="text-sm">{task}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === 'select' && (
                        <Button onClick={generateStrategy} disabled={!selectedGoalId} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Отримати Стратегію
                        </Button>
                    )}
                    {step === 'result' && (
                        <>
                            <Button variant="ghost" onClick={() => setStep('select')}>Назад</Button>
                            <Button onClick={handleApply} className="bg-primary">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Затвердити План
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
