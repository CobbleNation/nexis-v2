'use client';

import { useData } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Calendar, Folder, Target, Plus, CheckCircle2,
    Clock,
    MoreVertical,
    Activity,
    PauseCircle,
    Layers,
    ArrowDownToLine,
    Search,
    Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionCard } from "@/components/actions/ActionCard";
import { useState } from "react";
import { Action } from "@/types";
import { toast } from "sonner";
import { ProjectAssistant } from "@/components/projects/ProjectAssistant";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart } from 'lucide-react';

export default function ProjectPage() {
    const { id } = useParams();
    const router = useRouter();
    const { state, dispatch } = useData();
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importSearch, setImportSearch] = useState("");
    const [metricSearch, setMetricSearch] = useState('');
    const [isMetricAddOpen, setIsMetricAddOpen] = useState(false);

    const project = state.projects.find(p => p.id === id);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Проект не знайдено</p>
                <Button variant="link" onClick={() => router.push('/goals')}>Повернутися до списку</Button>
            </div>
        );
    }

    const area = state.areas.find(a => a.id === project.areaId);

    // Parse goalIds if it's a string (though it should be array in types, runtime might be string from DB)
    let linkedGoalIds: string[] = [];
    if (Array.isArray(project.goalIds)) {
        linkedGoalIds = project.goalIds;
    } else if (typeof project.goalIds === 'string') {
        try {
            linkedGoalIds = JSON.parse(project.goalIds);
        } catch (e) { linkedGoalIds = [] }
    }

    const linkedGoals = state.goals.filter(g => linkedGoalIds.includes(g.id));

    // Tasks: active and completed filtered by projectId
    const projectTasks = state.actions.filter(a => a.projectId === project.id && (a.type === 'task' || a.type === 'routine_instance'));

    const activeTasks = projectTasks.filter(a => !a.completed).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const completedTasks = projectTasks.filter(a => a.completed).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Action = {
            id: Date.now().toString(),
            userId: state.user.name !== 'User' ? 'current-user' : 'user',
            title: newTaskTitle,
            type: 'task',
            areaId: project.areaId || 'general',
            projectId: project.id,
            status: 'pending',
            completed: false,
            priority: 'medium',
            date: new Date().toISOString().split('T')[0], // Default to today for visibility in Focus
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'ADD_ACTION', payload: newTask });
        setNewTaskTitle("");
        toast.success("Завдання додано до проекту");
    };

    const completeTask = (task: Action) => {
        dispatch({ type: 'TOGGLE_ACTION', payload: { id: task.id } });
        toast.success("Завдання виконано!");
    };

    const handleImportTask = (task: Action) => {
        const updatedTask = {
            ...task,
            projectId: project.id,
            areaId: project.areaId || 'general' // Sync area with project
        };
        dispatch({ type: 'UPDATE_ACTION', payload: updatedTask });
        toast.success("Завдання імпортовано до проекту");
        setIsImportOpen(false);
    };

    const handleToggleProjectStatus = () => {
        const newStatus: 'active' | 'completed' = project.status === 'completed' ? 'active' : 'completed';
        const updated = { ...project, status: newStatus };
        dispatch({ type: 'UPDATE_PROJECT', payload: updated });
        toast.success(newStatus === 'completed' ? "Проект завершено!" : "Проект відновлено!");
    };

    const handleAddMetric = (metricId: string) => {
        const currentMetrics = project.metricIds || [];
        if (!currentMetrics.includes(metricId)) {
            const updated = { ...project, metricIds: [...currentMetrics, metricId] };
            dispatch({ type: 'UPDATE_PROJECT', payload: updated });
            toast.success("Метрику додано до проекту");
        }
        setIsMetricAddOpen(false);
    };

    const handleRemoveMetric = (metricId: string) => {
        const currentMetrics = project.metricIds || [];
        const updated = { ...project, metricIds: currentMetrics.filter(id => id !== metricId) };
        dispatch({ type: 'UPDATE_PROJECT', payload: updated });
        toast.success("Метрику видалено з проекту");
    };

    // Analytics Calculations
    const totalTasks = projectTasks.length;
    const taskProgress = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Goal Progress
    const totalGoals = linkedGoals.length;
    const goalProgressSum = linkedGoals.reduce((sum, g) => sum + (g.progress || 0), 0);
    const goalProgressAvg = totalGoals > 0 ? goalProgressSum / totalGoals : 0;

    // Combined Progress
    let completionPercentage = 0;
    const hasItems = totalTasks > 0 || totalGoals > 0;

    if (totalTasks > 0 && totalGoals > 0) {
        completionPercentage = Math.round((taskProgress + goalProgressAvg) / 2);
    } else if (totalTasks > 0) {
        completionPercentage = Math.round(taskProgress);
    } else if (totalGoals > 0) {
        completionPercentage = Math.round(goalProgressAvg);
    }

    const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;

    // Linked Metrics
    const linkedMetrics = state.metricDefinitions.filter(m => (project.metricIds || []).includes(m.id));

    return (
        <div className="flex flex-col h-full bg-slate-50/30 dark:bg-background overflow-y-auto">
            {/* Header */}
            <div className="bg-white dark:bg-background/95 border-b border-slate-100 dark:border-border p-6 sticky top-0 z-10 shadow-sm/50 dark:shadow-none backdrop-blur-sm bg-white/80 dark:bg-background/80">
                <div className="max-w-[1600px] mx-auto space-y-4">
                    <button onClick={() => router.push('/projects')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        До списку проектів
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-foreground tracking-tight flex items-center gap-3">
                                <Folder className="w-8 h-8 text-blue-500 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/20" />
                                {project.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm">
                                {area && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-secondary text-slate-600 dark:text-muted-foreground font-medium border border-slate-200 dark:border-border">
                                        <div className={cn("w-2 h-2 rounded-full", area.color)} />
                                        {area.title}
                                    </span>
                                )}
                                <span className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs uppercase tracking-wide border",
                                    project.status === 'active' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" :
                                        project.status === 'completed' ? "bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground border-slate-200 dark:border-border" :
                                            "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                                )}>
                                    {project.status === 'active' && <Activity className="w-3" />}
                                    {project.status === 'completed' && <CheckCircle2 className="w-3" />}
                                    {project.status === 'paused' && <PauseCircle className="w-3" />}
                                    {project.status === 'planned' && <Calendar className="w-3" />}
                                    {project.status === 'active' ? 'Активний' : project.status === 'completed' ? 'Завершений' : project.status === 'planned' ? 'Запланований' : 'На паузі'}
                                </span>
                                {project.startDate && (
                                    <span className="flex items-center gap-1.5 text-slate-500 bg-blue-50 dark:bg-blue-500/10 px-2 pl-2.5 pr-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 text-xs">
                                        <Calendar className="w-3 h-3 text-blue-500" />
                                        Start: {new Date(project.startDate).toLocaleDateString()}
                                    </span>
                                )}
                                {project.deadline && (
                                    <span className={cn(
                                        "flex items-center gap-1.5 px-2 pl-2.5 pr-3 py-1 rounded-full border text-xs",
                                        isOverdue ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 pixel-font" : "bg-slate-50 dark:bg-secondary/50 text-slate-500 border-slate-200 dark:border-border"
                                    )}>
                                        <Clock className="w-3 h-3" />
                                        Due: {new Date(project.deadline).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleToggleProjectStatus}
                                variant={project.status === 'completed' ? "outline" : "default"}
                                className={cn(
                                    "shrink-0 rounded-full px-6 font-medium shadow-lg hover:shadow-xl transition-all",
                                    project.status === 'active' && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 dark:shadow-none"
                                )}
                            >
                                {project.status === 'completed' ? (
                                    <>
                                        <Activity className="w-4 h-4 mr-2" /> Відновити
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Завершити
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Left Column: Tasks & Details */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Description Card */}
                        {project.description && (
                            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-blue-500 rounded-full" /> Опис
                                </h3>
                                <p className="text-slate-700 dark:text-foreground leading-relaxed whitespace-pre-wrap text-base">{project.description}</p>
                            </div>
                        )}

                        {/* AI Assistant */}
                        <ProjectAssistant project={project} areaName={area?.title} />

                        {/* Tasks Section */}
                        <div className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-border shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-6 border-b border-slate-100 dark:border-border flex items-center justify-between bg-white dark:bg-card sticky top-0 z-10">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    Завдання
                                    <span className="ml-2 text-xs font-medium text-slate-500 dark:text-muted-foreground bg-slate-100 dark:bg-secondary px-2.5 py-0.5 rounded-full">{activeTasks.length}</span>
                                </h3>

                                <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-2">
                                    <ArrowDownToLine className="w-4 h-4" />
                                    Імпорт
                                </Button>
                            </div>

                            <div className="p-4 bg-slate-50/50 dark:bg-secondary/10 flex-1">
                                {/* Add Task Input */}
                                <div className="mb-6 flex gap-2">
                                    <div className="flex-1 flex gap-3 items-center p-3 bg-white dark:bg-background rounded-2xl border border-slate-200 dark:border-border shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <Input
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                            placeholder="Додати нове завдання..."
                                            className="border-none shadow-none focus-visible:ring-0 h-auto p-0 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 text-foreground"
                                        />
                                        <Button size="icon" onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="h-8 w-8 rounded-lg shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="space-y-3">
                                    {activeTasks.length === 0 && completedTasks.length === 0 && (
                                        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-secondary/50 flex items-center justify-center mb-4">
                                                <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-sm font-medium">Ще немає завдань</p>
                                            <p className="text-xs mt-1">Додайте перше завдання, щоб почати роботу</p>
                                        </div>
                                    )}

                                    {activeTasks.map(task => (
                                        <ActionCard key={task.id} task={task} onComplete={() => completeTask(task)} areas={state.areas} />
                                    ))}

                                    {completedTasks.length > 0 && (
                                        <>
                                            <div className="relative py-6">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-border dashed"></div></div>
                                                <div className="relative flex justify-center text-xs uppercase text-slate-400 dark:text-muted-foreground font-bold bg-[#fafbfc] dark:bg-[#020817] px-3 rounded-lg z-10">
                                                    Завершені ({completedTasks.length})
                                                </div>
                                            </div>
                                            <div className="opacity-60 hover:opacity-100 transition-all duration-300">
                                                {completedTasks.map(task => (
                                                    <ActionCard key={task.id} task={task} onComplete={() => completeTask(task)} areas={state.areas} />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Analytics & Metadata */}
                    <div className="space-y-6">

                        {/* Analytics Card */}
                        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Аналітика
                            </h3>

                            {hasItems ? (
                                <div className="space-y-6">
                                    {/* Completion Circle */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-bold text-slate-900 dark:text-foreground">{completionPercentage}%</span>
                                            <span className="text-xs text-slate-500 font-medium">Виконано</span>
                                        </div>
                                        <div className="relative w-16 h-16">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-100 dark:text-secondary" />
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray={175.93} strokeDashoffset={175.93 - (175.93 * completionPercentage) / 100} className="text-blue-500 transition-all duration-1000 ease-out" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-border/50">
                                        <div className="bg-slate-50 dark:bg-secondary/20 p-3 rounded-xl">
                                            <div className="text-2xl font-bold text-slate-700 dark:text-foreground">{completedTasks.length}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ready</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-secondary/20 p-3 rounded-xl">
                                            <div className="text-2xl font-bold text-slate-700 dark:text-foreground">{activeTasks.length}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pending</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center justify-center text-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-secondary flex items-center justify-center text-slate-400">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-slate-700 dark:text-foreground">Немає даних</p>
                                        <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">Додайте завдання або метрику</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-border/50">
                                {daysLeft !== null && (
                                    <div className={cn("p-3 rounded-xl flex items-center gap-3", isOverdue ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                                        <Clock className="w-5 h-5" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase opacity-80">
                                                {isOverdue ? "Протерміновано" : "Залишилось часу"}
                                            </span>
                                            <span className="font-bold">
                                                {Math.abs(daysLeft)} днів
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Linked Goals */}
                        {linkedGoals.length > 0 && (
                            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Цілі
                                </h3>
                                <div className="space-y-3">
                                    {linkedGoals.map(goal => (
                                        <div key={goal.id} className="group p-3 hover:bg-slate-50 dark:hover:bg-secondary/30 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-border transition-all cursor-pointer" onClick={() => router.push('/goals')}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                    <Target className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-sm text-slate-700 dark:text-foreground">{goal.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metrics (Enhancement) */}
                        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Метрики
                                </h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-500" onClick={() => setIsMetricAddOpen(true)}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {linkedMetrics.length > 0 ? (
                                <div className="space-y-3">
                                    {linkedMetrics.map(metric => (
                                        <div key={metric.id} className="group p-3 bg-slate-50 dark:bg-secondary/20 rounded-xl border border-slate-100 dark:border-border flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-foreground">{metric.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 bg-white dark:bg-card px-2 py-0.5 rounded-md border border-slate-100 dark:border-border shadow-sm">{metric.unit}</span>
                                                <button
                                                    onClick={() => handleRemoveMetric(metric.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 dark:border-border rounded-xl">
                                    Немає пов'язаних метрик.
                                    <br />
                                    <Button variant="link" size="sm" onClick={() => setIsMetricAddOpen(true)} className="text-blue-500 mt-1 h-auto p-0">
                                        Додати метрику
                                    </Button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Import Modal */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Імпортувати завдання</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                value={importSearch}
                                onChange={(e) => setImportSearch(e.target.value)}
                                placeholder="Пошук завдань за назвою або сферою..."
                                className="pl-9 bg-slate-50 dark:bg-secondary/20"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                            {(() => {
                                const filteredTasks = state.actions.filter(a => {
                                    if (a.type !== 'task' || a.completed || a.projectId) return false;

                                    const searchLower = importSearch.toLowerCase();
                                    const matchesTitle = a.title.toLowerCase().includes(searchLower);
                                    const area = state.areas.find(ar => ar.id === a.areaId);
                                    const matchesArea = area?.title.toLowerCase().includes(searchLower);

                                    return matchesTitle || matchesArea;
                                });

                                if (filteredTasks.length === 0) {
                                    return (
                                        <div className="text-center py-12 text-slate-400 text-sm">
                                            Не знайдено доступних завдань для імпорту.
                                        </div>
                                    );
                                }

                                // Group by Area
                                const tasksByArea: Record<string, typeof filteredTasks> = {};
                                filteredTasks.forEach(task => {
                                    const areaId = task.areaId || 'unassigned';
                                    if (!tasksByArea[areaId]) tasksByArea[areaId] = [];
                                    tasksByArea[areaId].push(task);
                                });

                                return Object.entries(tasksByArea).map(([areaId, tasks]) => {
                                    const area = state.areas.find(a => a.id === areaId);
                                    return (
                                        <div key={areaId} className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 sticky top-0 bg-white dark:bg-background py-2 z-10">
                                                <span className={cn("w-2 h-2 rounded-full", area?.color || "bg-slate-300")} />
                                                {area?.title || 'Без сфери'}
                                                <span className="text-[10px] bg-slate-100 dark:bg-secondary px-1.5 py-0.5 rounded-full ml-auto text-slate-400">
                                                    {tasks.length}
                                                </span>
                                            </h4>

                                            <div className="space-y-2">
                                                {tasks.map(task => (
                                                    <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-secondary/30 transition-all group">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className={cn("w-1 h-8 rounded-full shrink-0", area?.color || "bg-slate-300")} />
                                                            <div className="flex flex-col overflow-hidden">
                                                                <span className="truncate font-medium text-sm text-slate-700 dark:text-foreground">{task.title}</span>
                                                                {task.description && (
                                                                    <span className="truncate text-xs text-slate-400">{task.description}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleImportTask(task)}
                                                            className="opacity-0 group-hover:opacity-100 text-primary hover:text-primary hover:bg-primary/5 transition-opacity"
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" /> Додати
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </DialogContent>

            </Dialog>

            {/* Add Metric Modal */}
            <Dialog open={isMetricAddOpen} onOpenChange={setIsMetricAddOpen}>
                <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-background">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-border bg-white dark:bg-card shrink-0">
                        <DialogTitle>Додати метрику</DialogTitle>
                        <div className="relative mt-2">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={metricSearch}
                                onChange={(e) => setMetricSearch(e.target.value)}
                                placeholder="Пошук метрик за назвою..."
                                className="pl-9 bg-slate-50 dark:bg-secondary/20"
                            />
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {(() => {
                            // Filter Metrics
                            const availableMetrics = state.metricDefinitions.filter(m => {
                                // Exclude already linked
                                if ((project.metricIds || []).includes(m.id)) return false;

                                // Search Filter
                                const searchLower = metricSearch.toLowerCase();
                                const matchesName = m.name.toLowerCase().includes(searchLower);
                                const area = state.areas.find(a => a.id === m.areaId);
                                const matchesArea = area?.title.toLowerCase().includes(searchLower);

                                return matchesName || matchesArea;
                            });

                            if (availableMetrics.length === 0) {
                                return (
                                    <div className="text-center py-12 text-slate-400 text-sm">
                                        Не знайдено доступних метрик.
                                    </div>
                                );
                            }

                            // Group by Area
                            const metricsByArea: Record<string, typeof availableMetrics> = {};
                            availableMetrics.forEach(m => {
                                const areaId = m.areaId || 'unassigned';
                                if (!metricsByArea[areaId]) metricsByArea[areaId] = [];
                                metricsByArea[areaId].push(m);
                            });

                            return Object.entries(metricsByArea).map(([areaId, metrics]) => {
                                const area = state.areas.find(a => a.id === areaId);
                                return (
                                    <div key={areaId} className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 sticky top-0 bg-slate-50 dark:bg-background py-2 z-10 backdrop-blur-sm">
                                            <span className={cn("w-2 h-2 rounded-full", area?.color || "bg-slate-300")} />
                                            {area?.title || 'Загальні'}
                                            <span className="text-[10px] bg-slate-200 dark:bg-secondary px-1.5 py-0.5 rounded-full ml-auto text-slate-500">
                                                {metrics.length}
                                            </span>
                                        </h4>
                                        <div className="space-y-2">
                                            {metrics.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => handleAddMetric(m.id)}
                                                    className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-secondary/20 transition-all flex items-center justify-between group shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2 rounded-lg bg-slate-50 dark:bg-secondary/40 text-slate-500 group-hover:text-blue-500 transition-colors")}>
                                                            <Activity className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm text-slate-700 dark:text-foreground">{m.name}</div>
                                                            {m.unit && <div className="text-[10px] font-bold uppercase text-slate-400">{m.unit}</div>}
                                                        </div>
                                                    </div>
                                                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );

}
