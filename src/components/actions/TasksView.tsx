'use client';

import { useData } from '@/lib/store';
import { Action } from '@/types';
import { Calendar, Activity, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ActionCard } from './ActionCard';
import { TaskFilters } from './TaskFilters';
import { useState } from 'react';
import { format } from 'date-fns';

export function TasksView({ filter = 'current' }: { filter?: 'current' | 'active' | 'completed' | 'deferred' | 'incomplete' }) {
    const { state, dispatch } = useData();
    // Use local date for "Today" comparison to match input[type="date"] values
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);

    const hasActiveFilters = selectedAreas.length > 0 || selectedProjects.length > 0 || dateFrom !== null || dateTo !== null;
    const clearFilters = () => {
        setSelectedAreas([]);
        setSelectedProjects([]);
        setDateFrom(null);
        setDateTo(null);
    };

    // --- Filter Logic ---
    let filteredTasks: Action[] = [];
    const allActions = state.actions.filter(a => a.type === 'task' || a.type === 'routine_instance');

    switch (filter) {
        case 'current':
            // "Current": Focus subset (Today OR Focus OR Recently Touched)
            // Excludes Deferred, Canceled, Completed
            filteredTasks = allActions.filter(a =>
                !a.completed &&
                a.status !== 'canceled' &&
                a.status !== 'deferred' &&
                (a.date === todayStr || a.isFocus)
            );
            break;
        case 'active':
            // "Active": "Planned tasks"
            // Includes: Future, Specific Date, Area-bound (if we treat areas as planned?)
            // Excludes: Deferred, Completed, Canceled, AND Inbox (no date/no area)
            // Nexis: Overdue tasks should move to Incomplete, not stay in Active!
            filteredTasks = allActions.filter(a =>
                !a.completed &&
                a.status !== 'canceled' &&
                a.status !== 'deferred' &&
                (!!a.date || !!a.areaId) &&
                !(a.date && a.date < todayStr)
            );
            break;
        case 'completed':
            // "Completed": History
            filteredTasks = allActions.filter(a => a.completed);
            break;
        case 'deferred':
            // "Deferred": Consciously postponed
            filteredTasks = allActions.filter(a => a.status === 'deferred');
            break;
        case 'incomplete':
            // "Incomplete" / "Missed": Overdue tasks
            // Logic: Not completed, Not canceled, Date < Today
            filteredTasks = allActions.filter(a =>
                !a.completed &&
                a.status !== 'canceled' &&
                a.status !== 'deferred' &&
                a.date && a.date < todayStr
            );
            break;
    }

    // Apply Advanced Filters
    if (selectedAreas.length > 0) {
        filteredTasks = filteredTasks.filter(a => a.areaId && selectedAreas.includes(a.areaId));
    }
    if (selectedProjects.length > 0) {
        filteredTasks = filteredTasks.filter(a => a.projectId && selectedProjects.includes(a.projectId));
    }
    if (dateFrom || dateTo) {
        const fromStr = dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null;
        const toStr = dateTo ? format(dateTo, 'yyyy-MM-dd') : null;
        filteredTasks = filteredTasks.filter(a => {
            if (!a.date) return false;
            if (fromStr && a.date < fromStr) return false;
            if (toStr && a.date > toStr) return false;
            return true;
        });
    }

    // Sort by priority/date
    filteredTasks.sort((a, b) => {
        // High priority first
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;

        // Date sorting depends on view
        const dateA = a.date ? new Date(a.date).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.date ? new Date(b.date).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);

        if (filter === 'completed' || filter === 'incomplete') {
            // History/Missed: Newest first (descending)
            return dateB - dateA;
        } else {
            // Planned: Soonest first (ascending)
            return dateA - dateB;
        }
    });

    const completeTask = (task: Action) => {
        dispatch({ type: 'TOGGLE_ACTION', payload: { id: task.id } });
        const area = state.areas.find(a => a.id === task.areaId);
        const feedback = area ? `Вклад у сферу ${area.title}` : "Дію виконано";
        toast(feedback, {
            icon: <Activity className="w-4 h-4 text-orange-500" />,
            description: "Рух - це життя.",
        });
    };

    // --- Grouping Logic ---
    const groupedTasks: Record<string, Action[]> = {};

    filteredTasks.forEach(task => {
        let groupKey = 'No Date';
        if (task.date) {
            const date = new Date(task.date);
            // Format: "Wednesday, 19 February"
            groupKey = date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
            // Capitalize first letter
            groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);

            // Add relative labels
            if (task.date === todayStr) groupKey = `Сьогодні, ${groupKey}`;
            else {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                if (task.date === yesterdayStr) groupKey = `Вчора, ${groupKey}`;
                if (task.date === tomorrowStr) groupKey = `Завтра, ${groupKey}`;
            }
        } else {
            groupKey = "Без дати";
        }

        if (!groupedTasks[groupKey]) groupedTasks[groupKey] = [];
        groupedTasks[groupKey].push(task);
    });

    // We need to maintain the sort order of groups based on the tasks inside them
    // Since tasks are already sorted, we can iterate through filteredTasks to pick extraction order
    const groupOrder: string[] = [];
    filteredTasks.forEach(task => {
        let groupKey = 'No Date';
        if (task.date) {
            const date = new Date(task.date);
            groupKey = date.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
            groupKey = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
            if (task.date === todayStr) groupKey = `Сьогодні, ${groupKey}`;
            else {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                if (task.date === yesterdayStr) groupKey = `Вчора, ${groupKey}`;
                if (task.date === tomorrowStr) groupKey = `Завтра, ${groupKey}`;
            }
        } else {
            groupKey = "Без дати";
        }

        if (!groupOrder.includes(groupKey)) {
            groupOrder.push(groupKey);
        }
    });

    const [showFilters, setShowFilters] = useState(true);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="py-4 px-4 md:px-8 space-y-1 shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-foreground">
                        <Calendar className="w-6 h-6 text-orange-500" />
                        Завдання
                    </h2>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            showFilters
                                ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                : "bg-slate-100 dark:bg-secondary/50 text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                        )}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Фільтри</span>
                        {hasActiveFilters && (
                            <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {selectedAreas.length + selectedProjects.length + (dateFrom || dateTo ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>
                <p className="text-muted-foreground text-sm">
                    {filter === 'current' && "Поточний фокус та завдання на сьогодні."}
                    {filter === 'active' && "Всі заплановані завдання."}
                    {filter === 'deferred' && "Свідомо відкладені завдання."}
                    {filter === 'completed' && "Історія успіху."}
                    {filter === 'incomplete' && "Пропущені дедлайни. Час надолужити!"}
                </p>
            </div>

            {/* Content: Sidebar + Tasks */}
            <div className="flex-1 flex min-h-0 gap-4 px-4 md:px-8 pb-4">
                {/* Filter Sidebar */}
                {showFilters && (
                    <div className="hidden md:block w-[260px] shrink-0 sticky top-0 self-start max-h-[calc(100vh-14rem)] overflow-hidden">
                        <TaskFilters
                            selectedAreas={selectedAreas}
                            setSelectedAreas={setSelectedAreas}
                            selectedProjects={selectedProjects}
                            setSelectedProjects={setSelectedProjects}
                            dateFrom={dateFrom}
                            setDateFrom={setDateFrom}
                            dateTo={dateTo}
                            setDateTo={setDateTo}
                            hasActiveFilters={hasActiveFilters}
                            clearFilters={clearFilters}
                        />
                    </div>
                )}

                {/* Tasks List */}
                <div className="flex-1 min-w-0 space-y-8 overflow-y-auto">
                    {filteredTasks.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground bg-white dark:bg-card/50 rounded-3xl border border-dashed border-slate-200 dark:border-border">
                            <p>
                                {filter === 'current' && "Фокус чистий. Час обрати нову мету!"}
                                {filter === 'active' && "Всі завдання виконані."}
                                {filter === 'deferred' && "Немає відкладених завдань."}
                                {filter === 'completed' && "Історія порожня."}
                                {filter === 'incomplete' && "Чудово! Жодних прострочених завдань."}
                            </p>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {groupOrder.map(group => (
                            <div key={group} className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                                    {group}
                                </h3>
                                {groupedTasks[group].map(task => (
                                    <ActionCard key={task.id} task={task} onComplete={() => completeTask(task)} areas={state.areas} />
                                ))}
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Filter Sheet (below content on mobile) */}
            {showFilters && (
                <div className="md:hidden px-4 pb-4">
                    <TaskFilters
                        selectedAreas={selectedAreas}
                        setSelectedAreas={setSelectedAreas}
                        selectedProjects={selectedProjects}
                        setSelectedProjects={setSelectedProjects}
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        dateTo={dateTo}
                        setDateTo={setDateTo}
                        hasActiveFilters={hasActiveFilters}
                        clearFilters={clearFilters}
                    />
                </div>
            )}
        </div>
    );
}


