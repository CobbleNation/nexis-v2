'use client';

import { useData } from '@/lib/store';
import { Action } from '@/types';
import { Check, Calendar, Activity, Zap, MoreHorizontal, Clock, ArrowUpRight, Folder, Search, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ItemEditDialog } from '@/components/shared/ItemEditDialog';

interface ActionCardProps {
    task: Action;
    onComplete: () => void;
    areas: any[]; // Using any[] to match usage, ideally strict type
}

export function ActionCard({ task, onComplete, areas }: ActionCardProps) {
    const { state, dispatch } = useData();
    const area = areas.find(a => a.id === task.areaId);
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState("");

    const handleSubtaskToggle = (subtaskId: string) => {
        if (!task.subtasks) return;
        const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        dispatch({ type: 'UPDATE_ACTION', payload: { ...task, subtasks: updatedSubtasks } });
    };

    const handleDefer = () => {
        dispatch({ type: 'UPDATE_ACTION', payload: { ...task, status: 'deferred' } });
        toast.info("Завдання відкладено", { description: "Можете знайти його у вкладці 'Відкладені'" });
    };

    const handleRestore = () => {
        dispatch({ type: 'UPDATE_ACTION', payload: { ...task, status: 'pending' } });
        toast.success("Завдання повернуто в роботу");
    };

    const handleMoveToProject = (project: any) => {
        dispatch({
            type: 'UPDATE_ACTION', payload: {
                ...task,
                projectId: project.id,
                areaId: project.areaId || 'general'
            }
        });
        toast.success(`Переміщено до проекту: ${project.title}`);
        setIsMoveOpen(false);
    };

    const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isOverdue = !task.completed && task.status !== 'canceled' && task.status !== 'deferred' && !!task.date && task.date < todayStr;

    const handleDelete = () => {
        dispatch({ type: 'DELETE_ACTION', payload: { id: task.id } });
        toast.info("Завдання видалено");
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group flex flex-col p-4 bg-white dark:bg-card border rounded-2xl transition-all shadow-sm",
                task.completed ? "border-slate-100 dark:border-border bg-slate-50/50 dark:bg-secondary/20" :
                    isOverdue ? "border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 hover:border-red-300 dark:hover:border-red-800" :
                        "border-slate-200 dark:border-border hover:border-orange-200 dark:hover:border-primary/50 hover:shadow-md"
            )}
        >
            <div className="flex items-start gap-4">
                <button
                    onClick={isOverdue ? undefined : onComplete}
                    disabled={isOverdue}
                    className={cn(
                        "h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 mt-0.5",
                        task.completed
                            ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200/50"
                            : isOverdue
                                ? "border-red-200 bg-red-50/50 text-red-300 cursor-not-allowed"
                                : "border-slate-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-primary hover:bg-orange-50 dark:hover:bg-primary/10 text-orange-600 dark:text-primary"
                    )}
                >
                    {task.completed ? <Check className="w-4 h-4" /> : isOverdue ? <Clock className="w-3 h-3" /> : null}
                </button>

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <div
                            className="flex-1 min-w-0 space-y-1 cursor-pointer"
                            onClick={() => setIsEditOpen(true)}
                        >
                            {/* Title & Priority */}
                            <div className="flex items-start gap-2">
                                <p className={cn("text-base font-medium truncate leading-tight text-slate-900 dark:text-foreground group-hover:text-orange-600 dark:group-hover:text-primary transition-colors", task.completed && "line-through text-slate-400 dark:text-muted-foreground")}>
                                    {task.title}
                                </p>
                                {task.priority === 'high' && (
                                    <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5" title="High Priority" />
                                )}
                            </div>

                            {/* Description Preview */}
                            {task.description && !task.completed && (
                                <p className="text-xs text-slate-500 dark:text-muted-foreground line-clamp-2 leading-relaxed">
                                    {task.description}
                                </p>
                            )}

                            {/* Metadata Chips */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {area && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-muted-foreground font-medium bg-slate-50 dark:bg-secondary px-2 py-1 rounded-md border border-slate-100 dark:border-border">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", area.color)} />
                                        {area.title}
                                    </div>
                                )}

                                {/* Start Time - Requested Feature */}
                                {task.startTime && (
                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-muted-foreground bg-slate-100 dark:bg-secondary px-2 py-1 rounded-md">
                                        <Clock className="w-3 h-3 text-slate-400 dark:text-muted-foreground/60" />
                                        {task.startTime}
                                    </div>
                                )}

                                {task.duration && (
                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-muted-foreground bg-slate-100 dark:bg-secondary px-2 py-1 rounded-md">
                                        <span className="text-xs">⏱️</span>
                                        {task.duration >= 60 ? `${Math.floor(task.duration / 60)}h ${task.duration % 60 > 0 ? task.duration % 60 + 'm' : ''}` : `${task.duration}m`}
                                    </div>
                                )}

                                {task.isFocus && (
                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                        <Zap className="w-3 h-3" /> Focus
                                    </div>
                                )}

                                {totalSubtasks > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground bg-slate-100 dark:bg-secondary px-1.5 py-0.5 rounded-md">
                                        {completedSubtasks}/{totalSubtasks}
                                    </div>
                                )}

                                {isOverdue && (
                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-800/50">
                                        Прострочено
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-slate-300 hover:text-slate-600 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="gap-2">
                                    <Pencil className="w-4 h-4" />
                                    Редагувати
                                </DropdownMenuItem>
                                {task.status === 'deferred' ? (
                                    <DropdownMenuItem onClick={handleRestore} className="gap-2 text-orange-600 focus:text-orange-700">
                                        <ArrowUpRight className="w-4 h-4" />
                                        Повернути в Активні
                                    </DropdownMenuItem>
                                ) : (
                                    !task.completed && (
                                        <DropdownMenuItem onClick={handleDefer} className="gap-2 text-slate-600 dark:text-slate-200 focus:text-slate-800 dark:focus:text-white">
                                            <Clock className="w-4 h-4" />
                                            Відкласти (Deferred)
                                        </DropdownMenuItem>
                                    )
                                )}
                                <DropdownMenuItem onClick={() => setIsMoveOpen(true)} className="gap-2 text-slate-600 dark:text-slate-200 focus:text-slate-800 dark:focus:text-white">
                                    <Folder className="w-4 h-4" />
                                    Додати до проекту
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        // We can use the dialog's delete logic by opening it, 
                                        // or we could dispatch delete directly here. 
                                        // For safety and consistency (Edit/Delete in one place), opening dialog is okay, 
                                        // but "Delete" specific action implies immediate or confirmation.
                                        // Let's open the dialog for now as requested "Edit OR Delete".
                                        setIsEditOpen(true);
                                    }}
                                    className="gap-2 text-rose-600 focus:text-rose-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Видалити
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Overdue Quick Actions */}
                        {isOverdue && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button title="Відновити (Перепланувати)" onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button title="Видалити" onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Edit/Delete Dialog */}
                    <ItemEditDialog
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        itemId={task.id}
                        type="task"
                    />

                    {/* Move to Project Modal */}
                    <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
                        <DialogContent className="w-[95%] sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Оберіть проект</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={projectSearch}
                                        onChange={(e) => setProjectSearch(e.target.value)}
                                        placeholder="Пошук проектів..."
                                        className="pl-9 bg-slate-50 dark:bg-secondary/30 border-slate-200 dark:border-border"
                                    />
                                </div>
                                <div className="space-y-2 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {state.projects
                                        .filter(p =>
                                            (p.status === 'active' || p.status === 'paused' || !p.status) &&
                                            p.title.toLowerCase().includes(projectSearch.toLowerCase())
                                        )
                                        .map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleMoveToProject(p)}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-secondary/30 transition-colors text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                    <Folder className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-slate-700 dark:text-foreground truncate">{p.title}</div>
                                                    <div className="text-[10px] text-slate-400 dark:text-muted-foreground truncate">{state.areas.find(a => a.id === p.areaId)?.title}</div>
                                                </div>
                                                <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                            </button>
                                        ))
                                    }
                                    {state.projects.filter(p => (p.status === 'active' || p.status === 'paused' || !p.status) && p.title.toLowerCase().includes(projectSearch.toLowerCase())).length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            Проектів не знайдено.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Subtasks List */}
                    {task.subtasks && task.subtasks.length > 0 && !task.completed && (
                        <div className="mt-3 space-y-1 pl-1">
                            {/* Progress Bar */}
                            <div className="h-1 w-full bg-slate-100 dark:bg-secondary rounded-full mb-2 overflow-hidden">
                                <div className="h-full bg-orange-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>

                            <div className="grid gap-1.5">
                                {task.subtasks.map(st => (
                                    <div key={st.id} className="flex items-center gap-2.5 group/sub">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSubtaskToggle(st.id); }}
                                            className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                st.completed ? "bg-orange-400 border-orange-400 text-white" : "border-slate-300 dark:border-slate-600 hover:border-orange-400 bg-white dark:bg-secondary/20"
                                            )}
                                        >
                                            {st.completed && <Check className="w-3 h-3" />}
                                        </button>
                                        <span className={cn("text-sm transition-colors", st.completed ? "text-slate-400 dark:text-muted-foreground line-through" : "text-slate-600 dark:text-foreground")}>
                                            {st.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
