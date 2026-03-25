import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useData } from '@/lib/store';
import { Project } from '@/types';
import { toast } from 'sonner';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditProjectDialogProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
    const { state, dispatch } = useData();
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || '');
    const [areaId, setAreaId] = useState(project.areaId || '');
    
    // Deadline toggle logic
    const [hasDeadline, setHasDeadline] = useState(!!project.deadline);
    const [date, setDate] = useState(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');

    // Metrics (if applicable, placeholder mapping for UI matching)
    const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>(project.metricIds || []);

    // Reset form when project changes
    useEffect(() => {
        if (open) {
            setTitle(project.title);
            setDescription(project.description || '');
            setAreaId(project.areaId || '');
            setHasDeadline(!!project.deadline);
            setDate(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
            setSelectedMetricIds(project.metricIds || []);
        }
    }, [project, open]);

    const handleSave = () => {
        if (!title.trim()) {
            toast.error("Назва проекту обов'язкова");
            return;
        }
        if (!areaId) {
            toast.error("Будь ласка, виберіть сферу");
            return;
        }
        if (hasDeadline && !date) {
            toast.error("Будь ласка, оберіть дедлайн");
            return;
        }

        const updatedProject: Project = {
            ...project,
            title,
            description,
            areaId: areaId,
            deadline: (hasDeadline && date) ? new Date(date).toISOString() : undefined,
            metricIds: selectedMetricIds,
            updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
        toast.success("Проект успішно оновлено");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed left-[50%] top-[50%] z-[9999] translate-x-[-50%] translate-y-[-50%] w-[95%] sm:max-w-2xl max-h-[90dvh] sm:h-[600px] p-0 gap-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-card rounded-xl sm:rounded-xl ring-1 ring-slate-900/5 dark:ring-border/20 transition-all duration-200 flex flex-col">
                <DialogTitle className="sr-only">Редагувати проект</DialogTitle>
                
                {/* Header (Entity Selector styled equivalent) */}
                <div className="bg-slate-50/80 dark:bg-card/50 border-b border-slate-100 dark:border-border p-2 flex overflow-x-auto gap-1 shrink-0 scrollbar-none">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-secondary/50 shadow-sm text-foreground ring-1 ring-slate-200 dark:ring-border">
                        <Folder className="h-3.5 w-3.5 text-blue-500" />
                        Редагувати проект
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto sm:overflow-hidden flex flex-col sm:grid sm:grid-cols-[1fr_240px] divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-border bg-white dark:bg-card text-foreground overscroll-contain touch-pan-y">
                    
                    {/* Left Column: Core Content */}
                    <div className="flex flex-col h-auto sm:h-full sm:overflow-y-auto p-4 sm:p-5 relative pb-20 sm:pb-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="mt-1.5 p-2 rounded-lg shrink-0 transition-colors duration-300 bg-blue-500/10 text-blue-500">
                                <Folder className="h-5 w-5" />
                            </div>
                            <Input
                                id="task-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Назва проект..."
                                className="text-lg font-semibold px-0 border-none shadow-none focus-visible:ring-0 placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 h-auto bg-transparent rounded-none dark:text-foreground"
                            />
                        </div>

                        <div className="space-y-4 flex-1 pb-4">
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Короткий опис проекту..."
                                className="min-h-[120px] resize-none border-0 px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-400 dark:placeholder:text-muted-foreground/50 text-base bg-transparent dark:text-foreground"
                            />
                        </div>

                        {/* Metrics Section (Visual placeholder as per QuickAddModal) */}
                        <div className="mt-8 border-t border-slate-100 dark:border-border pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Метрики проекту</label>
                                <button className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                                    + Додати метрику
                                </button>
                            </div>
                            {selectedMetricIds.length === 0 ? (
                                <p className="text-[12px] text-muted-foreground">Немає обраних метрик</p>
                            ) : (
                                <p className="text-[12px] text-muted-foreground">{selectedMetricIds.length} метрики обрані (можна налаштувати пізніше)</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="bg-slate-50/50 dark:bg-card/50 p-4 sm:p-5 flex flex-col gap-6 sm:h-full overflow-y-auto">
                        
                        {/* Area Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                    <span className="text-red-400">*</span> Сфера
                                </label>
                            </div>
                            <Select value={areaId} onValueChange={setAreaId}>
                                <SelectTrigger className="w-full bg-white dark:bg-card border-slate-200 dark:border-border shadow-sm">
                                    <SelectValue placeholder="Сфера" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {state.areas.map(area => (
                                        <SelectItem key={area.id} value={area.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                                                {area.title}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Deadline Switch & Date */}
                        <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-border/50">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Дедлайн</label>
                                <Switch
                                    checked={hasDeadline}
                                    onCheckedChange={setHasDeadline}
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>

                            {hasDeadline && (
                                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="bg-white dark:bg-secondary/20 shadow-sm border-slate-200 dark:border-border w-full text-foreground color-scheme-light dark:color-scheme-dark"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-border bg-slate-50/80 dark:bg-card/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
                    <p className="text-xs text-slate-400 dark:text-muted-foreground w-full text-center sm:text-left">
                        Press <strong className="font-semibold text-slate-600 dark:text-foreground">Enter</strong> to save
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 sm:flex-none text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-secondary/50 font-medium h-9"
                        >
                            Скасувати
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="flex-1 sm:flex-none h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            Зберегти
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
