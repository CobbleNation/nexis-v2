import React, { useState } from 'react';
import { Project, Action, MetricDefinition } from '@/types';
import { useData } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProjectSuggestionResponse } from '@/lib/ai/types';

interface ProjectAssistantProps {
    project: Project;
    areaName?: string;
}

// Mock AI Service until backend is ready
const mockGenerateSuggestions = async (title: string, area: string): Promise<ProjectSuggestionResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

    // Simple keyword matching for demo
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('fit') || lowerTitle.includes('gym') || lowerTitle.includes('health') || lowerTitle.includes('weight')) {
        return {
            suggestedMetrics: [
                { name: 'Weight', unit: 'kg', rationale: 'Track physical progress' },
                { name: 'Workout Frequency', unit: 'times/week', rationale: 'Consistency is key' },
                { name: 'Body Fat', unit: '%', rationale: 'Body composition tracking' }
            ],
            suggestedTasks: [
                { title: 'Buy gym membership', priority: 'high', rationale: 'Essential first step' },
                { title: 'Create workout plan', priority: 'high', rationale: 'Plan your routine' },
                { title: 'Buy protein powder', priority: 'medium', rationale: 'Nutrition support' },
                { title: 'Schedule first session', priority: 'medium', rationale: 'Commit to starting' }
            ]
        };
    }

    if (lowerTitle.includes('code') || lowerTitle.includes('app') || lowerTitle.includes('dev') || lowerTitle.includes('web')) {
        return {
            suggestedMetrics: [
                { name: 'Commits', unit: 'commits/day', rationale: 'Track coding activity' },
                { name: 'Hours Coded', unit: 'hours', rationale: 'Track improved focus' },
                { name: 'Bugs Fixed', unit: 'count', rationale: 'Quality control' }
            ],
            suggestedTasks: [
                { title: 'Setup repository', priority: 'high', rationale: 'Initial setup' },
                { title: 'Design database schema', priority: 'high', rationale: 'Core architecture' },
                { title: 'Configure CI/CD', priority: 'medium', rationale: 'Automation' },
                { title: 'Write MVP features', priority: 'medium', rationale: 'Core value' }
            ]
        };
    }

    // Default generic suggestions
    return {
        suggestedMetrics: [
            { name: 'Consistency', unit: '%', rationale: 'Track how often you work on this' },
            { name: 'Milestones Reached', unit: 'count', rationale: 'Track major progress steps' }
        ],
        suggestedTasks: [
            { title: 'Define project scope', priority: 'high', rationale: 'Clarify goals' },
            { title: 'Break down into milestones', priority: 'high', rationale: 'Make it manageable' },
            { title: 'Research resources', priority: 'medium', rationale: 'Gather information' },
            { title: 'First implementation step', priority: 'medium', rationale: 'Get started' }
        ]
    };
};

export function ProjectAssistant({ project, areaName }: ProjectAssistantProps) {
    const { state, dispatch } = useData();
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<ProjectSuggestionResponse | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Track added items to visually disable them
    const [addedMetrics, setAddedMetrics] = useState<Set<string>>(new Set());
    const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());

    const handleGenerate = async () => {
        setIsLoading(true);
        setIsOpen(true);
        try {
            const result = await mockGenerateSuggestions(project.title, areaName || 'General');
            setSuggestions(result);
        } catch (error) {
            toast.error("Не вдалося отримати пропозиції від AI");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMetric = (suggestion: ProjectSuggestionResponse['suggestedMetrics'][0]) => {
        // Check if metric already exists by name
        const existing = state.metricDefinitions.find(m => m.name.toLowerCase() === suggestion.name.toLowerCase());

        let metricId = existing?.id;

        if (!existing) {
            // Create new metric
            const newMetric: MetricDefinition = {
                id: Date.now().toString(),
                userId: 'current-user',
                name: suggestion.name,
                unit: suggestion.unit,
                areaId: project.areaId || 'general',
                frequency: 'weekly',
                direction: 'increase',
                type: 'number',
                valueType: 'numeric',
                createdAt: new Date().toISOString()
            };
            dispatch({ type: 'ADD_METRIC_DEF', payload: newMetric });
            metricId = newMetric.id;
        }

        if (metricId) {
            // Link to project
            const currentMetrics = project.metricIds || [];
            if (!currentMetrics.includes(metricId)) {
                const updated = { ...project, metricIds: [...currentMetrics, metricId] };
                dispatch({ type: 'UPDATE_PROJECT', payload: updated });
                toast.success(`Метрику "${suggestion.name}" додано`);
            } else {
                toast.info(`Метрику "${suggestion.name}" вже додано`);
            }
            setAddedMetrics(prev => new Set(prev).add(suggestion.name));
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

    if (!isOpen && !suggestions) {
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
                <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Аналізувати
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-4">
                <h3 className="font-bold text-slate-800 dark:text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Пропозиції AI
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-slate-400">
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
                                <div key={idx} className="p-3 bg-slate-50 dark:bg-secondary/20 rounded-xl border border-slate-100 dark:border-border flex items-center justify-between group">
                                    <div>
                                        <div className="font-medium text-sm text-slate-800 dark:text-foreground">{metric.name}</div>
                                        <div className="text-xs text-slate-500">{metric.rationale}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-white dark:bg-card px-2 py-0.5 rounded border shadow-sm">{metric.unit}</span>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={cn("h-7 w-7", addedMetrics.has(metric.name) ? "text-emerald-500 bg-emerald-50" : "text-indigo-600 hover:bg-indigo-50")}
                                            onClick={() => handleAddMetric(metric)}
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
                                    <div>
                                        <div className="font-medium text-sm text-slate-800 dark:text-foreground">{task.title}</div>
                                        <div className="text-xs text-slate-500">{task.rationale}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded border uppercase font-bold",
                                            task.priority === 'high' ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                        )}>{task.priority}</span>
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
    );
}
