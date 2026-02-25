'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/lib/store';
import { Loader2, Target, Compass, Flag, ChevronRight, ChevronLeft, ArrowUpRight, Plus, X, Info, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Goal } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { GOAL_TEMPLATES, getSuggestedMetrics } from '@/lib/goal-templates';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, addMonths, addYears, parseISO, isValid, format } from 'date-fns';
import { MetricSuggestionResponse } from '@/lib/ai/types';
import { MetricCreationWizard } from '@/components/metrics/MetricCreationWizard';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/common/UpgradeModal';

interface GoalCreationWizardProps {
    initialTitle?: string;
    initialAreaId?: string;
    initialData?: Goal;
    onComplete: () => void;
    onCancel: () => void;
}

export function GoalCreationWizard({ initialTitle, initialAreaId, initialData, onComplete, onCancel }: GoalCreationWizardProps) {
    const { state, dispatch } = useData();
    const { nextStep, currentStep, isActive: isOnboardingActive } = useOnboarding();

    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    const { HAS_FULL_AI } = useSubscription()?.limits || { HAS_FULL_AI: false };
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [upgradeContext, setUpgradeContext] = useState({ title: '', description: '' });



    // Helper to advance onboarding if active and on correct step
    const checkAndAdvance = (expectedStep: string) => {
        if (isOnboardingActive && currentStep === expectedStep) {
            // Small delay to allow UI update before moving spotlight
            setTimeout(() => nextStep(), 150);
        }
    };

    // ... handlers ...

    // In JSX:
    // Goal Type Cards
    // onClick={() => { setGoalType('vision'); checkAndAdvance('create-goal-type'); }}

    // Area Select
    // onValueChange={(val) => { setAreaId(val); checkAndAdvance('create-goal-area'); }}

    // Template Select
    // onValueChange={(val) => { setTemplateId(val); checkAndAdvance('create-goal-template'); }}

    // Metric Select
    // onValueChange={(val) => { setTargetMetricId(val); ... checkAndAdvance('create-goal-metric-select'); }}

    // Metric Direction
    // onClick={() => { setMetricDirection('increase'); checkAndAdvance('create-goal-metric-direction'); }}

    // Form State
    const [goalType, setGoalType] = useState<Goal['type']>(initialData?.type || 'strategic');
    const [areaId, setAreaId] = useState<string>(initialData?.areaId || activeAreaId(state.selectedAreaId));
    const [templateId, setTemplateId] = useState<string>(initialData ? 'custom' : '');
    const [customTitle, setCustomTitle] = useState(initialData?.title || initialTitle || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [priority] = useState<'low' | 'medium' | 'high'>(initialData?.priority || 'medium');

    // Metric State
    const [targetMetricId, setTargetMetricId] = useState<string>(initialData?.targetMetricId || '');
    const [additionalMetricIds, setAdditionalMetricIds] = useState<string[]>(initialData?.additionalMetricIds || []);

    // Custom Metric Creation
    const [metricStartValue, setMetricStartValue] = useState<string>(initialData?.metricStartValue?.toString() || '');
    const [metricTargetValue, setMetricTargetValue] = useState<string>(initialData?.metricTargetValue?.toString() || '');
    // const [newMetricName, setNewMetricName] = useState(''); // Removed in favor of Wizard
    // const [isCreatingNewMetric, setIsCreatingNewMetric] = useState(false); // Removed
    const [isMetricWizardOpen, setIsMetricWizardOpen] = useState(false);

    // AI Metric Suggestions
    const [isSuggestingMetrics, setIsSuggestingMetrics] = useState(false);
    const [aiSuggestedMetrics, setAiSuggestedMetrics] = useState<MetricSuggestionResponse['metrics']>([]);

    // Pre-filled state for wizard from AI
    const [wizardInitialState, setWizardInitialState] = useState<{
        title?: string,
        unit?: string,
        target?: number,
        direction?: 'increase' | 'decrease' | 'neutral'
    }>({});

    const [metricDirection, setMetricDirection] = useState<'increase' | 'decrease' | 'maintain'>(initialData?.metricDirection || 'increase');

    const [deadline, setDeadline] = useState(initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '');
    const [dateError, setDateError] = useState<string | null>(null);

    // Helper to resolve initial Area ID safely
    function activeAreaId(selectedId: string) {
        if (initialAreaId) return initialAreaId;
        return selectedId !== 'all' ? selectedId : '';
    }

    // Computed Title
    const finalTitle = useMemo(() => {
        if (templateId === 'custom') return customTitle;
        const template = GOAL_TEMPLATES.find(t => t.id === templateId);
        if (!template) return customTitle;
        return `${template.label} ${customTitle}`;
    }, [templateId, customTitle]);

    // Derived Data
    const currentArea = state.areas.find(a => a.id === areaId);

    // Count existing vision goals in this area
    const visionGoalCount = useMemo(() => {
        if (!areaId) return 0;
        return state.goals.filter(g => g.areaId === areaId && g.type === 'vision').length;
    }, [state.goals, areaId]);

    const suggestedMetrics = useMemo(() => {
        if (!areaId || !templateId) return [];
        return getSuggestedMetrics(currentArea?.title || '', templateId);
    }, [areaId, templateId, currentArea]);

    // Date Validation Effect
    useEffect(() => {
        if (!deadline) {
            setDateError(null);
            return;
        }

        const date = parseISO(deadline);
        if (!isValid(date)) return;

        const now = new Date();
        const daysDiff = differenceInDays(date, now);

        // Validation Rules
        if (goalType === 'strategic') {
            // Should be 3 months to 1 year (approx 90 to 365 days)
            if (daysDiff < 90) {
                setDateError("Стратегічна ціль занадто коротка. Мінімум 3 місяці.");
            } else if (daysDiff > 365) {
                setDateError("Стратегічна ціль занадто довга. Максимум 1 рік.");
            } else {
                setDateError(null);
            }
        } else if (goalType === 'tactical') {
            // Should be 1 day to 3 months (approx 1 to 90 days)
            if (daysDiff < 1) {
                setDateError("Дедлайн має бути в майбутньому.");
            } else if (daysDiff > 90) {
                setDateError("Тактична ціль занадто довга. Максимум 3 місяці.");
            } else {
                setDateError(null);
            }
        } else {
            setDateError(null);
        }

    }, [deadline, goalType]);




    const handleAISuggestMetrics = async () => {
        if (!finalTitle) {
            toast.error("Спочатку введіть назву цілі");
            return;
        }
        setIsSuggestingMetrics(true);
        try {
            const response = await fetch('/api/ai/suggest-metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalTitle: finalTitle,
                    description: description, // Pass description if available
                    area: currentArea?.title
                })
            });

            if (!response.ok) throw new Error("Failed to suggest metrics");

            const data: MetricSuggestionResponse = await response.json();
            setAiSuggestedMetrics(data.metrics || []);
            if (data.metrics && data.metrics.length > 0) {
                toast.success(`Знайдено ${data.metrics.length} ідей для метрик!`);
            } else {
                toast.info("AI не знайшов специфічних метрик для цієї цілі.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Не вдалося отримати підказки AI");
        } finally {
            setIsSuggestingMetrics(false);
        }
    };


    const handleNext = () => {
        // Validation per step
        if (step === 2) {
            if (!areaId) { toast.error("Оберіть сферу"); return; }

            // Vision Limit Validation
            if (goalType === 'vision' && visionGoalCount >= 2) {
                toast.error(`У сфері "${currentArea?.title}" вже є 2 довгострокові цілі (Vision). Максимальна кількість досягнута.`);
                return;
            }

            if (!templateId) { toast.error("Оберіть шаблон"); return; }
            if (!customTitle.trim()) { toast.error("Допишіть ціль"); return; }
        }

        if (step === 3 && goalType === 'strategic') {
            if (!targetMetricId) {
                toast.error("Стратегічна ціль вимагає основної метрики");
                return;
            }
        }

        // Step 4 Validation (Start/Target)
        if (step === 4 && goalType === 'strategic') {
            const start = Number(metricStartValue);
            const target = Number(metricTargetValue);

            if (metricDirection === 'increase' && target <= start) {
                toast.error("Для цілі на збільшення, цільове значення має бути більшим за стартове.");
                return;
            }
            if (metricDirection === 'decrease' && target >= start) {
                toast.error("Для цілі на зменшення, цільове значення має бути меншим за стартове.");
                return;
            }
        }

        setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const toggleAdditionalMetric = (mId: string) => {
        if (additionalMetricIds.includes(mId)) {
            setAdditionalMetricIds(prev => prev.filter(id => id !== mId));
        } else {
            setAdditionalMetricIds(prev => [...prev, mId]);
        }
    };

    const handleSubmit = async () => {
        if (dateError) {
            toast.error("Виправте дату дедлайну");
            return;
        }

        setIsLoading(true);

        // Validation (Final check)
        if (goalType === 'strategic' && !targetMetricId) {
            toast.error("Помилка: відсутня метрика");
            setIsLoading(false);
            return;
        }

        try {
            let finalMetricId = targetMetricId;

            // Logic for inline creation removed. Users must use the Wizard now.
            // If we needed to support inline creation, we'd add it back here.

            const goalData: Goal = {
                id: initialData?.id || uuidv4(),
                title: finalTitle,
                areaId,
                description,
                type: goalType,
                status: initialData?.status || 'active',
                progress: initialData?.progress || 0,
                priority,
                deadline: (goalType === 'vision') ? undefined : (deadline || undefined),
                subGoals: initialData?.subGoals || [],
                createdAt: initialData?.createdAt || new Date(), // Keep original date if editing

                // Metric Data
                targetMetricId: (goalType === 'strategic' || (goalType === 'tactical' && finalMetricId)) ? finalMetricId : undefined,
                metricStartValue: finalMetricId ? Number(metricStartValue || 0) : undefined,
                metricTargetValue: finalMetricId ? Number(metricTargetValue || 100) : undefined,
                metricCurrentValue: initialData?.metricCurrentValue ?? (finalMetricId ? Number(metricStartValue || 0) : undefined),
                metricDirection: finalMetricId ? metricDirection : undefined,
                additionalMetricIds: additionalMetricIds.length > 0 ? additionalMetricIds : undefined,
            };

            if (initialData) {
                dispatch({ type: 'UPDATE_GOAL', payload: goalData });
                toast.success("Ціль оновлено!");
            } else {
                dispatch({ type: 'ADD_GOAL', payload: goalData });
                toast.success("Ціль створено успішно!");
            }
            onComplete();

        } catch (error) {
            console.error(error);
            toast.error("Не вдалося створити ціль");
        } finally {
            setIsLoading(false);
        }
    };

    // Render Steps
    if (isMetricWizardOpen) {
        return (
            <MetricCreationWizard
                initialTitle={wizardInitialState.title || ""}
                initialAreaId={areaId}
                initialUnit={wizardInitialState.unit}
                initialTarget={wizardInitialState.target}
                initialDirection={wizardInitialState.direction}
                onComplete={(newId) => {
                    setIsMetricWizardOpen(false);
                    setWizardInitialState({}); // Update state clean
                    if (newId) {
                        setTargetMetricId(newId);
                    }
                }}
                onCancel={() => {
                    setIsMetricWizardOpen(false);
                    setWizardInitialState({});
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">
            {/* Header Progress */}
            <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm px-8 py-5 border-b border-slate-100 dark:border-border flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                        {initialData ? "Редагування Цілі" : "Створення Цілі"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        Крок {step} з 4
                    </p>
                </div>
                {/* Step Indicators */}
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={cn(
                            "h-1.5 w-8 rounded-full transition-all duration-500",
                            i <= step ? "bg-orange-600 shadow-sm shadow-orange-200 dark:shadow-none" : "bg-slate-200 dark:bg-secondary"
                        )} />
                    ))}
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto min-h-0">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 max-w-4xl mx-auto h-full flex flex-col justify-center">
                        <div className="text-center space-y-1 mb-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-foreground">Оберіть тип цілі</h3>
                            <p className="text-slate-500 dark:text-muted-foreground text-sm">Визначте масштаб ваших амбіцій</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-stretch">
                            <GoalTypeCard
                                id="goal-type-vision"
                                type="vision"
                                icon={Compass}
                                title="Довгострокова ціль"
                                subtitle="(1–3 роки)"
                                desc="Напрямок руху. Задає сенс, без дедлайнів."
                                extra="Макс 2 на сферу."
                                selected={goalType === 'vision'}
                                onClick={() => { setGoalType('vision'); checkAndAdvance('create-goal-type'); setStep(2); }}
                                colorClass="text-emerald-600 dark:text-emerald-400"
                                bgClass="bg-emerald-50 dark:bg-emerald-950/30"
                                borderClass="border-emerald-200 dark:border-emerald-800"
                            />
                            <GoalTypeCard
                                id="goal-type-strategic"
                                type="strategic"
                                icon={Target}
                                title="Стратегічна ціль"
                                subtitle="(3 міс. – 1 рік)"
                                desc="Головна зміна. Конкретний, вимірюваний результат."
                                selected={goalType === 'strategic'}
                                onClick={() => { setGoalType('strategic'); checkAndAdvance('create-goal-type'); setStep(2); }}
                                colorClass="text-amber-500 dark:text-amber-400"
                                bgClass="bg-amber-50 dark:bg-amber-950/30"
                                borderClass="border-amber-200 dark:border-amber-800"
                            />
                            <GoalTypeCard
                                id="goal-type-tactical"
                                type="tactical"
                                icon={Flag}
                                title="Тактична ціль"
                                subtitle="(1–3 місяці)"
                                desc="Короткий спринт для фокусу на важливому зараз."
                                selected={goalType === 'tactical'}
                                onClick={() => { setGoalType('tactical'); checkAndAdvance('create-goal-type'); setStep(2); }}
                                colorClass="text-orange-500 dark:text-orange-400"
                                bgClass="bg-orange-50 dark:bg-orange-950/30"
                                borderClass="border-orange-200 dark:border-orange-800"
                            />
                        </div>

                        {/* Tip Block */}
                        <div className="bg-slate-100/50 dark:bg-secondary/30 rounded-xl p-4 border border-slate-200 dark:border-border flex gap-4 items-center">
                            <div className="p-1.5 bg-white dark:bg-secondary rounded-full shadow-sm text-slate-400 dark:text-muted-foreground shrink-0">
                                <Info className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-semibold text-sm text-slate-700 dark:text-foreground">Порада:</h4>
                                <p className="text-xs text-slate-600 dark:text-muted-foreground leading-relaxed">
                                    Цілі різних типів виконують різні ролі. Разом вони допомагають рухатись без перевантаження.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 max-w-2xl mx-auto py-4">
                        <div className="space-y-3">
                            <Label className="text-base font-semibold text-slate-700 dark:text-foreground">1. Оберіть Сферу</Label>
                            <Select value={areaId} onValueChange={(val) => { setAreaId(val); checkAndAdvance('create-goal-area'); }}>
                                <SelectTrigger id="goal-area-select" className="h-12 text-base bg-white dark:bg-secondary/20 shadow-sm border-slate-200 dark:border-border rounded-xl px-4 dark:text-foreground">
                                    <SelectValue placeholder="Сфера..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {state.areas.map(area => (
                                        <SelectItem key={area.id} value={area.id} className="py-2.5 px-4 cursor-pointer focus:bg-slate-50 dark:focus:bg-secondary/50">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10", area.color)} />
                                                <span className="font-medium text-slate-700 dark:text-foreground">{area.title}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {goalType === 'vision' && areaId && (
                                <p className={cn("text-xs font-medium px-2 flex items-center gap-2", visionGoalCount >= 2 ? "text-red-500" : "text-emerald-600")}>
                                    {visionGoalCount >= 2 ? (
                                        <>⚠️ Досягнуто ліміт (2/2) Vision цілей у цій сфері.</>
                                    ) : (
                                        <>✓ Використано {visionGoalCount}/2 Vision цілей для цієї сфери.</>
                                    )}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-semibold text-slate-700 dark:text-foreground">2. Сформулюйте Ціль</Label>
                            <div className="grid grid-cols-[1fr_2fr] gap-3">
                                <Select value={templateId} onValueChange={(val) => { setTemplateId(val); checkAndAdvance('create-goal-template'); }}>
                                    <SelectTrigger id="goal-template-select" className="h-12 bg-white dark:bg-secondary/20 shadow-sm border-slate-200 dark:border-border rounded-xl dark:text-foreground">
                                        <SelectValue placeholder="Шаблон..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom" className="font-semibold text-orange-600 dark:text-orange-400">Свій варіант...</SelectItem>
                                        {GOAL_TEMPLATES.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.label} ...</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="onboarding-goal-title"
                                    value={customTitle}
                                    onChange={e => setCustomTitle(e.target.value)}
                                    placeholder={GOAL_TEMPLATES.find(t => t.id === templateId)?.placeholder || "Чого саме ви хочете досягти?"}
                                    className="h-12 bg-white dark:bg-secondary/20 shadow-sm border-slate-200 dark:border-border rounded-xl text-base placeholder:text-slate-300 dark:placeholder:text-muted-foreground/50 placeholder:font-normal font-semibold text-slate-800 dark:text-foreground"
                                    autoFocus
                                />
                            </div>

                            {(templateId && customTitle) && (
                                <div className="mt-6 p-6 bg-gradient-to-br from-white to-slate-50 dark:from-secondary/30 dark:to-secondary/10 border border-slate-100 dark:border-border rounded-2xl text-center shadow-lg shadow-slate-100/50 dark:shadow-none transform transition-all duration-500">
                                    <span className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-muted-foreground mb-2 block">Попередній перегляд</span>
                                    <p className="text-xl font-bold text-slate-800 dark:text-foreground leading-tight">
                                        "{finalTitle}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 max-w-2xl mx-auto py-4">
                        {goalType === 'vision' ? (
                            <div className="text-center py-16 space-y-6 bg-white dark:bg-card rounded-3xl border border-dashed border-slate-200 dark:border-border">
                                <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <Target className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">Метрика не застосовується</h3>
                                    <p className="text-slate-500 dark:text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                                        Для довгострокових (Vision) цілей вимірювання не є критичним на цьому етапі.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 mb-1">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">Основна метрика успіху</h3>
                                    <p className="text-sm text-slate-500 dark:text-muted-foreground">Оберіть головний показник для вимірювання.</p>
                                </div>

                                {/* Main Metric Selector */}
                                <div className="space-y-4 bg-white dark:bg-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-border">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <Label className="text-sm font-semibold shrink-0">Головна Метрика</Label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (!HAS_FULL_AI) {
                                                        setUpgradeContext({
                                                            title: "AI Підказки Метрик",
                                                            description: "Не знаєте, як виміряти успіх? AI проаналізує вашу ціль і запропонує ідеальні метрики. Доступно у Pro."
                                                        });
                                                        setShowUpgrade(true);
                                                    } else {
                                                        handleAISuggestMetrics();
                                                    }
                                                }}
                                                disabled={isSuggestingMetrics}
                                                className="text-amber-600 hover:text-amber-700 h-8 text-xs font-bold bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-900"
                                            >
                                                {isSuggestingMetrics ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                                {isSuggestingMetrics ? "Шукаю..." : "AI Підказка (Pro)"}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => { setWizardInitialState({}); setIsMetricWizardOpen(true); }} className="text-primary hover:text-primary/80 h-8 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
                                                + Створити нову метрику
                                            </Button>
                                        </div>
                                    </div>

                                    {/* AI Suggestions List */}
                                    {aiSuggestedMetrics.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 animate-in fade-in slide-in-from-top-2">
                                            {aiSuggestedMetrics.map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setWizardInitialState({
                                                            title: suggestion.name,
                                                            unit: suggestion.unit,
                                                            target: suggestion.targetValueSuggestion,
                                                            direction: 'increase' // Default, likely increase for goals
                                                        });
                                                        setIsMetricWizardOpen(true);
                                                    }}
                                                    className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100 dark:hover:bg-amber-950/30 cursor-pointer transition-colors group"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{suggestion.name}</span>
                                                        <Badge variant="outline" className="text-[10px] h-5 bg-white dark:bg-card border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                                                            AI
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-muted-foreground flex justify-between">
                                                        <span>{suggestion.unit}</span>
                                                        <span>Ціль: ~{suggestion.targetValueSuggestion}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Select value={targetMetricId} onValueChange={(val) => {
                                        setTargetMetricId(val);
                                        // Auto-fetch current value
                                        if (val) {
                                            const metric = state.metricDefinitions.find(m => m.id === val);
                                            if (metric) {
                                                if (metric.baseline !== undefined) setMetricStartValue(metric.baseline.toString());
                                                if (metric.target !== undefined) setMetricTargetValue(metric.target.toString());
                                                if (metric.direction) {
                                                    if (metric.direction === 'neutral') setMetricDirection('maintain');
                                                    else setMetricDirection(metric.direction);
                                                }
                                            }

                                            const entries = state.metricEntries.filter(e => e.metricId === val);
                                            // Sort by date desc
                                            entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                            const currentVal = entries.length > 0 ? entries[0].value : (metric?.baseline ?? 0);
                                            setMetricStartValue(currentVal.toString());
                                        }
                                        checkAndAdvance('create-goal-metric-select');
                                    }}>
                                        <SelectTrigger id="goal-metric-select" className="h-11 bg-white dark:bg-secondary/20 border-slate-200 dark:border-border dark:text-foreground"><SelectValue placeholder="Оберіть зі списку..." /></SelectTrigger>
                                        <SelectContent>
                                            {state.metricDefinitions
                                                .filter(m => m.areaId === areaId)
                                                .map(m => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-800 dark:text-foreground">{m.name}</span>
                                                            <span className="text-slate-400 text-xs">({m.unit})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Metric Direction */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-border">
                                        <Label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mb-2 block">Динаміка Метрики</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                id="goal-metric-increase"
                                                onClick={() => { setMetricDirection('increase'); checkAndAdvance('create-goal-metric-direction'); }}
                                                className={cn("flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                                                    metricDirection === 'increase' ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400" : "bg-slate-50 dark:bg-secondary/20 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-secondary/40")}
                                            >
                                                <TrendingUp className="w-4 h-4 mb-1" />
                                                <span className="text-xs font-medium">Збільшення</span>
                                            </button>
                                            <button
                                                id="goal-metric-decrease"
                                                onClick={() => { setMetricDirection('decrease'); checkAndAdvance('create-goal-metric-direction'); }}
                                                className={cn("flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                                                    metricDirection === 'decrease' ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400" : "bg-slate-50 dark:bg-secondary/20 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-secondary/40")}
                                            >
                                                <TrendingDown className="w-4 h-4 mb-1" />
                                                <span className="text-xs font-medium">Зменшення</span>
                                            </button>
                                            <button
                                                id="goal-metric-maintain"
                                                onClick={() => { setMetricDirection('maintain'); checkAndAdvance('create-goal-metric-direction'); }}
                                                className={cn("flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                                                    metricDirection === 'maintain' ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400" : "bg-slate-50 dark:bg-secondary/20 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-secondary/40")}
                                            >
                                                <Minus className="w-4 h-4 mb-1" />
                                                <span className="text-xs font-medium">Будь-яка</span>
                                            </button>
                                        </div>
                                    </div>

                                </div>

                                {/* Additional Metrics (Optional) */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider pl-1">Додаткові метрики (опціонально)</Label>
                                    <Select value="" onValueChange={toggleAdditionalMetric}>
                                        <SelectTrigger className="h-10 border-slate-200 dark:border-border bg-white dark:bg-secondary/20 border-dashed text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground hover:border-slate-300 dark:hover:border-primary/50 transition-colors">
                                            <span className="flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Додати ще одну метрику</span>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {state.metricDefinitions
                                                .filter(m => m.areaId === areaId && m.id !== targetMetricId && !additionalMetricIds.includes(m.id))
                                                .map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                ))}
                                            {state.metricDefinitions.filter(m => m.areaId === areaId && m.id !== targetMetricId && !additionalMetricIds.includes(m.id)).length === 0 && (
                                                <div className="p-3 text-xs text-center text-muted-foreground">Немає доступних метрик</div>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {/* List of selected additional metrics */}
                                    {additionalMetricIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {additionalMetricIds.map(id => {
                                                const m = state.metricDefinitions.find(d => d.id === id);
                                                return m ? (
                                                    <Badge key={id} variant="secondary" className="px-2 py-1 gap-1 bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-secondary">
                                                        {m.name}
                                                        <button onClick={(e) => { e.stopPropagation(); toggleAdditionalMetric(id); }} className="hover:text-red-500 transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 max-w-2xl mx-auto py-4">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-foreground">Фінальні деталі</h3>
                            <p className="text-slate-500 dark:text-muted-foreground text-sm">Задайте контекст для успіху</p>
                        </div>

                        {(goalType === 'strategic' || goalType === 'tactical') && (
                            <div className="bg-white dark:bg-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-border space-y-3">
                                <Label className="text-sm font-semibold">Дедлайн</Label>
                                <Input id="goal-deadline-input" type="date" value={deadline} onChange={e => { setDeadline(e.target.value); checkAndAdvance('create-goal-deadline'); }} className={cn("h-11 text-base dark:text-foreground bg-slate-50 dark:bg-secondary/20", dateError && "border-red-300 focus-visible:ring-red-200")} />

                                {dateError ? (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                        <Info className="w-4 h-4" /> {dateError}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        {goalType === 'strategic' ? "Рекомендовано: 3 міс - 1 рік" : "Рекомендовано: до 3 місяців"}
                                    </p>
                                )}
                            </div>
                        )}

                        {goalType !== 'vision' && targetMetricId && (
                            <div className="bg-white dark:bg-card p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-border space-y-4">
                                <Label className="text-sm font-semibold">Налаштування Старту та Фінішу</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-500 text-xs uppercase">Старт (Поточне)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={metricStartValue}
                                            onChange={e => setMetricStartValue(e.target.value)}
                                            className="h-11 bg-white dark:bg-card border-slate-200 dark:border-border text-slate-900 dark:text-foreground font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-500 text-xs uppercase">Ціль</Label>
                                        <Input type="number" placeholder="100" value={metricTargetValue} onChange={e => setMetricTargetValue(e.target.value)} className="h-11 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Опис / Мотивація</Label>
                            <Textarea
                                id="goal-description-input"
                                value={description}
                                onChange={e => { setDescription(e.target.value); checkAndAdvance('create-goal-description'); }}
                                placeholder="Чому досягнення цієї цілі змінить ваше життя?"
                                className="min-h-[120px] p-4 text-base bg-white dark:bg-card shadow-sm border-slate-200 dark:border-border rounded-2xl resize-none placeholder:text-slate-300 dark:placeholder:text-muted-foreground/50 dark:text-foreground"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-slate-200 dark:border-border p-5 bg-white dark:bg-card flex justify-between shrink-0 items-center z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                {step > 1 ? (
                    <Button variant="ghost" onClick={handleBack} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-secondary pl-2">
                        <ChevronLeft className="w-5 h-5 mr-1" /> Назад
                    </Button>
                ) : (
                    <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-muted-foreground dark:hover:text-red-400 dark:hover:bg-red-950/20">
                        Скасувати
                    </Button>
                )}

                {step < 4 ? (
                    <Button
                        onClick={handleNext}
                        className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 px-8 h-11 rounded-xl font-semibold shadow-lg shadow-slate-200 dark:shadow-none disabled:opacity-50"
                        disabled={step === 2 && goalType === 'vision' && visionGoalCount >= 2}
                        id="onboarding-goal-next-btn"
                    >
                        Далі <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !!dateError}
                        id="onboarding-goal-create-btn"
                        className="bg-orange-600 hover:bg-orange-700 text-white px-10 h-11 rounded-xl font-bold text-base shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {initialData ? "Зберегти Зміни" : "Створити Ціль"}
                    </Button>
                )}
            </div>
            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title={upgradeContext.title}
                description={upgradeContext.description}
            />
        </div >
    );
}

function GoalTypeCard({ id, type, icon: Icon, title, subtitle, desc, extra, selected, onClick, colorClass, bgClass, borderClass }: any) {
    return (
        <div
            id={id}
            onClick={onClick}
            className={cn(
                "relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group hover:shadow-lg flex flex-col h-full",
                selected ? cn(borderClass, bgClass, "shadow-md scale-[1.02]") : "border-slate-100 bg-white hover:border-slate-200 dark:bg-card dark:border-border/50 dark:hover:border-border"
            )}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0",
                    selected ? "bg-white dark:bg-background shadow-sm" : "bg-slate-100 group-hover:bg-slate-50 dark:bg-secondary dark:group-hover:bg-secondary/80"
                )}>
                    <Icon className={cn("w-5 h-5", selected ? colorClass.replace('text-', 'stroke-') : "text-slate-500", selected && colorClass)} />
                </div>
                <div>
                    <h4 className={cn("text-sm font-bold leading-tight", selected ? "text-slate-900 dark:text-foreground" : "text-slate-800 dark:text-muted-foreground")}>
                        {title}
                    </h4>
                    {subtitle && <p className={cn("text-[10px] font-bold uppercase tracking-wider", selected ? colorClass : "text-slate-400")}>{subtitle}</p>}
                </div>
                {selected && <div className={cn("ml-auto h-3 w-3 rounded-full", colorClass.replace('text-', 'bg-'))} />}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-2 flex-1">
                {desc}
            </p>

            {extra && (
                <div className="mt-auto pt-2 border-t border-black/5">
                    <p className="text-[10px] font-medium text-slate-400 italic">
                        {extra}
                    </p>
                </div>
            )}
        </div>
    );
}
