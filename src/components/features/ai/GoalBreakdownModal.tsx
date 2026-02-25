'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store';
import { Target, ArrowRight, Sparkles, CheckCircle2, Loader2, X, BrainCircuit, Activity, TrendingUp, AlertCircle, Search, Layout, ListTodo, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { Action } from '@/types';

interface GoalBreakdownModalProps {
    customTrigger?: React.ReactNode;
}

interface StrategyProposal {
    status: 'on_track' | 'needs_attention' | 'new';
    recommendation: string;
    newTasks: string[];
    focusArea: string;
    // Suggested Tool Connections
    suggestedMetric?: string;
    suggestedAction?: string;
}

export function GoalBreakdownModal({ customTrigger }: GoalBreakdownModalProps) {
    const { state, dispatch } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'select' | 'analyzing' | 'result' | 'creating'>('select');
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [proposal, setProposal] = useState<StrategyProposal | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const activeGoals = state.goals.filter(g => g.status === 'active' || g.status === 'paused');

    // Filtered Goals
    const filteredGoals = useMemo(() => {
        if (!searchQuery) return activeGoals;
        return activeGoals.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [activeGoals, searchQuery]);

    // Group goals by area
    const goalsByArea = useMemo(() => {
        return filteredGoals.reduce((acc, goal) => {
            const areaId = goal.areaId || 'unassigned';
            if (!acc[areaId]) acc[areaId] = [];
            acc[areaId].push(goal);
            return acc;
        }, {} as Record<string, typeof activeGoals>);
    }, [filteredGoals]);

    const getAreaInfo = (areaId: string) => {
        if (areaId === 'unassigned') return { title: 'Загальне', color: 'bg-slate-500' };
        const area = state.areas.find(a => a.id === areaId);
        return {
            title: area?.title || 'Невідома Сфера',
            color: area?.color || 'bg-slate-500'
        };
    };

    // Get Context Data for Selected Goal
    const selectedGoal = state.goals.find(g => g.id === selectedGoalId);
    const linkedTasks = selectedGoalId ? state.actions.filter(a => a.linkedGoalId === selectedGoalId && !a.completed) : [];
    const linkedProjects = selectedGoalId ? state.projects.filter(p => p.goalIds?.includes(selectedGoalId)) : [];
    const targetMetric = selectedGoal?.targetMetricId ? state.metricDefinitions.find(m => m.id === selectedGoal.targetMetricId) : null;

    const generateStrategy = async () => {
        if (!selectedGoalId || !selectedGoal) return;
        setStep('analyzing');

        // Simulate AI thinking time
        setTimeout(() => {
            const progress = selectedGoal.progress;

            // Context Check: Truly check for linked items
            const hasLinkedTasks = linkedTasks.length > 0;
            const hasMetric = selectedGoal.targetMetricId;

            let status: 'on_track' | 'needs_attention' | 'new' = 'new';
            let recommendation = '';
            let focusArea = '';
            let newTasks: string[] = [];

            // Helper for Keyword Matching
            const getSuggestions = (title: string, type: string) => {
                const t = title.toLowerCase();
                if (t.includes('ваг') || t.includes('схуд') || t.includes('тіл')) return ['Скласти план харчування', 'Записатися в зал / знайти тренера', 'Купити ваги для продуктів'];
                if (t.includes('англій') || t.includes('мов')) return ['Знайти викладача / курси', 'Встановити Duolingo', 'Дивитися 1 відео в день англійською'];
                if (t.includes('грош') || t.includes('фінанс') || t.includes('дохід')) return ['Проаналізувати витрати за місяць', 'Відкласти 10% від доходу', 'Знайти додаткове джерело доходу'];
                if (t.includes('сайт') || t.includes('проєкт') || t.includes('код')) return ['Створити структуру проєкту', 'Вибрати технологічний стек', 'Зробити MVP'];
                if (t.includes('чита') || t.includes('книг')) return ['Обрати першу книгу', 'Виділити 20 хв ввечері на читання', 'Купити електронну книгу'];

                // Fallback based on type
                if (type === 'strategic') return ['Визначити ключові метрики', 'Розбити на місячні етапи', 'Знайти ментора'];
                return ['Визначити перший крок', 'Зробити чернетку', 'Знайти референси'];
            };

            if (progress > 60) {
                status = 'on_track';
                recommendation = 'Чудова динаміка! Виконали більшу частину. Зараз важливо не втрачати темп. Рекомендую зосередитись на фіналізації та перевірці результатів.';
                focusArea = 'Фіналізація та Якість';
                newTasks = ['Перевірити відповідність результатів', 'Підготувати звіт', 'Запланувати ретроспективу'];
            } else if ((progress < 20 && !hasLinkedTasks) || selectedGoal.status === 'paused') {
                status = 'needs_attention';
                recommendation = 'Ціль виглядає заблокованою. Немає активних задач або прогресу. Схоже, потрібна декомпозиція на менші кроки або конкретний план дій.';
                focusArea = 'Декомпозиція та Спрощення';
                newTasks = getSuggestions(selectedGoal.title, selectedGoal.type);
            } else if (progress < 20 && hasLinkedTasks) {
                status = 'on_track'; // Has tasks, just started
                recommendation = 'Ви на початку шляху, але план дій вже є. Продовжуйте виконувати заплановані задачі.';
                focusArea = 'Виконання та Дисципліна';
                newTasks = ['Виконати найпріоритетнішу задачу', 'Переглянути дедлайни', 'Зробити чек-ін прогресу'];
            } else {
                // Mid progress
                status = 'on_track';
                recommendation = 'Прогрес є, рухаємось стабільно. Варто переглянути, чи можна оптимізувати процеси для пришвидшення.';
                focusArea = 'Оптимізація';
                newTasks = ['Проаналізувати, що забирає час', 'Делегувати рутину', 'Збільшити інтенсивність'];
            }

            setProposal({
                status,
                recommendation,
                focusArea,
                newTasks,
                suggestedMetric: (!hasMetric && selectedGoal.type === 'strategic') ? 'Додати метрику прогресу' : undefined
            });
            setStep('result');
        }, 1500);
    };

    const handleApply = async () => {
        if (!proposal || !selectedGoalId || !selectedGoal) return;
        setStep('creating');

        try {
            await new Promise(r => setTimeout(r, 1000));
            // Create actions for each suggested task
            proposal.newTasks.forEach((taskTitle, index) => {
                const newAction: Action = {
                    id: uuidv4(),
                    userId: 'user', // Default
                    title: taskTitle,
                    description: `Generated by AI Strategy for goal: ${selectedGoal.title}`,
                    type: 'task',
                    status: 'pending',
                    completed: false,
                    priority: 'medium',
                    // Schedule for today/tomorrow
                    date: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    // CRITICAL: Link to Goal and Area
                    linkedGoalId: selectedGoalId,
                    areaId: selectedGoal.areaId,
                    duration: 15,
                    isFocus: index === 0 // Make the first one a focus item
                };
                dispatch({ type: 'ADD_ACTION', payload: newAction });
            });

            toast.success(`Стратегію застосовано! Додано ${proposal.newTasks.length} нових дій.`);
            setIsOpen(false);
            setStep('select');
            setSelectedGoalId(null);
            setProposal(null);
            setSearchQuery('');
        } catch (error) {
            toast.error("Помилка при збереженні");
            setStep('result');
        }
    };

    const contextContent = selectedGoal ? (
        <>
            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Контекст Цілі</h4>
                <h2 className="text-2xl font-bold leading-tight">{selectedGoal.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={cn("bg-white dark:bg-slate-800", getAreaInfo(selectedGoal.areaId).color, "bg-opacity-10 text-foreground border-none")}>
                        {getAreaInfo(selectedGoal.areaId).title}
                    </Badge>
                    <Badge variant="secondary">{selectedGoal.type}</Badge>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-card rounded-xl border shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                        <span className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-500" />
                            Основна Метрика
                        </span>
                    </div>
                    {targetMetric ? (
                        <div className="space-y-1">
                            <div className="text-2xl font-bold tabular-nums">
                                {selectedGoal.metricCurrentValue || selectedGoal.metricStartValue || 0}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                    / {selectedGoal.metricTargetValue} {targetMetric.unit}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500" style={{ width: `${selectedGoal.progress}%` }} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic">Метрика не прив'язана</div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white dark:bg-card rounded-xl border shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Задачі</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-bold">{linkedTasks.length}</span>
                            <span className="text-xs text-muted-foreground">активних</span>
                        </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-card rounded-xl border shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Проєкти</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-bold">{linkedProjects.length}</span>
                            <span className="text-xs text-muted-foreground">пов'язаних</span>
                        </div>
                    </div>
                </div>

                {linkedTasks.length > 0 && (
                    <div className="pt-2">
                        <h5 className="text-xs font-semibold mb-2 text-muted-foreground">Активні Задачі:</h5>
                        <div className="space-y-2">
                            {linkedTasks.slice(0, 3).map(task => (
                                <div key={task.id} className="flex items-center gap-2 text-sm p-2 bg-white dark:bg-card rounded-lg border  border-l-4 border-l-violet-500">
                                    <span className="truncate">{task.title}</span>
                                </div>
                            ))}
                            {linkedTasks.length > 3 && (
                                <div className="text-xs text-center text-muted-foreground">
                                    + ще {linkedTasks.length - 3} задач
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    ) : null;

    const strategyContent = proposal ? (
        <>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Рекомендація AI</h4>

            {/* Status Card */}
            <div className={cn(
                "p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm",
                proposal.status === 'on_track' ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800" :
                    proposal.status === 'needs_attention' ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" :
                        "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
            )}>
                <div className={cn(
                    "p-2.5 rounded-xl shrink-0 shadow-sm",
                    proposal.status === 'on_track' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                        proposal.status === 'needs_attention' ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
                            "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                )}>
                    {proposal.status === 'on_track' ? <TrendingUp className="w-6 h-6" /> :
                        proposal.status === 'needs_attention' ? <AlertCircle className="w-6 h-6" /> :
                            <Sparkles className="w-6 h-6" />}
                </div>
                <div>
                    <h4 className="font-bold text-base mb-1">
                        {proposal.status === 'on_track' ? 'Впевнений Прогрес' :
                            proposal.status === 'needs_attention' ? 'Потрібно Втручання' :
                                'Старт Стратегії'}
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">{proposal.recommendation}</p>
                </div>
            </div>

            {/* Smart Actions */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-500" />
                    <h4 className="font-semibold text-sm">Наступні Кроки</h4>
                    <Badge variant="outline" className="ml-auto text-xs font-normal">
                        {proposal.focusArea}
                    </Badge>
                </div>

                <div className="grid gap-3">
                    {proposal.newTasks.map((task, idx) => (
                        <div key={idx} className="group flex items-center gap-3 p-3.5 bg-white dark:bg-card border hover:border-violet-300 dark:hover:border-violet-700 rounded-xl transition-all shadow-sm">
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-700 group-hover:border-violet-500 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-violet-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-sm font-medium">{task}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Missing Tools Suggestions */}
            {!targetMetric && (
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900 text-sm flex gap-3 items-start">
                    <Activity className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <div className="text-orange-900 dark:text-orange-200">
                        <span className="font-semibold block mb-0.5">Додайте Метрику</span>
                        Цю ціль важко виміряти. Рекомендую додати числову метрику для відстеження прогресу.
                    </div>
                </div>
            )}
        </>
    ) : null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {customTrigger ? customTrigger : (
                    <Button variant="outline" className="gap-2">
                        <BrainCircuit className="w-4 h-4 text-violet-500" />
                        AI Стратегія
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className={cn(
                "bg-white dark:bg-card transition-all duration-300",
                step === 'result' ? "sm:max-w-[800px]" : "sm:max-w-[600px]"
            )}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BrainCircuit className="w-6 h-6 text-violet-500" />
                        AI Стратегія V2
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'select' ? "Оберіть ціль для глибокого аналізу та побудови стратегії." :
                            step === 'analyzing' ? "Штучний інтелект аналізує контекст..." :
                                "Персональна стратегія досягнення цілі."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'select' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Пошук цілі..."
                                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-8">
                                    {Object.entries(goalsByArea).map(([areaId, goals]) => {
                                        const areaInfo = getAreaInfo(areaId);
                                        return (
                                            <div key={areaId} className="space-y-3">
                                                <div className="flex items-center gap-2 px-1">
                                                    <div className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-card", areaInfo.color)} />
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {areaInfo.title}
                                                    </h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {goals.map(goal => (
                                                        <div
                                                            key={goal.id}
                                                            onClick={() => setSelectedGoalId(goal.id)}
                                                            className={cn(
                                                                "group flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200",
                                                                selectedGoalId === goal.id
                                                                    ? "border-violet-500 bg-violet-50/50 dark:bg-violet-900/10 shadow-sm"
                                                                    : "border-transparent bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            )}
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="font-semibold text-base text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                                    {goal.title}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                    <span>{goal.type === 'strategic' ? 'Стратегічна' : 'Тактична'}</span>
                                                                    <span>•</span>
                                                                    <span>Прогрес: {goal.progress}%</span>
                                                                </div>
                                                            </div>
                                                            {selectedGoalId === goal.id && (
                                                                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white shadow-sm animate-in fade-in zoom-in">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredGoals.length === 0 && (
                                        <div className="text-center text-muted-foreground py-20">
                                            Цілей не знайдено.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {step === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full animate-pulse" />
                                <BrainCircuit className="w-16 h-16 text-violet-500 animate-pulse relative z-10" />
                            </div>
                            <div className="text-center space-y-2 max-w-xs mx-auto">
                                <h3 className="font-semibold text-xl">Аналізуємо дані...</h3>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <p className="animate-fade-in">Перевірка метрик</p>
                                    <p className="animate-fade-in delay-75">Аналіз зв'язаних задач</p>
                                    <p className="animate-fade-in delay-150">Генерація стратегії</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && proposal && selectedGoal && (
                        <>
                            {/* Desktop Layout */}
                            <div className="hidden md:grid md:grid-cols-2 gap-6 h-[500px] pr-2 md:pr-0">
                                <div className="space-y-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-border overflow-y-auto">
                                    {contextContent}
                                </div>
                                <div className="space-y-6 overflow-y-auto pr-2 pb-6">
                                    {strategyContent}
                                </div>
                            </div>

                            {/* Mobile Layout */}
                            <div className="md:hidden">
                                <Tabs defaultValue="strategy" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4">
                                        <TabsTrigger value="strategy">Стратегія</TabsTrigger>
                                        <TabsTrigger value="context">Контекст</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="strategy" className="mt-0 space-y-6 overflow-y-auto max-h-[60vh] pb-6 pr-1">
                                        {strategyContent}
                                    </TabsContent>
                                    <TabsContent value="context" className="mt-0 space-y-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-100 dark:border-border overflow-y-auto max-h-[60vh]">
                                        {contextContent}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
                    {step === 'select' && (
                        <div className="flex flex-col-reverse sm:flex-row w-full justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsOpen(false)} className="w-full sm:w-auto mt-2 sm:mt-0">Скасувати</Button>
                            <Button onClick={generateStrategy} disabled={!selectedGoalId} size="lg" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Отримати Стратегію
                            </Button>
                        </div>
                    )}
                    {step === 'result' && (
                        <>
                            <Button variant="ghost" onClick={() => setStep('select')}>Назад</Button>
                            <Button onClick={handleApply} size="lg" className="bg-foreground text-background hover:opacity-90">
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
