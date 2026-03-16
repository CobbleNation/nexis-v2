'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/lib/store';
import { isToday } from 'date-fns';
import { Target, CheckSquare, Folder, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FocusItem {
    type: 'task' | 'project' | 'goal';
    id: string;
    title: string;
    relatedProjectTitle?: string;
    relatedTasksCount?: number;
}

interface SelectFocusModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (item: FocusItem) => void;
}

type TabType = 'task' | 'project' | 'goal';

const TABS: { key: TabType; label: string; icon: React.ElementType }[] = [
    { key: 'task', label: 'Задачі', icon: CheckSquare },
    { key: 'project', label: 'Проєкти', icon: Folder },
    { key: 'goal', label: 'Цілі', icon: Flag },
];

export function SelectFocusModal({ open, onOpenChange, onSelect }: SelectFocusModalProps) {
    const { state } = useData();
    const [activeTab, setActiveTab] = useState<TabType>('task');

    const todayTasks = useMemo(() =>
        state.actions.filter(a => !a.completed && a.date && isToday(new Date(a.date))),
        [state.actions]
    );

    const activeProjects = useMemo(() =>
        state.projects.filter(p => p.status !== 'completed' && p.status !== 'deferred'),
        [state.projects]
    );

    const activeGoals = useMemo(() =>
        state.goals.filter(g => g.status === 'active'),
        [state.goals]
    );

    const handleSelect = (item: FocusItem) => {
        onSelect(item);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:max-w-lg bg-white dark:bg-card border-none shadow-2xl p-0 overflow-hidden">
                <div className="sr-only">
                    <DialogTitle>Обрати фокус дня</DialogTitle>
                </div>

                {/* Header */}
                <div className="px-6 pt-7 pb-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight">Обрати фокус дня</h2>
                    </div>
                    <p className="text-sm text-muted-foreground ml-12">
                        Оберіть одну ціль, яка буде вашим головним пріоритетом сьогодні.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 mb-4">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                    activeTab === tab.key
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* List */}
                <div className="px-6 pb-6 max-h-80 overflow-y-auto space-y-2">
                    {activeTab === 'task' && (
                        todayTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Немає незавершених задач на сьогодні
                            </p>
                        ) : todayTasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => handleSelect({
                                    type: 'task',
                                    id: task.id,
                                    title: task.title,
                                    relatedProjectTitle: task.projectId
                                        ? state.projects.find(p => p.id === task.projectId)?.title
                                        : undefined
                                })}
                                className="w-full flex items-start gap-3 p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/20 border border-transparent hover:border-primary/20 dark:hover:border-primary/20 rounded-2xl transition-all group"
                            >
                                <CheckSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0 transition-colors" />
                                <div>
                                    <p className="font-bold text-sm group-hover:text-primary dark:group-hover:text-primary transition-colors">{task.title}</p>
                                    {task.projectId && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {state.projects.find(p => p.id === task.projectId)?.title}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))
                    )}

                    {activeTab === 'project' && (
                        activeProjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Немає активних проєктів</p>
                        ) : activeProjects.map(project => {
                            const tasksCount = state.actions.filter(a => a.projectId === project.id && !a.completed).length;
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => handleSelect({
                                        type: 'project',
                                        id: project.id,
                                        title: project.title,
                                        relatedTasksCount: tasksCount
                                    })}
                                    className="w-full flex items-start gap-3 p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/20 border border-transparent hover:border-primary/20 dark:hover:border-primary/20 rounded-2xl transition-all group"
                                >
                                    <Folder className="w-5 h-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0 transition-colors" />
                                    <div>
                                        <p className="font-bold text-sm group-hover:text-primary dark:group-hover:text-primary transition-colors">{project.title}</p>
                                        {tasksCount > 0 && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{tasksCount} незавершених задач</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}

                    {activeTab === 'goal' && (
                        activeGoals.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Немає активних цілей</p>
                        ) : activeGoals.map(goal => (
                            <button
                                key={goal.id}
                                onClick={() => handleSelect({
                                    type: 'goal',
                                    id: goal.id,
                                    title: goal.title
                                })}
                                className="w-full flex items-start gap-3 p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/20 border border-transparent hover:border-primary/20 dark:hover:border-primary/20 rounded-2xl transition-all group"
                            >
                                <Flag className="w-5 h-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0 transition-colors" />
                                <p className="font-bold text-sm group-hover:text-primary dark:group-hover:text-primary transition-colors">{goal.title}</p>
                            </button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
