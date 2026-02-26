'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Goal, LifeArea, MetricDefinition, Action } from '@/types';
import { formatGoalMetricDisplay } from '@/lib/goal-utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Target, Calendar, CheckCircle2, AlertTriangle, Trash2, Edit, X, Trophy, TrendingUp, TrendingDown, Minus, PlayCircle, PauseCircle, ChevronRight, ExternalLink, Loader2, ArrowLeft, Plus, Circle, ListChecks, Sparkles, RefreshCw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GoalCreationWizard } from '@/components/goals/GoalCreationWizard';
import { MetricUpdateDialog } from '@/components/features/MetricUpdateDialog';
import { v4 as uuidv4 } from 'uuid';
import { GoalReflectionDialog } from '@/components/goals/GoalReflectionDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useSubscription } from '@/hooks/useSubscription';
import { Input } from '@/components/ui/input';
import { GoalBreakdownResponse } from '@/lib/ai/types';

export default function GoalDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const goalId = params?.id as string;

    const { state, dispatch } = useData();
    const [isEditing, setIsEditing] = useState(false);

    // Metric Updates
    const [isReflectionOpen, setIsReflectionOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(null);

    // Subgoals & Permissions
    const { HAS_SUBGOALS, HAS_AI_GOAL_BREAKDOWN } = useSubscription()?.limits || { HAS_SUBGOALS: false, HAS_AI_GOAL_BREAKDOWN: false };
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [upgradeContext, setUpgradeContext] = useState({ title: '', description: '' });
    const [isAddingSubgoal, setIsAddingSubgoal] = useState(false);
    const [newSubgoalTitle, setNewSubgoalTitle] = useState('');
    const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);
    const [previewTasks, setPreviewTasks] = useState<{ id: string; title: string; hint: string }[]>([]);
    const [regenerationFeedback, setRegenerationFeedback] = useState('');
    const [subgoalToComplete, setSubgoalToComplete] = useState<string | null>(null);
    // Use live data from store
    const activeGoal = state.goals.find(g => g.id === goalId);

    // Local state for smooth slider interaction
    const [currentProgress, setCurrentProgress] = useState(0);

    // Sync local state when goal/progress changes
    useEffect(() => {
        if (activeGoal) {
            setCurrentProgress(activeGoal.progress);
        }
    }, [activeGoal?.progress]);

    if (!activeGoal) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-100px)]">
                <Target className="h-12 w-12 text-slate-300 dark:text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-foreground mb-2">Ціль не знайдено</h3>
                <p className="text-slate-500 mb-6">Ця ціль була видалена або не існує.</p>
                <Button onClick={() => router.push('/goals')} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Повернутися до цілей
                </Button>
            </div>
        );
    }

    const area = state.areas.find(a => a.id === activeGoal.areaId);
    const metric = state.metricDefinitions.find(m => m.id === activeGoal.targetMetricId);

    // 30-Day Rule Logic
    const createdAtDate = activeGoal.createdAt
        ? (typeof activeGoal.createdAt === 'string' ? parseISO(activeGoal.createdAt) : activeGoal.createdAt)
        : new Date();
    const daysSinceCreation = differenceInDays(new Date(), createdAtDate);
    const isModifiable = daysSinceCreation <= 30;

    // Deadline Logic
    const deadlineDate = activeGoal.deadline ? new Date(activeGoal.deadline) : null;
    const isDeadlineMissed = deadlineDate && deadlineDate < new Date() && activeGoal.status !== 'completed';

    // Completion Logic (Honest Model)
    const isStrategic = activeGoal.type === 'strategic';
    const isVision = activeGoal.type === 'vision';

    const checkAchievement = (current: number, target: number, direction: 'increase' | 'decrease' | 'maintain' = 'increase') => {
        if (direction === 'increase') return current >= target;
        if (direction === 'decrease') return current <= target;
        return false;
    };

    const isAchieved = metric && activeGoal.metricTargetValue !== undefined && activeGoal.metricCurrentValue !== undefined && activeGoal.metricCurrentValue !== null
        ? checkAchievement(activeGoal.metricCurrentValue, activeGoal.metricTargetValue, activeGoal.metricDirection)
        : false;

    const handleAIBreakdown = async (isRegeneration: boolean = false) => {
        const activeStepsCount = activeGoal.subGoals?.filter(sg => !sg.completed).length || 0;
        const requestedCount = Math.max(0, 7 - activeStepsCount);

        if (requestedCount <= 0) {
            toast.info("Максимальна кількість активних кроків (7). Виконайте або видаліть існуючі, щоб згенерувати нові.");
            return;
        }

        let feedback = undefined;
        if (isRegeneration && previewTasks.length > 0 && regenerationFeedback.trim()) {
            const currentTitles = previewTasks.map(t => `- ${t.title}`).join('\n');
            feedback = `Ось поточні запропоновані кроки:\n${currentTitles}\nМої зауваження до них:\n${regenerationFeedback}\nБудь ласка, перегенеруй список кроків враховуючи ці побажання.`;
        }

        setIsGeneratingBreakdown(true);
        try {
            const response = await fetch('/api/ai/goal-breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalTitle: activeGoal.title,
                    goalDescription: activeGoal.description,
                    area: area?.title,
                    requestedCount,
                    feedback
                })
            });

            if (!response.ok) throw new Error('Failed to generate breakdown');

            const data: GoalBreakdownResponse = await response.json();

            if (data.subTasks && data.subTasks.length > 0) {
                const newPreviewTasks = data.subTasks.slice(0, requestedCount).map((task: { title: string }) => ({
                    id: uuidv4(),
                    title: task.title,
                    hint: ''
                }));
                setPreviewTasks(newPreviewTasks);
            } else {
                toast.info("AI не знайшов варіантів для цієї цілі.");
            }

        } catch (error) {
            console.error(error);
            toast.error("Не вдалося згенерувати план");
        } finally {
            setIsGeneratingBreakdown(false);
        }
    };

    const removePreviewTask = (id: string) => {
        setPreviewTasks(prev => prev.filter(t => t.id !== id));
    };

    const updatePreviewTaskHint = (id: string, hint: string) => {
        setPreviewTasks(prev => prev.map(t => t.id === id ? { ...t, hint } : t));
    };

    const confirmPreviewTasks = () => {
        if (previewTasks.length === 0) {
            return;
        }

        const newSubgoals = previewTasks.map(task => ({
            id: uuidv4(),
            title: task.title,
            completed: false
        }));

        const updatedSubgoals = [...(activeGoal.subGoals || []), ...newSubgoals];

        const todayStr = new Date().toISOString().split('T')[0];
        const nowIso = new Date().toISOString();

        previewTasks.forEach((task, index) => {
            const newActionId = uuidv4();
            const newAction: Action = {
                id: newActionId,
                userId: 'user',
                title: task.title,
                description: task.hint ? `Коментар: ${task.hint}\n\nЗгенеровано AI для цілі: ${activeGoal.title}` : `Згенеровано AI для цілі: ${activeGoal.title}`,
                type: 'task',
                status: 'pending',
                completed: false,
                priority: 'medium',
                date: todayStr,
                createdAt: nowIso,
                updatedAt: nowIso,
                areaId: activeGoal.areaId,
                linkedGoalId: activeGoal.id,
                duration: 15,
                isFocus: index < 3
            };

            dispatch({ type: 'ADD_ACTION', payload: newAction });
        });

        dispatch({
            type: 'UPDATE_GOAL',
            payload: { ...activeGoal, subGoals: updatedSubgoals }
        });

        toast.success(`Збережено ${previewTasks.length} кроків!`);
        setPreviewTasks([]);
    };

    const addSubgoal = () => {
        if (!newSubgoalTitle.trim()) return;
        const newSubgoal = { id: uuidv4(), title: newSubgoalTitle, completed: false };
        const updatedSubgoals = [...(activeGoal.subGoals || []), newSubgoal];

        dispatch({
            type: 'UPDATE_GOAL',
            payload: { ...activeGoal, subGoals: updatedSubgoals }
        });
        setNewSubgoalTitle('');
        setIsAddingSubgoal(false);
        toast.success("Крок додано");
    };

    const confirmSubgoalCompletion = () => {
        if (!subgoalToComplete) return;
        const sg = activeGoal.subGoals?.find(s => s.id === subgoalToComplete);
        if (!sg) return;

        // Find associated action and complete it
        const action = state.actions.find(a => a.linkedGoalId === activeGoal.id && a.title === sg.title && !a.completed);

        if (action) {
            dispatch({ type: 'UPDATE_ACTION', payload: { ...action, completed: true, status: 'completed', updatedAt: new Date().toISOString() } });
        }

        const updatedSubgoals = (activeGoal.subGoals || []).map(s =>
            s.id === sg.id ? { ...s, completed: true } : s
        );
        dispatch({
            type: 'UPDATE_GOAL',
            payload: { ...activeGoal, subGoals: updatedSubgoals }
        });

        setSubgoalToComplete(null);
        toast.success("Крок виконано!");
    };

    const toggleSubgoal = (id: string, currentStatus: boolean) => {
        if (!currentStatus) {
            // Trying to complete it -> ask for confirmation
            setSubgoalToComplete(id);
        } else {
            // Un-completing -> proceed immediately
            const updatedSubgoals = (activeGoal.subGoals || []).map(sg =>
                sg.id === id ? { ...sg, completed: false } : sg
            );
            dispatch({
                type: 'UPDATE_GOAL',
                payload: { ...activeGoal, subGoals: updatedSubgoals }
            });
        }
    };

    const deleteSubgoal = (id: string) => {
        const updatedSubgoals = (activeGoal.subGoals || []).filter(sg => sg.id !== id);
        dispatch({
            type: 'UPDATE_GOAL',
            payload: { ...activeGoal, subGoals: updatedSubgoals }
        });
    };

    const handleReflectAndFinish = async (reflection: string, rating: number, finalStatus: Goal['status'] = 'achieved') => {
        // Create journal entry or Note
        dispatch({
            type: 'ADD_NOTE',
            payload: {
                id: uuidv4(),
                userId: 'user',
                title: `Рефлексія: ${activeGoal.title}`,
                content: `### Рефлексія по цілі: \n\n**Результат**:  ${formatGoalMetricDisplay(activeGoal).current}/${formatGoalMetricDisplay(activeGoal).target} ${metric?.unit})\n**Рейтинг**: \n\n`,
                relatedAreaIds: [activeGoal.areaId],
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                pinned: false,
                tags: ['reflection', 'goal-completion']
            }
        });

        // Complete Goal with specific status
        dispatch({
            type: 'UPDATE_GOAL',
            payload: {
                ...activeGoal,
                status: finalStatus,
                progress: finalStatus === 'achieved' ? 100 : activeGoal.progress,
                endDate: new Date().toISOString()
            }
        });

        toast.success("Ціль зафіксовано! Історія збережена.");
    };

    const handleDelete = () => {
        if (confirm("Ви впевнені, що хочете видалити цю ціль? Цю дію неможливо скасувати.")) {
            dispatch({ type: 'DELETE_GOAL', payload: { id: activeGoal.id } });
            toast.success("Ціль видалено.");
            router.push('/goals');
        }
    };

    const handleStatusToggle = () => {
        const newStatus = activeGoal.status === 'paused' ? 'active' : 'paused';
        dispatch({
            type: 'UPDATE_GOAL',
            payload: { ...activeGoal, status: newStatus }
        });
        toast.info(newStatus === 'paused' ? "Ціль на паузі" : "Ціль відновлено");
    };

    if (isEditing) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <GoalCreationWizard
                    initialData={activeGoal}
                    onComplete={() => setIsEditing(false)}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="relative min-h-[calc(100vh-80px)] md:h-full pb-20">
            {/* Header with Area Color */}
            <div className={cn("h-40 md:h-48 relative rounded-b-[2rem] md:rounded-b-none md:rounded-t-[2rem] mb-12", area?.color ? `bg-${area.color.split('-')[1]}-50 dark:bg-${area.color.split('-')[1]}-900/20` : "bg-slate-100 dark:bg-secondary")}>
                <div className="absolute top-4 left-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 text-slate-700 dark:text-foreground backdrop-blur-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </div>

                {/* Icon Badge */}
                <div className="absolute -bottom-8 left-8 p-4 bg-white dark:bg-card rounded-2xl shadow-lg border border-slate-100 dark:border-border">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        activeGoal.type === 'vision' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            activeGoal.type === 'strategic' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    )}>
                        <Target className="w-8 h-8" />
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8 max-w-4xl mx-auto space-y-8">
                {/* Title & Metadata */}
                <div>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-foreground leading-tight">{activeGoal.title}</h2>
                        <Badge variant="outline" className={cn(
                            "uppercase tracking-wider text-[10px] font-bold px-3 py-1.5 flex items-center gap-1.5 shrink-0 self-start md:self-auto",
                            activeGoal.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" :
                                activeGoal.status === 'paused' ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" :
                                    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        )}>
                            {activeGoal.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                activeGoal.status === 'paused' ? <PauseCircle className="w-3.5 h-3.5" /> :
                                    <Target className="w-3.5 h-3.5" />}
                            {activeGoal.status === 'completed' ? 'Завершено' :
                                activeGoal.status === 'paused' ? 'На паузі' : 'Активна'}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-muted-foreground">
                        {area && (
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-secondary/50 px-2 py-1 rounded-md">
                                <span className={cn("w-2 h-2 rounded-full", !area.color?.startsWith('#') && !area.color?.startsWith('rgb') && area.color)} style={(area.color?.startsWith('#') || area.color?.startsWith('rgb')) ? { backgroundColor: area.color } : undefined} />
                                <span className="font-medium">{area.title}</span>
                            </div>
                        )}
                        {activeGoal.deadline && (
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-secondary/50 px-2 py-1 rounded-md">
                                <Calendar className={cn("w-4 h-4", isDeadlineMissed ? "text-red-500" : "text-slate-400")} />
                                <span className={cn(isDeadlineMissed ? "text-red-500 font-bold" : "")}>
                                    {isDeadlineMissed ? "Дедлайн Пройшов: " : "Дедлайн: "}
                                    {format(new Date(activeGoal.deadline), 'dd MMM yyyy', { locale: uk })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {activeGoal.description && (
                    <div className="bg-slate-50 dark:bg-secondary/20 p-5 rounded-xl border border-slate-100 dark:border-border/50">
                        <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-muted-foreground tracking-wider mb-2">Опис / Мотивація</h4>
                        <p className="text-slate-700 dark:text-foreground leading-relaxed whitespace-pre-wrap">{activeGoal.description}</p>
                    </div>
                )}

                {/* Subgoals / Steps Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                            <ListChecks className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            Кроки та Підцілі
                        </h4>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300"
                                disabled={isGeneratingBreakdown}
                                onClick={() => {
                                    if (!HAS_AI_GOAL_BREAKDOWN) {
                                        setUpgradeContext({
                                            title: "Структура - ключ до успіху",
                                            description: "Більшість цілей не досягаються не через лінь, а через відсутність структури. Zynorvia AI розкладе цю ціль на реальні дії."
                                        });
                                        setShowUpgrade(true);
                                    } else {
                                        handleAIBreakdown(false);
                                    }
                                }}
                            >
                                {isGeneratingBreakdown ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {isGeneratingBreakdown ? "Думаю..." : "AI План"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-slate-100 dark:bg-secondary hover:bg-slate-200 text-slate-600 dark:text-muted-foreground"
                                onClick={() => {
                                    if (!HAS_SUBGOALS) {
                                        setUpgradeContext({
                                            title: "Деталізація цілей",
                                            description: "Pro дозволяє створювати необмежену кількість підцілей для кращого контролю прогресу."
                                        });
                                        setShowUpgrade(true);
                                    } else {
                                        setIsAddingSubgoal(true);
                                    }
                                }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Додати крок
                            </Button>
                        </div>
                    </div>

                    {/* AI Plan Generation Loading */}
                    {isGeneratingBreakdown && previewTasks.length === 0 && (
                        <div className="p-8 text-center bg-transparent border border-dashed border-violet-200 dark:border-violet-900/50 rounded-xl space-y-3">
                            <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                            <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Аналізую ціль та формую кроки...</p>
                        </div>
                    )}


                    {/* Subgoals List */}
                    <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm">
                        {((activeGoal.subGoals && activeGoal.subGoals.filter(sg => !sg.completed).length > 0) || previewTasks.length > 0) ? (
                            <div className="divide-y divide-slate-100 dark:divide-border/50">
                                {/* Regular Active Subgoals */}
                                {(activeGoal.subGoals || []).filter(sg => !sg.completed).map((sg) => (
                                    <div key={sg.id} className="p-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-secondary/20 transition-colors group">
                                        <button
                                            onClick={() => toggleSubgoal(sg.id, sg.completed)}
                                            className={cn("shrink-0 transition-colors", sg.completed ? "text-emerald-500" : "text-slate-300 dark:text-slate-600 hover:text-emerald-400")}
                                        >
                                            {sg.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </button>
                                        <span className={cn("text-sm flex-1", sg.completed && "line-through text-muted-foreground decoration-slate-300")}>{sg.title}</span>
                                        <button
                                            onClick={() => deleteSubgoal(sg.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* AI Preview Subgoals */}
                                {!isGeneratingBreakdown && previewTasks.length > 0 && (
                                    <div className="border-t-2 border-dashed border-violet-200 dark:border-violet-900/50 bg-violet-50/10 dark:bg-violet-900/5">
                                        <div className="p-3 text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5 uppercase tracking-wide bg-violet-50/50 dark:bg-violet-900/20">
                                            <Sparkles className="w-3.5 h-3.5" /> Запропоновані кроки AI
                                        </div>
                                        <div className="divide-y divide-violet-100 dark:divide-violet-900/30">
                                            {previewTasks.map((task) => (
                                                <div key={task.id} className="p-3.5 flex items-center gap-3 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-colors group">
                                                    <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
                                                    <Input
                                                        value={task.title}
                                                        onChange={(e) => updatePreviewTaskHint(task.id, e.target.value)}
                                                        className="text-sm flex-1 bg-transparent border-none h-auto p-0 focus-visible:ring-0 shadow-none font-medium text-slate-700 dark:text-slate-200"
                                                    />
                                                    <button
                                                        onClick={() => removePreviewTask(task.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Regeneration Context Area */}
                                        <div className="p-4 bg-violet-50/80 dark:bg-violet-900/20 space-y-3">
                                            <Input
                                                placeholder="Вам не подобаються ці кроки? Напишіть коментар для AI..."
                                                value={regenerationFeedback}
                                                onChange={(e) => setRegenerationFeedback(e.target.value)}
                                                className="h-9 text-sm bg-white dark:bg-card border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                                            />
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setPreviewTasks([])} className="h-8 text-xs text-slate-500 hover:text-slate-700">Скасувати</Button>
                                                <Button size="sm" onClick={() => handleAIBreakdown(true)} disabled={isGeneratingBreakdown} className="h-8 text-xs bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 shadow-sm">
                                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                                    Перегенерувати
                                                </Button>
                                                <Button size="sm" onClick={confirmPreviewTasks} disabled={previewTasks.length === 0} className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                    Зберегти кроки
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 dark:text-muted-foreground/60 text-sm italic">
                                Ще немає кроків. Розбийте ціль на етапи для кращого контролю.
                            </div>
                        )}

                        {/* Add Subgoal Input */}
                        {isAddingSubgoal && (
                            <div className="p-3 border-t border-slate-100 dark:border-border bg-slate-50/50 dark:bg-secondary/10 flex gap-2">
                                <Input
                                    value={newSubgoalTitle}
                                    onChange={e => setNewSubgoalTitle(e.target.value)}
                                    placeholder="Назва кроку..."
                                    className="h-10 text-sm bg-white dark:bg-card"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && addSubgoal()}
                                />
                                <Button size="sm" onClick={addSubgoal} disabled={!newSubgoalTitle.trim()} className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Metrics Section OR Manual Progress */}
                {metric ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                Прогрес Метрики
                            </h4>
                            <div className="flex items-center gap-3">
                                {isAchieved && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 hidden sm:inline-flex">
                                        Ціль Досягнуто! 🚀
                                    </Badge>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-900/20 gap-1.5 shadow-sm"
                                    onClick={() => {
                                        setSelectedMetric(metric);
                                        setUpdateDialogOpen(true);
                                    }}
                                >
                                    Оновити <Edit className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-5 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-slate-500 dark:text-muted-foreground mb-1">{metric.name}</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-foreground flex items-baseline gap-1.5">
                                        {formatGoalMetricDisplay(activeGoal).current}
                                        <span className="text-sm text-slate-400 dark:text-muted-foreground font-normal">/ {formatGoalMetricDisplay(activeGoal).target} {metric.unit}</span>
                                    </div>
                                </div>
                            </div>
                            <Progress value={activeGoal.progress} className="h-3" indicatorClassName={cn(isAchieved ? "bg-emerald-500" : "bg-primary")} />
                            <div className="mt-2 text-right text-xs font-bold text-slate-500 dark:text-muted-foreground">{Math.round(activeGoal.progress)}% досягнуто</div>
                        </div>
                    </div>
                ) : (
                    !isVision && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                                    <Target className="w-4 h-4 text-orange-500" />
                                    Ручний Прогрес
                                </h4>
                                <span className={cn("text-xl font-bold", currentProgress === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-foreground")}>
                                    {Math.round(currentProgress)}%
                                </span>
                            </div>
                            <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl p-6 shadow-sm space-y-5">
                                <div className="relative pt-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        disabled={activeGoal.status === 'completed' || !isModifiable}
                                        value={currentProgress}
                                        onChange={(e) => {
                                            const newVal = Number(e.target.value);
                                            setCurrentProgress(newVal);
                                            dispatch({
                                                type: 'UPDATE_GOAL_PROGRESS',
                                                payload: { id: activeGoal.id, progress: newVal }
                                            });
                                        }}
                                        className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-600 dark:accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-muted-foreground font-medium mt-3 uppercase tracking-wider">
                                        <span>Старт</span>
                                        <span>50%</span>
                                        <span>Фініш</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-muted-foreground italic text-center">
                                    Перетягніть повзунок, щоб оновити прогрес тактичної цілі.
                                </p>
                            </div>
                        </div>
                    )
                )}

                {/* 30-Day Warning */}
                {!isModifiable && activeGoal.status !== 'completed' && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-3 rounded-lg border border-amber-100 dark:border-amber-900/50 flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>Редагування заблоковано (30+ днів з моменту створення). Ви можете лише оновлювати статус прогресу.</span>
                    </div>
                )}

                {/* Actions Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 pb-12 mb-12 border-t border-slate-200 dark:border-border">
                    {/* Management Actions */}
                    <div className="flex flex-wrap gap-2">
                        {activeGoal.status !== 'completed' && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                disabled={!isModifiable}
                                className={cn("bg-white dark:bg-card", !isModifiable && "opacity-50 cursor-not-allowed text-muted-foreground")}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Редагувати
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={!isModifiable}
                            className={cn("text-red-600 hover:bg-red-50 hover:text-red-700 bg-white dark:bg-card border-red-200 dark:border-red-900/40 dark:text-red-500", !isModifiable && "opacity-50 cursor-not-allowed")}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Видалити
                        </Button>
                        {activeGoal.status !== 'completed' && (
                            <Button variant="outline" onClick={handleStatusToggle} className="bg-white dark:bg-card text-slate-600 dark:text-slate-300">
                                {activeGoal.status === 'paused' ? <PlayCircle className="w-4 h-4 mr-2" /> : <PauseCircle className="w-4 h-4 mr-2" />}
                                {activeGoal.status === 'paused' ? 'Відновити' : 'На паузу'}
                            </Button>
                        )}
                    </div>

                    {/* Completion Action */}
                    {!['achieved', 'not_achieved', 'abandoned', 'completed'].includes(activeGoal.status) && (
                        <>
                            {isVision ? (
                                <div className="text-sm text-slate-400 dark:text-muted-foreground italic px-2">
                                    Цілі типу Напрямок (Vision) не завершуються
                                </div>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={() => setIsReflectionOpen(true)}
                                    className={cn(
                                        "text-white shadow-lg animate-pulse-slow w-full sm:w-auto",
                                        isAchieved || currentProgress >= 100
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                            : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                                    )}
                                >
                                    {isAchieved || currentProgress >= 100 ? <Trophy className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                    {isAchieved || currentProgress >= 100 ? "Зафіксувати Успіх" : "Завершити..."}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>



            <GoalReflectionDialog
                goal={activeGoal}
                isOpen={isReflectionOpen}
                onClose={() => setIsReflectionOpen(false)}
                onConfirm={handleReflectAndFinish}
            />

            {metric && (
                <MetricUpdateDialog
                    open={updateDialogOpen}
                    onOpenChange={setUpdateDialogOpen}
                    metric={metric}
                    entries={state.metricEntries.filter(e => e.metricId === metric.id)}
                    color={area?.color}
                />
            )}

            <Dialog open={!!subgoalToComplete} onOpenChange={(open) => !open && setSubgoalToComplete(null)}>
                <DialogContent className="max-w-md bg-white dark:bg-card">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            Завершити крок?
                        </DialogTitle>
                        <DialogDescription>
                            Ви дійсно виконали цей крок?
                            Це також автоматично завершить пов'язане завдання з вашого списку дій,
                            після чого крок зникне зі списку поточних.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="ghost" onClick={() => setSubgoalToComplete(null)}>Скасувати</Button>
                        <Button onClick={confirmSubgoalCompletion} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Так, виконано!
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
