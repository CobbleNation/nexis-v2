'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // Added Label import
import { Calendar as CalendarIcon, Trash2, CheckCircle2, Save, X, Clock, Pencil, Eye, CheckCheck, Tag, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/store';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Action, Project, Note, Goal, AppEvent, Routine } from '@/types';

interface ItemEditDialogProps {
    itemId: string | null;
    type: 'task' | 'project' | 'note' | 'goal' | 'event' | 'routine';
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ItemEditDialog({ itemId, type, open, onOpenChange }: ItemEditDialogProps) {
    const { state, dispatch } = useData();
    const [formData, setFormData] = useState<any>({});
    const [isConfirmDelete, setIsConfirmDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (open && itemId) {
            let item: any;
            if (type === 'task') item = state.actions.find(t => t.id === itemId);
            else if (type === 'project') item = state.projects.find(p => p.id === itemId);
            else if (type === 'note') item = state.notes.find(n => n.id === itemId);
            else if (type === 'goal') item = state.goals.find(g => g.id === itemId);
            else if (type === 'event') item = state.events.find(e => e.id === itemId);
            else if (type === 'routine') item = state.routines.find(r => r.id === itemId);

            if (item) {
                const formattedItem = { ...item };
                if (formattedItem.date) formattedItem.date = formattedItem.date.split('T')[0];
                if (formattedItem.deadline) formattedItem.deadline = formattedItem.deadline.split('T')[0];
                setFormData(formattedItem);
            } else {
                setFormData({});
            }
            // Always start in preview/read mode
            setIsEditing(false);
        }
    }, [open, itemId, type, state]);

    const handleSave = () => {
        if (!itemId) return;

        try {
            if (type === 'task') {
                const action = state.actions.find(a => a.id === itemId);
                if (action) {
                    const updates = { ...action, ...formData };
                    // Ensure specific fields are correctly typed
                    if (updates.duration) updates.duration = parseInt(updates.duration.toString());
                    dispatch({ type: 'UPDATE_ACTION', payload: updates });
                    toast.success('Завдання оновлено');
                }
            } else if (type === 'project') {
                const project = state.projects.find(p => p.id === itemId);
                if (project) {
                    dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, ...formData } });
                    toast.success('Проект оновлено');
                }
            } else if (type === 'note') {
                const note = state.notes.find(n => n.id === itemId);
                if (note) {
                    dispatch({ type: 'UPDATE_NOTE', payload: { ...note, ...formData } });
                    toast.success('Нотатку оновлено');
                }
            } else if (type === 'goal') {
                const goal = state.goals.find(g => g.id === itemId);
                if (goal) {
                    dispatch({ type: 'UPDATE_GOAL', payload: { ...goal, ...formData } });
                    toast.success('Ціль оновлено');
                }
            } else if (type === 'event') {
                const event = state.events.find(e => e.id === itemId);
                if (event) {
                    dispatch({ type: 'UPDATE_EVENT', payload: { ...event, ...formData } });
                    toast.success('Подію оновлено');
                }
            } else if (type === 'routine') {
                const routine = state.routines.find(r => r.id === itemId);
                if (routine) {
                    dispatch({ type: 'UPDATE_ROUTINE', payload: { ...routine, ...formData } });
                    toast.success('Рутину оновлено');
                }
            }

            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update:', error);
            toast.error('Помилка при збереженні');
        }
    };

    const handleDelete = () => {
        if (!isConfirmDelete) {
            setIsConfirmDelete(true);
            return;
        }

        if (itemId) {
            if (type === 'task') dispatch({ type: 'DELETE_ACTION', payload: { id: itemId } });
            else if (type === 'project') dispatch({ type: 'DELETE_PROJECT', payload: { id: itemId } });
            else if (type === 'note') dispatch({ type: 'DELETE_NOTE', payload: { id: itemId } });
            else if (type === 'goal') dispatch({ type: 'DELETE_GOAL', payload: { id: itemId } });
            else if (type === 'event') dispatch({ type: 'DELETE_EVENT', payload: { id: itemId } });
            else if (type === 'routine') dispatch({ type: 'DELETE_ROUTINE', payload: { id: itemId } });

            toast.success('Видалено');
            onOpenChange(false);
            setIsConfirmDelete(false);
        }
    };

    const getLabel = () => {
        switch (type) {
            case 'task': return 'Редагувати завдання';
            case 'project': return 'Редагувати проект';
            case 'note': return 'Редагувати нотатку';
            case 'goal': return 'Редагувати ціль';
            case 'event': return 'Редагувати подію';
            case 'routine': return 'Редагувати рутину';
            default: return 'Редагувати';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:max-w-2xl h-[90vh] sm:h-[600px] p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-card rounded-xl sm:rounded-xl ring-1 ring-slate-900/5 dark:ring-border/20 transition-all duration-200 flex flex-col">
                <DialogHeader className="sr-only">
                    <DialogTitle>{getLabel()}</DialogTitle>
                </DialogHeader>

                {/* Header / Toolbar */}
                <div className="bg-slate-50/80 dark:bg-card/50 border-b border-slate-100 dark:border-border p-2 flex justify-between items-center shrink-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
                        {getLabel()}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-primary text-white hover:opacity-80 transition"
                            >
                                <Pencil className="h-3.5 w-3.5" /> Редагувати
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-secondary/30 transition"
                            >
                                <Eye className="h-3.5 w-3.5" /> Перегляд
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col sm:grid sm:grid-cols-[1fr_240px] divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-border bg-white dark:bg-card text-foreground">

                    {/* Left Column: Core Content */}
                    <div className="flex flex-col h-full overflow-y-auto p-5">

                        {/* PREVIEW MODE */}
                        {!isEditing && (
                            <div className="flex flex-col gap-3">
                                <h2 className="text-xl font-bold leading-snug text-foreground">{formData.title}</h2>
                                {formData.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">{formData.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {formData.date && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-secondary px-2 py-1 rounded-md text-slate-600 dark:text-muted-foreground">
                                            <CalendarIcon className="w-3 h-3" /> Почати з: {formData.date}
                                        </span>
                                    )}
                                    {formData.dueDate && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md text-orange-700 dark:text-orange-400">
                                            <Clock className="w-3 h-3" /> Виконати до: {typeof formData.dueDate === 'string' ? formData.dueDate.split('T')[0] : formData.dueDate}
                                        </span>
                                    )}
                                    {formData.startTime && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-secondary px-2 py-1 rounded-md text-slate-600 dark:text-muted-foreground">
                                            <Clock className="w-3 h-3" /> {formData.startTime}
                                        </span>
                                    )}
                                    {formData.priority === 'high' && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md text-red-600">Високий пріоритет</span>
                                    )}
                                    {formData.isFocus && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md text-orange-600">⚡ Фокус</span>
                                    )}
                                </div>
                                {/* Project info */}
                                {formData.projectId && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        {state.projects.find(p => p.id === formData.projectId)?.title || 'Проект'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* EDIT MODE */}
                        {isEditing && (
                            <>
                                {/* Title Input */}
                                <div className="flex items-start gap-3 mb-4">
                                    <Input
                                        value={formData.title || ''}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Назва завдання..."
                                        className="text-lg font-semibold px-0 border-none shadow-none focus-visible:ring-0 placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 h-auto bg-transparent rounded-none dark:text-foreground"
                                    />
                                </div>

                                {/* Description */}
                                {(type === 'task' || type === 'project' || type === 'note' || type === 'goal' || type === 'event') && (
                                    <Textarea
                                        value={formData.description || formData.content || formData.details || ''}
                                        onChange={e => {
                                            const key = type === 'note' ? 'content' : 'description';
                                            setFormData({ ...formData, [key]: e.target.value });
                                        }}
                                        placeholder="Додайте деталі..."
                                        className="min-h-[100px] flex-1 resize-none border-none focus-visible:ring-0 p-0 rounded-none text-slate-600 dark:text-foreground placeholder:text-slate-300 dark:placeholder:text-muted-foreground/30 text-sm shadow-none bg-transparent"
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Column: Metadata Sidebar - only shown in edit mode */}
                    {isEditing && (
                        <div className="bg-slate-50/50 dark:bg-card/50 p-4 space-y-5 h-full overflow-y-auto w-full">

                            {/* Area Selector */}
                            {(type === 'task' || type === 'goal' || type === 'project' || type === 'routine') && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Сфера</label>
                                    <Select
                                        value={formData.areaId || 'all'}
                                        onValueChange={(val) => setFormData({ ...formData, areaId: val === 'all' ? undefined : val })}
                                    >
                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                            <SelectValue placeholder="Оберіть сферу" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Загальне</SelectItem>
                                            {state.areas.map(area => (
                                                <SelectItem key={area.id} value={area.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", area.color)} />
                                                        {area.title}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Project Selector (Tasks) */}
                            {type === 'task' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Проект</label>
                                    <Select
                                        value={formData.projectId || 'none'}
                                        onValueChange={(val) => setFormData({ ...formData, projectId: val === 'none' ? undefined : val })}
                                    >
                                        <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                            <SelectValue placeholder="Без проекту" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Без проекту</SelectItem>
                                            {state.projects.map(project => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Date & Time */}
                            {type === 'task' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                                            Почати з <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date || ''}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="h-8 w-full min-w-0 max-w-full text-xs bg-white dark:bg-secondary/20 border border-slate-200 dark:border-border rounded-md px-2 text-foreground appearance-none block box-border"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                                            Виконати до
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dueDate ? (typeof formData.dueDate === 'string' ? formData.dueDate.split('T')[0] : '') : ''}
                                            onChange={e => setFormData({ ...formData, dueDate: e.target.value || undefined })}
                                            className="h-8 w-full min-w-0 max-w-full text-xs bg-white dark:bg-secondary/20 border border-slate-200 dark:border-border rounded-md px-2 text-foreground appearance-none block box-border"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Date for non-task types */}
                            {(type === 'event' || type === 'project' || (type === 'goal' && formData.deadline)) && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Дата</Label>
                                            <Input
                                                type="date"
                                                value={formData.date || formData.deadline || ''}
                                                onChange={(e) => {
                                                    const key = (type === 'goal' || type === 'project') ? 'deadline' : 'date';
                                                    setFormData({ ...formData, [key]: e.target.value });
                                                }}
                                                className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground px-3"
                                            />
                                        </div>
                                    </div>

                                    {(type === 'event') && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Час початку</label>
                                            <div className="relative">
                                                <Input
                                                    type="time"
                                                    value={formData.startTime || formData.time || ''}
                                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                                    className="h-8 bg-white dark:bg-secondary/20 border-slate-200 dark:border-border text-xs dark:text-foreground"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Task Details (Duration, Energy, Complexity) */}
                            {type === 'task' && (
                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-border">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Тривалість (хв)</label>
                                        <Select
                                            value={formData.duration?.toString() || '15'}
                                            onValueChange={(val) => setFormData({ ...formData, duration: parseInt(val) })}
                                        >
                                            <SelectTrigger className="h-8 w-full bg-white dark:bg-secondary/20 border-slate-200 dark:border-border shadow-sm text-xs dark:text-foreground">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 хв</SelectItem>
                                                <SelectItem value="15">15 хв</SelectItem>
                                                <SelectItem value="30">30 хв</SelectItem>
                                                <SelectItem value="45">45 хв</SelectItem>
                                                <SelectItem value="60">1 год</SelectItem>
                                                <SelectItem value="90">1.5 год</SelectItem>
                                                <SelectItem value="120">2 год</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="bg-slate-100 dark:bg-secondary/20 rounded-lg p-3 flex items-center justify-between border border-slate-200 dark:border-border/50">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-foreground">Фокус</span>
                                        <Switch
                                            checked={formData.isFocus || false}
                                            onCheckedChange={checked => setFormData({ ...formData, isFocus: checked })}
                                        />
                                    </div>
                                </div>
                            )}

                    </div>
                    )}

                </div>

                <DialogFooter className="flex sm:justify-between gap-2 p-3 border-t border-slate-100 dark:border-border bg-slate-50/50 dark:bg-card/50 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={handleDelete}
                        className={cn(
                            "mr-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20",
                            isConfirmDelete && "bg-rose-100 dark:bg-rose-900/30 font-bold"
                        )}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isConfirmDelete ? "Точно видалити?" : "Видалити"}
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Скасувати
                        </Button>
                        <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Save className="h-4 w-4 mr-2" />
                            Зберегти
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
