'use client';

import { useData } from '@/lib/store';
import { Action } from '@/types';
import { Calendar, Activity } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ActionCard } from './ActionCard';

export function TasksView({ filter = 'current' }: { filter?: 'current' | 'active' | 'completed' | 'deferred' }) {
    const { state, dispatch } = useData();
    // Use local date for "Today" comparison to match input[type="date"] values
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
            // "Active": "All things I plan to do"
            // Includes: Future, No Date, Active Routines
            // Excludes: Deferred, Completed, Canceled
            filteredTasks = allActions.filter(a =>
                !a.completed &&
                a.status !== 'canceled' &&
                a.status !== 'deferred'
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
    }

    // Sort by priority/date
    filteredTasks.sort((a, b) => {
        // High priority first
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        // Then by date
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    if (filter === 'completed') {
        filteredTasks.reverse();
    }

    const completeTask = (task: Action) => {
        dispatch({ type: 'TOGGLE_ACTION', payload: { id: task.id } });
        const area = state.areas.find(a => a.id === task.areaId);
        const feedback = area ? `Вклад у сферу ${area.title}` : "Дію виконано";
        toast(feedback, {
            icon: <Activity className="w-4 h-4 text-orange-500" />,
            description: "Рух - це життя.",
        });
    };

    return (
        <div className="space-y-6 w-full h-full p-4 md:p-8">
            <div className="py-4 space-y-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-foreground">
                        <Calendar className="w-6 h-6 text-orange-500" />
                        Завдання
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {filter === 'current' && "Поточний фокус та завдання на сьогодні."}
                        {filter === 'active' && "Всі активні завдання в роботі."}
                        {filter === 'deferred' && "Свідомо відкладені завдання."}
                        {filter === 'completed' && "Історія успіху."}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {filteredTasks.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground bg-white dark:bg-card/50 rounded-3xl border border-dashed border-slate-200 dark:border-border">
                        <p>
                            {filter === 'current' && "Фокус чистий. Час обрати нову мету!"}
                            {filter === 'active' && "Всі завдання виконані."}
                            {filter === 'deferred' && "Немає відкладених завдань."}
                            {filter === 'completed' && "Історія порожня."}
                        </p>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {filteredTasks.map(task => (
                        <ActionCard key={task.id} task={task} onComplete={() => completeTask(task)} areas={state.areas} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}


