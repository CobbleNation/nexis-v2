import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Goal, LifeArea, MetricDefinition, Action } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Target, Calendar, CheckCircle2, AlertTriangle, Trash2, Edit, X, Trophy, TrendingUp, TrendingDown, Minus, PlayCircle, PauseCircle, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DialogTitle } from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GoalCreationWizard } from './GoalCreationWizard';
import { MetricUpdateDialog } from '@/components/features/MetricUpdateDialog';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import { GoalReflectionDialog } from './GoalReflectionDialog';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/common/UpgradeModal';
import { ListChecks, Sparkles, Plus, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GoalBreakdownResponse } from '@/lib/ai/types';

interface GoalDetailsModalProps {
    goal: Goal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GoalDetailsModal({ goal, open, onOpenChange }: GoalDetailsModalProps) {
    const { state, dispatch } = useData();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);

    // Metric Updates
    const [isReflectionOpen, setIsReflectionOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(null);

    // Subgoals & Permissions
    const { HAS_SUBGOALS, HAS_AI_GOAL_BREAKDOWN } = useSubscription()?.limits || { HAS_SUBGOALS: false, HAS_AI_GOAL_BREAKDOWN: false }; // Safe fallback
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [upgradeContext, setUpgradeContext] = useState({ title: '', description: '' });
    const [isAddingSubgoal, setIsAddingSubgoal] = useState(false);
    const [newSubgoalTitle, setNewSubgoalTitle] = useState('');
    const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);

    const { user } = state; // Access user from state to get ID if needed, though we use 'current' or 'user' usually

    const handleAIBreakdown = async () => {
        setIsGeneratingBreakdown(true);
        try {
            const response = await fetch('/api/ai/goal-breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goalTitle: activeGoal.title,
                    goalDescription: activeGoal.description,
                    area: area?.title
                })
            });

            if (!response.ok) throw new Error('Failed to generate breakdown');

            const data: GoalBreakdownResponse = await response.json();

            if (data.subTasks && data.subTasks.length > 0) {
                // 1. Create Subgoals for the Goal (Checklist)
                const newSubgoals = data.subTasks.map((task: { title: any; }) => ({
                    id: uuidv4(),
                    title: task.title,
                    completed: false
                }));

                const updatedSubgoals = [...(activeGoal.subGoals || []), ...newSubgoals];

                // 2. Create Actual Tasks (Actions) for the Calendar/Todo List
                const todayStr = new Date().toISOString().split('T')[0];
                const nowIso = new Date().toISOString();

                // We'll dispatch them one by one or we could have a BULK_ADD_ACTION if store supported it, 
                // but for 5-7 items loop is fine.
                data.subTasks.forEach((task: { title: string }, index: number) => {
                    const newActionId = uuidv4();
                    const newAction: Action = {
                        id: newActionId,
                        userId: 'user', // Default user ID
                        title: task.title,
                        description: `Auto-generated step for goal: ${activeGoal.title}`,
                        type: 'task',
                        status: 'pending',
                        completed: false,
                        priority: 'medium',
                        date: todayStr, // Schedule for Today by default
                        createdAt: nowIso,
                        updatedAt: nowIso,
                        areaId: activeGoal.areaId,
                        linkedGoalId: activeGoal.id,
                        duration: 15, // Default duration
                        isFocus: index < 3 // Make top 3 focus? Maybe not, let's keep it simple.
                    };

                    dispatch({ type: 'ADD_ACTION', payload: newAction });
                });

                dispatch({
                    type: 'UPDATE_GOAL',
                    payload: { ...activeGoal, subGoals: updatedSubgoals }
                });

                toast.success(`Згенеровано ${newSubgoals.length} кроків та створено завдання!`);
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

    const toggleSubgoal = (id: string) => {
        const updatedSubgoals = (activeGoal.subGoals || []).map(sg =>
            sg.id === id ? { ...sg, completed: !sg.completed } : sg
        );
        dispatch({
            type: 'UPDATE_GOAL',
            payload: { ...activeGoal, subGoals: updatedSubgoals }
        });
    };

    const deleteSubgoal = (id: string) => {
        const updatedSubgoals = (activeGoal.subGoals || []).filter(sg => sg.id !== id);
        dispatch({
            type: 'UPDATE_GOAL',
            payload: { ...activeGoal, subGoals: updatedSubgoals }
        });
    };





    // Local state for smooth slider interaction (fixes UI lag)
    // Initialize with safe default, sync in useEffect
    const [currentProgress, setCurrentProgress] = useState(0);

    // Sync local state when goal/progress changes
    // We access state.goals directly here to avoid conditional variable declaration issues
    useEffect(() => {
        if (goal) {
            const active = state.goals.find(g => g.id === goal.id) || goal;
            setCurrentProgress(active.progress);
        }
    }, [goal, state.goals]); // Re-run if goal ID changes or global state updates

    if (!goal) return null;

    // Use live data from store to ensure updates (like progress slider) are reflected immediately
    const activeGoal = state.goals.find(g => g.id === goal.id) || goal;

    const area = state.areas.find(a => a.id === activeGoal.areaId);
    const metric = state.metricDefinitions.find(m => m.id === activeGoal.targetMetricId);

    // 30-Day Rule Logic
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
        return false; // Maintain not auto-completable usually
    };

    const isAchieved = metric && activeGoal.metricTargetValue !== undefined && activeGoal.metricCurrentValue !== undefined && activeGoal.metricCurrentValue !== null
        ? checkAchievement(activeGoal.metricCurrentValue, activeGoal.metricTargetValue, activeGoal.metricDirection)
        : false;



    const calculateProgress = (current: number, start: number, target: number) => {
        const total = Math.abs(target - start);
        if (total === 0) return 0;
        const diff = Math.abs(current - start);
        return Math.min(100, Math.max(0, Math.round((diff / total) * 100)));
    };

    const handleReflectAndFinish = async (reflection: string, rating: number, finalStatus: Goal['status'] = 'achieved') => {
        // Create journal entry or Note
        dispatch({
            type: 'ADD_NOTE',
            payload: {
                id: uuidv4(),
                userId: 'user',
                title: `Рефлексія: ${activeGoal.title}`,
                content: `### Рефлексія по цілі: ${activeGoal.title}\n\n**Результат**: ${finalStatus === 'achieved' ? "✅ Ціль успішно досягнуто!" : finalStatus === 'not_achieved' ? "⚠️ Ціль не досягнуто" : "🛑 Ціль зупинено"} (${activeGoal.metricCurrentValue || 0}/${activeGoal.metricTargetValue} ${metric?.unit})\n**Рейтинг**: ${rating}/5\n\n${reflection}`,
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
                progress: finalStatus === 'achieved' ? 100 : activeGoal.progress, // Only force 100% on success
                endDate: new Date().toISOString()
            }
        });

        toast.success("Ціль зафіксовано! Історія збережена.");
        onOpenChange(false);
    };

    // Manual Complete (Legacy/Tactical Only)
    const handleManualComplete = () => {
        setIsReflectionOpen(true);
    };

    const handleDelete = () => {
        if (confirm("Ви впевнені, що хочете видалити цю ціль? Цю дію неможливо скасувати.")) {
            dispatch({ type: 'DELETE_GOAL', payload: { id: activeGoal.id } });
            toast.success("Ціль видалено.");
            onOpenChange(false);
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
            <Dialog open={open} onOpenChange={(val) => { if (!val) setIsEditing(false); onOpenChange(val); }}>
                <DialogContent className="sm:max-w-[700px] h-[650px] p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white sm:rounded-xl ring-1 ring-slate-900/5 transition-all duration-200 flex flex-col">
                    <GoalCreationWizard
                        initialData={activeGoal}
                        onComplete={() => setIsEditing(false)}
                        onCancel={() => setIsEditing(false)}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95%] sm:max-w-2xl bg-white dark:bg-card border-none shadow-2xl rounded-2xl overflow-hidden p-0 gap-0 max-h-[90vh] overflow-y-auto">

                    <DialogTitle className="sr-only">Деталі цілі: {activeGoal.title}</DialogTitle>

                    {/* Header with Area Color */}
                    <div className={cn("h-32 relative", area?.color ? `bg-${area.color.split('-')[1]}-50 dark:bg-${area.color.split('-')[1]}-900/20` : "bg-slate-100 dark:bg-secondary")}>
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full bg-white/20 hover:bg-white/40 text-slate-700 dark:text-foreground backdrop-blur-sm">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Icon Badge */}
                        <div className="absolute -bottom-8 left-8 p-4 bg-white dark:bg-card rounded-2xl shadow-lg border border-slate-100 dark:border-border">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                activeGoal.type === 'vision' ? "bg-emerald-100 text-emerald-600" :
                                    activeGoal.type === 'strategic' ? "bg-amber-100 text-amber-600" :
                                        "bg-orange-100 text-orange-600"
                            )}>
                                <Target className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 px-8 pb-8 space-y-8">
                        {/* Title & Metadata */}
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground leading-tight">{activeGoal.title}</h2>
                                <Badge variant="outline" className={cn(
                                    "uppercase tracking-wider text-[10px] font-bold px-2 py-1 flex items-center gap-1.5 shrink-0",
                                    activeGoal.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                        activeGoal.status === 'paused' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                            "bg-slate-50 text-slate-600 border-slate-200"
                                )}>
                                    {activeGoal.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                                        activeGoal.status === 'paused' ? <PauseCircle className="w-3 h-3" /> :
                                            <Target className="w-3 h-3" />}
                                    {activeGoal.status === 'completed' ? 'Завершено' :
                                        activeGoal.status === 'paused' ? 'На паузі' : 'Активна'}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-muted-foreground">
                                {area && (
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("w-2 h-2 rounded-full", area.color)} />
                                        <span className="font-medium">{area.title}</span>
                                    </div>
                                )}
                                {activeGoal.deadline && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className={cn("w-4 h-4", isDeadlineMissed ? "text-red-500" : "text-slate-400")} />
                                        <span className={cn(isDeadlineMissed ? "text-red-500 font-bold" : "")}>
                                            {isDeadlineMissed ? "Дедлайн Пройшов: " : "Дедлайн: "}
                                            {format(new Date(activeGoal.deadline), 'dd MMM yyyy')}
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

                        {/* Subgoals / Steps Section (New) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                                    <ListChecks className="w-4 h-4 text-indigo-500" />
                                    Кроки та Підцілі
                                </h4>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5 border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300"
                                        disabled={isGeneratingBreakdown}
                                        onClick={() => {
                                            if (!HAS_AI_GOAL_BREAKDOWN) {
                                                setUpgradeContext({
                                                    title: "Структура - ключ до успіху",
                                                    description: "Більшість цілей не досягаються не через лінь, а через відсутність структури. Zynorvia AI розкладе цю ціль на реальні дії."
                                                });
                                                setShowUpgrade(true);
                                            } else {
                                                handleAIBreakdown();
                                            }
                                        }}
                                    >
                                        {isGeneratingBreakdown ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        {isGeneratingBreakdown ? "Думаю..." : "AI План"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5 bg-slate-100 dark:bg-secondary hover:bg-slate-200 text-slate-600 dark:text-muted-foreground"
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
                                        <Plus className="w-3 h-3" />
                                        Додати крок
                                    </Button>
                                </div>
                            </div>

                            {/* Subgoals List */}
                            <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden">
                                {activeGoal.subGoals && activeGoal.subGoals.length > 0 ? (
                                    <div className="divide-y divide-slate-100 dark:divide-border/50">
                                        {activeGoal.subGoals.map((sg) => (
                                            <div key={sg.id} className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-secondary/20 transition-colors group">
                                                <button
                                                    onClick={() => toggleSubgoal(sg.id)}
                                                    className={cn("shrink-0 transition-colors", sg.completed ? "text-emerald-500" : "text-slate-300 dark:text-slate-600 hover:text-emerald-400")}
                                                >
                                                    {sg.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                </button>
                                                <span className={cn("text-sm flex-1", sg.completed && "line-through text-muted-foreground decoration-slate-300")}>{sg.title}</span>
                                                <button
                                                    onClick={() => deleteSubgoal(sg.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
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
                                            className="h-9 text-sm bg-white dark:bg-card"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && addSubgoal()}
                                        />
                                        <Button size="sm" onClick={addSubgoal} disabled={!newSubgoalTitle.trim()} className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metrics Section (Strategic/Tactical-Metric) OR Manual Progress (Tactical-Manual) */}
                        {metric ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        Прогрес Метрики
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 p-0 hover:bg-transparent gap-1"
                                        onClick={() => {
                                            setSelectedMetric(metric);
                                            setUpdateDialogOpen(true);
                                        }}
                                    >
                                        Оновити <Edit className="w-3 h-3" />
                                    </Button>
                                    {isAchieved && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                            Ціль Досягнуто! 🚀
                                        </Badge>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-4 gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-slate-500 dark:text-muted-foreground">{metric.name}</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-foreground flex items-baseline gap-1 mt-1">
                                                {activeGoal.metricCurrentValue || 0}
                                                <span className="text-sm text-slate-400 font-normal">/ {activeGoal.metricTargetValue} {metric.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Progress value={activeGoal.progress} className="h-2.5" indicatorClassName={cn(isAchieved ? "bg-emerald-500" : "bg-primary")} />
                                    <div className="mt-2 text-right text-xs font-bold text-slate-500">{Math.round(activeGoal.progress)}% досягнуто</div>
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
                                        <span className={cn("text-xl font-bold", currentProgress === 100 ? "text-emerald-600" : "text-slate-900 dark:text-foreground")}>
                                            {Math.round(currentProgress)}%
                                        </span>
                                    </div>
                                    <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl p-5 shadow-sm space-y-4">
                                        <div className="relative pt-1">
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
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600 dark:accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-2 uppercase tracking-wider">
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

                        {/* Actions Footer */}
                        <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-border">
                            {/* Left Side: Management */}
                            <div className="flex gap-2">
                                {activeGoal.status !== 'completed' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                        disabled={!isModifiable}
                                        className={cn(!isModifiable && "opacity-50 cursor-not-allowed text-muted-foreground")}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Ред.
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleDelete}
                                    disabled={!isModifiable}
                                    className={cn("text-slate-400 hover:text-red-500", !isModifiable && "opacity-50 cursor-not-allowed")}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                {activeGoal.status !== 'completed' && (
                                    <Button variant="ghost" size="icon" onClick={handleStatusToggle} className="text-slate-400 hover:text-slate-600">
                                        {activeGoal.status === 'paused' ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                                    </Button>
                                )}
                            </div>

                            <div className="flex-1"></div>

                            {/* Right Side: Completion Action */}
                            {!['achieved', 'not_achieved', 'abandoned', 'completed'].includes(activeGoal.status) && (
                                <>
                                    {/* Vision: No complete button */}
                                    {isVision && (
                                        <div className="text-xs text-slate-400 italic px-2">
                                            Vision цілі не завершуються
                                        </div>
                                    )}

                                    {/* Strategic & Tactical: ALWAYS Show Complete Button if active */}
                                    {!isVision && (
                                        <Button
                                            onClick={() => setIsReflectionOpen(true)}
                                            className={cn(
                                                "text-white shadow-lg animate-pulse-slow",
                                                isAchieved || currentProgress >= 100
                                                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                                            )}
                                        >
                                            {isAchieved || currentProgress >= 100 ? <Trophy className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                            {isAchieved || currentProgress >= 100 ? "Зафіксувати Успіх" : "Завершити..."}
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* 30-Day Warning */}
                        {!isModifiable && goal.status !== 'completed' && (
                            <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2 rounded-lg border border-amber-100 dark:border-amber-900/50 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Редагування заблоковано (30+ днів). Лише оновлення статусу.</span>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <GoalReflectionDialog
                goal={activeGoal}
                isOpen={isReflectionOpen}
                onClose={() => setIsReflectionOpen(false)}
                onConfirm={handleReflectAndFinish}
            />
            {/* The following lines were likely intended for an UpgradeModal component, but were malformed.
                Removing the extra closing tag as per instruction. The props themselves are still
                syntactically incorrect outside of a component, but the instruction was specific. */}
            {/* title={upgradeContext.title || "Відкрийте більше можливостей"}
            description={upgradeContext.description || "Ця функція доступна у Pro-версії. Оновіться, щоб зняти обмеження."} */}

            {metric && (
                <MetricUpdateDialog
                    open={updateDialogOpen}
                    onOpenChange={setUpdateDialogOpen}
                    metric={metric}
                    entries={state.metricEntries.filter(e => e.metricId === metric.id)}
                    color={area?.color}
                />
            )}
        </>
    );
}
