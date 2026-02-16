'use client';

import { useData } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Folder, Target, Plus, CheckCircle2, Clock, PauseCircle, Activity, ArrowDownToLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionCard } from "@/components/actions/ActionCard";
import { useState } from "react";
import { Action } from "@/types";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProjectPage() {
    const { id } = useParams();
    const router = useRouter();
    const { state, dispatch } = useData();
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importSearch, setImportSearch] = useState("");

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

    return (
        <div className="flex flex-col h-full bg-slate-50/30 dark:bg-background overflow-y-auto">
            {/* Header */}
            <div className="bg-white dark:bg-background/95 border-b border-slate-100 dark:border-border p-6 sticky top-0 z-10 shadow-sm/50 dark:shadow-none backdrop-blur-sm bg-white/80 dark:bg-background/80">
                <div className="max-w-4xl mx-auto space-y-4">
                    <button onClick={() => router.push('/goals?tab=projects')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        До списку проектів
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground tracking-tight flex items-center gap-3">
                                <Folder className="w-6 h-6 text-blue-500 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/20" />
                                {project.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm">
                                {area && (
                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-secondary text-slate-600 dark:text-muted-foreground font-medium">
                                        <div className={cn("w-2 h-2 rounded-full", area.color)} />
                                        {area.title}
                                    </span>
                                )}
                                <span className={cn(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-xs uppercase tracking-wide",
                                    project.status === 'active' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                        project.status === 'completed' ? "bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground" :
                                            "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                )}>
                                    {project.status === 'active' && <Activity className="w-3 h-3" />}
                                    {project.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                    {project.status === 'paused' && <PauseCircle className="w-3 h-3" />}
                                    {project.status === 'active' ? 'Активний' : project.status === 'completed' ? 'Завершений' : 'На паузі'}
                                </span>
                                {project.deadline && (
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(project.deadline).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={handleToggleProjectStatus}
                            variant={project.status === 'completed' ? "outline" : "default"}
                            className={cn(
                                "shrink-0",
                                project.status === 'active' && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 dark:shadow-none"
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6 space-y-8">

                    {/* Description */}
                    {project.description && (
                        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-3">Опис</h3>
                            <p className="text-slate-700 dark:text-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
                        </div>
                    )}

                    {/* Linked Goals (Context) */}
                    {linkedGoals.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest px-1">Контекст (Цілі)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {linkedGoals.map(goal => (
                                    <div key={goal.id} className="flex items-center gap-3 p-3 bg-white dark:bg-card border border-slate-100 dark:border-border rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-slate-700 dark:text-foreground text-sm line-clamp-1">{goal.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Завдання проекту
                            </h3>
                            <span className="text-xs font-medium text-slate-400 dark:text-muted-foreground bg-slate-100 dark:bg-secondary px-2 py-1 rounded-full">{activeTasks.length} active</span>
                        </div>

                        {/* Add Task Inline & Import */}
                        <div className="flex gap-3">
                            <div className="flex-1 flex gap-3 items-center p-2 bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-secondary flex items-center justify-center shrink-0 text-slate-400 dark:text-muted-foreground">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <Input
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                    placeholder="Додати нове завдання..."
                                    className="border-none shadow-none focus-visible:ring-0 h-auto p-0 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 text-foreground"
                                />
                                <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="h-8 w-8 p-0 rounded-lg shrink-0">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <Button variant="outline" onClick={() => setIsImportOpen(true)} className="h-auto bg-white dark:bg-card border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900">
                                <ArrowDownToLine className="w-4 h-4 mr-2" />
                                Імпорт
                            </Button>
                        </div>

                        {/* Task List */}
                        <div className="space-y-3">
                            {activeTasks.length === 0 && completedTasks.length === 0 && (
                                <div className="text-center py-12 text-slate-400 text-sm italic">
                                    В цьому проекті ще немає завдань. Створіть перше!
                                </div>
                            )}

                            {activeTasks.map(task => (
                                <ActionCard key={task.id} task={task} onComplete={() => completeTask(task)} areas={state.areas} />
                            ))}

                            {completedTasks.length > 0 && (
                                <>
                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-border"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase text-slate-400 dark:text-muted-foreground font-bold bg-slate-50/30 dark:bg-background/20 px-2 rounded-lg">Завершені ({completedTasks.length})</div>
                                    </div>
                                    <div className="opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                        {completedTasks.map(task => (
                                            <ActionCard key={task.id} task={task} onComplete={() => completeTask(task)} areas={state.areas} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Import Modal */}
                    <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Імпортувати завдання</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={importSearch}
                                        onChange={(e) => setImportSearch(e.target.value)}
                                        placeholder="Пошук завдань..."
                                        className="pl-9 bg-slate-50"
                                    />
                                </div>
                                <div className="space-y-2 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {state.actions
                                        .filter(a =>
                                            a.type === 'task' &&
                                            !a.completed &&
                                            !a.projectId &&
                                            a.title.toLowerCase().includes(importSearch.toLowerCase())
                                        )
                                        .map(task => (
                                            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-secondary/50 transition-colors group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={cn("w-2 h-2 rounded-full shrink-0", state.areas.find(a => a.id === task.areaId)?.color || "bg-slate-300 dark:bg-slate-700")} />
                                                    <span className="truncate font-medium text-sm text-slate-700 dark:text-foreground">{task.title}</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleImportTask(task)}
                                                    className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> Додати
                                                </Button>
                                            </div>
                                        ))
                                    }
                                    {state.actions.filter(a => a.type === 'task' && !a.completed && !a.projectId).length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            Немає доступних завдань для імпорту.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
