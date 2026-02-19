
import React, { useState } from 'react';
import { Project, Action, MetricDefinition } from '@/types';
import { useData } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Plus, Check, MessageSquareMore, ChevronUp, ChevronDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProjectSuggestionResponse } from '@/lib/ai/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { MetricCreationWizard } from '@/components/metrics/MetricCreationWizard';

interface ProjectAssistantProps {
    project: Project;
    areaName?: string;
}

export function ProjectAssistant({ project, areaName }: ProjectAssistantProps) {
    const { state, dispatch } = useData();
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<ProjectSuggestionResponse | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Wizard State
    const [isMetricWizardOpen, setIsMetricWizardOpen] = useState(false);
    const [wizardInitialState, setWizardInitialState] = useState<{
        title: string;
        unit?: string;
        description?: string;
    } | null>(null);

    // Track added items to visually disable them
    const [addedMetrics, setAddedMetrics] = useState<Set<string>>(new Set());
    const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());

    // Refine State
    const [refiningId, setRefiningId] = useState<string | null>(null); // 'metric-idx' or 'task-idx'
    const [refineInstruction, setRefineInstruction] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setIsOpen(true);
        setIsCollapsed(false);
        try {
            const response = await fetch('/api/ai/suggest-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: project.title,
                    description: project.description,
                    areaName: areaName
                })
            });

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error("Ця функція доступна тільки для Pro користувачів");
                    return;
                }
                throw new Error('AI Request failed');
            }

            const result: ProjectSuggestionResponse = await response.json();
            setSuggestions(result);
        } catch (error) {
            console.error(error);
            toast.error("Не вдалося отримати пропозиції від AI");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefine = async (type: 'metric' | 'task', index: number, suggestion: any) => {
        if (!refineInstruction.trim()) return;

        setIsRefining(true);
        try {
            const response = await fetch('/api/ai/refine-suggestion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suggestion,
                    instruction: refineInstruction,
                    type,
                    projectContext: { title: project.title, description: project.description }
                })
            });

            if (!response.ok) throw new Error('Refine failed');

            const refined = await response.json();

            // Update local state
            if (suggestions) {
                const newSuggestions = { ...suggestions };
                if (type === 'metric') {
                    newSuggestions.suggestedMetrics[index] = refined;
                } else {
                    newSuggestions.suggestedTasks[index] = refined;
                }
                setSuggestions(newSuggestions);
                toast.success("Оновлено!");
            }
            setRefiningId(null);
            setRefineInstruction('');

        } catch (error) {
            console.error(error);
            toast.error("Не вдалося оновити");
        } finally {
            setIsRefining(false);
        }
    };

    const handleAddMetricClick = (suggestion: ProjectSuggestionResponse['suggestedMetrics'][0]) => {
        // Check if metric already exists by name
        const existing = state.metricDefinitions.find(m => m.name.toLowerCase() === suggestion.name.toLowerCase());

        if (existing) {
            const currentMetrics = project.metricIds || [];
            if (!currentMetrics.includes(existing.id)) {
                const updated = { ...project, metricIds: [...currentMetrics, existing.id] };
                dispatch({ type: 'UPDATE_PROJECT', payload: updated });
                toast.success(`Метрику "${suggestion.name}" додано`);
                setAddedMetrics(prev => new Set(prev).add(suggestion.name));
            } else {
                toast.info(`Метрику "${suggestion.name}" вже додано`);
            }
            return;
        }

        // Open Wizard for new metric
        setWizardInitialState({
            title: suggestion.name,
            unit: suggestion.unit,
            description: suggestion.rationale
        });
        setIsMetricWizardOpen(true);
    };

    const handleWizardComplete = (metricId?: string) => {
        setIsMetricWizardOpen(false);
        setWizardInitialState(null);

        if (metricId) {
            // Link to project
            const currentMetrics = project.metricIds || [];
            if (!currentMetrics.includes(metricId)) {
                const updated = { ...project, metricIds: [...currentMetrics, metricId] };
                dispatch({ type: 'UPDATE_PROJECT', payload: updated });
                toast.success("Метрику створено та додано до проекту");

                // Try to find the name if possible to mark as added, though ID is safer
                const metric = state.metricDefinitions.find(m => m.id === metricId);
                if (metric) {
                    setAddedMetrics(prev => new Set(prev).add(metric.name));
                }
            }
        }
    };


    const handleAddTask = (suggestion: ProjectSuggestionResponse['suggestedTasks'][0]) => {
        const newTask: Action = {
            id: Date.now().toString() + Math.random(),
            userId: 'current-user',
            title: suggestion.title,
            type: 'task',
            status: 'pending',
            completed: false,
            priority: suggestion.priority,
            projectId: project.id,
            areaId: project.areaId || 'general',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        dispatch({ type: 'ADD_ACTION', payload: newTask });
        toast.success(`Завдання "${suggestion.title}" додано`);
        setAddedTasks(prev => new Set(prev).add(suggestion.title));
    };

    if (!isOpen) {
        return (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-card flex items-center justify-center shadow-sm text-indigo-500">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-foreground">AI Асистент Проекту</h3>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground">Отримайте пропозиції задач та метрик для вашого проекту</p>
                    </div>
                </div>
                {suggestions ? (
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(true)}
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
                    >
                        Показати пропозиції
                    </Button>
                ) : (
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Аналізувати
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-card rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-4">
                    <h3 className="font-bold text-slate-800 dark:text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        Пропозиції AI
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Згорнути
                    </Button>
                </div>

                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p className="text-sm">Аналізуємо проект...</p>
                    </div>
                ) : suggestions ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Suggested Metrics */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Пропоновані Метрики</h4>
                            <div className="space-y-3">
                                {suggestions.suggestedMetrics.map((metric, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-secondary/20 rounded-xl border border-slate-100 dark:border-border flex items-center justify-between group relative">
                                        <div className="flex-1 pr-2">
                                            <div className="font-medium text-sm text-slate-800 dark:text-foreground">{metric.name}</div>
                                            <div className="text-xs text-slate-500">{metric.rationale}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] bg-white dark:bg-card px-2 py-0.5 rounded border shadow-sm">{metric.unit}</span>

                                            {/* Refine Popover */}
                                            <Popover open={refiningId === `metric-${idx}`} onOpenChange={(open) => setRefiningId(open ? `metric-${idx}` : null)}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-500">
                                                        <MessageSquareMore className="w-4 h-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-3">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium text-xs">Уточнити метрику</h4>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Напр: змінити одиниці на кг..."
                                                                value={refineInstruction}
                                                                onChange={(e) => setRefineInstruction(e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleRefine('metric', idx, metric)}
                                                                disabled={isRefining}
                                                            >
                                                                {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className={cn("h-7 w-7", addedMetrics.has(metric.name) ? "text-emerald-500 bg-emerald-50" : "text-indigo-600 hover:bg-indigo-50")}
                                                onClick={() => handleAddMetricClick(metric)}
                                                disabled={addedMetrics.has(metric.name)}
                                            >
                                                {addedMetrics.has(metric.name) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Suggested Tasks */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Пропоновані Задачі</h4>
                            <div className="space-y-3">
                                {suggestions.suggestedTasks.map((task, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-secondary/20 rounded-xl border border-slate-100 dark:border-border flex items-center justify-between group">
                                        <div className="flex-1 pr-2">
                                            <div className="font-medium text-sm text-slate-800 dark:text-foreground">{task.title}</div>
                                            <div className="text-xs text-slate-500">{task.rationale}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Priority Badge Removed as per request */}

                                            {/* Refine Popover */}
                                            <Popover open={refiningId === `task-${idx}`} onOpenChange={(open) => setRefiningId(open ? `task-${idx}` : null)}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-500">
                                                        <MessageSquareMore className="w-4 h-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-3">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium text-xs">Уточнити завдання</h4>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Напр: додати дедлайн..."
                                                                value={refineInstruction}
                                                                onChange={(e) => setRefineInstruction(e.target.value)}
                                                                className="h-8 text-xs"
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleRefine('task', idx, task)}
                                                                disabled={isRefining}
                                                            >
                                                                {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className={cn("h-7 w-7", addedTasks.has(task.title) ? "text-emerald-500 bg-emerald-50" : "text-indigo-600 hover:bg-indigo-50")}
                                                onClick={() => handleAddTask(task)}
                                                disabled={addedTasks.has(task.title)}
                                            >
                                                {addedTasks.has(task.title) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Metric Creation Wizard Dialog */}
            <Dialog open={isMetricWizardOpen} onOpenChange={setIsMetricWizardOpen}>
                <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden bg-slate-50 dark:bg-background border-none">
                    {wizardInitialState && (
                        <MetricCreationWizard
                            initialTitle={wizardInitialState.title}
                            initialUnit={wizardInitialState.unit}
                            initialDescription={wizardInitialState.description}
                            initialAreaId={project.areaId}
                            onComplete={handleWizardComplete}
                            onCancel={() => {
                                setIsMetricWizardOpen(false);
                                setWizardInitialState(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
