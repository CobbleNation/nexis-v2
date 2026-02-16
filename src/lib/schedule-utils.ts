import { Action, AppEvent, Routine, Goal, Project, MetricDefinition } from '@/types';
import { addDays, format, isSameDay, parseISO, startOfDay, endOfDay, isWithinInterval, addWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface ScheduleItem {
    id: string;
    type: 'task' | 'event' | 'routine' | 'deadline' | 'metric_reminder' | 'ritual';
    title: string;
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
    duration?: number; // minutes
    status: 'pending' | 'completed' | 'in-progress' | 'deferred' | 'canceled' | 'active' | 'future';
    color?: string;
    entityId: string; // Original ID reference
    areaId?: string;
    details?: string;
    isFocus?: boolean;
}

export const getScheduleItems = (
    state: {
        actions: Action[];
        events: AppEvent[];
        routines: Routine[];
        goals: Goal[];
        projects: Project[];
        metrics: MetricDefinition[];
    },
    startDate: Date,
    endDate: Date,
    viewMode: 'day' | 'week' | 'month' | 'year' = 'day'
): ScheduleItem[] => {
    const items: ScheduleItem[] = [];

    // Safety check for empty state
    if (!state) return [];

    // --- 1. Day View: ACTION (Detailed Tasks, Events, Routines) ---
    if (viewMode === 'day') {
        // Tasks
        (state.actions || []).forEach(action => {
            if (action.type === 'task' && action.date && isWithinInterval(parseISO(action.date), { start: startDate, end: endDate })) {
                items.push({
                    id: `task-${action.id}`,
                    type: 'task',
                    title: action.title,
                    date: action.date,
                    time: action.startTime,
                    duration: action.duration,
                    status: action.status,
                    entityId: action.id,
                    areaId: action.areaId,
                    details: action.description,
                    isFocus: action.isFocus
                });
            }
        });

        // Events
        (state.events || []).forEach(event => {
            if (event.date && isWithinInterval(parseISO(event.date), { start: startDate, end: endDate })) {
                items.push({
                    id: `event-${event.id}`,
                    type: 'event',
                    title: event.title,
                    date: event.date,
                    time: event.startTime,
                    duration: event.endTime && event.startTime ? calculateDuration(event.startTime, event.endTime) : undefined,
                    status: 'future',
                    entityId: event.id,
                    areaId: event.areaId,
                    details: event.description,
                    color: 'bg-sky-500'
                });
            }
        });

        // Routines (Projected for Day)
        let current = startOfDay(startDate);
        const end = endOfDay(endDate);
        while (current <= end) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const dayOfWeek = current.getDay();
            (state.routines || []).forEach(routine => {
                let shouldAdd = false;
                if (routine.frequency === 'daily') shouldAdd = true;
                if (routine.frequency === 'weekly' && routine.daysOfWeek?.includes(dayOfWeek)) shouldAdd = true;

                const existingInstance = (state.actions || []).find(a => a.fromRoutineId === routine.id && a.date === dateStr);

                if (shouldAdd && !existingInstance) {
                    items.push({
                        id: `routine-proj-${routine.id}-${dateStr}`,
                        type: 'routine',
                        title: routine.title,
                        date: dateStr,
                        time: routine.time || undefined, // explicit undefined if empty/null
                        duration: routine.duration,
                        status: 'future',
                        entityId: routine.id,
                        areaId: routine.areaId,
                        color: 'bg-slate-400'
                    });
                }
            });
            current = addDays(current, 1);
        }
    }

    // --- 2. Week View: DETAILED GRID (Tasks, Events, Deadlines) ---
    if (viewMode === 'week') {
        // Tasks
        (state.actions || []).forEach(action => {
            if (action.type === 'task' && action.date && isWithinInterval(parseISO(action.date), { start: startDate, end: endDate })) {
                items.push({
                    id: `task-${action.id}`,
                    type: 'task',
                    title: action.title,
                    date: action.date,
                    time: action.startTime,
                    duration: action.duration,
                    status: action.status,
                    entityId: action.id,
                    areaId: action.areaId,
                    details: action.description,
                    isFocus: action.isFocus
                });
            }
        });

        // Events
        (state.events || []).forEach(event => {
            if (event.date && isWithinInterval(parseISO(event.date), { start: startDate, end: endDate })) {
                items.push({
                    id: `event-${event.id}`,
                    type: 'event',
                    title: event.title,
                    date: event.date,
                    time: event.startTime,
                    duration: event.endTime && event.startTime ? calculateDuration(event.startTime, event.endTime) : undefined,
                    status: 'future',
                    entityId: event.id,
                    areaId: event.areaId,
                    details: event.description,
                    color: 'bg-sky-500'
                });
            }
        });

        // Routines (Projected for Week)
        let current = startOfDay(startDate);
        const end = endOfDay(endDate);
        while (current <= end) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const dayOfWeek = current.getDay();
            (state.routines || []).forEach(routine => {
                let shouldAdd = false;
                if (routine.frequency === 'daily') shouldAdd = true;
                if (routine.frequency === 'weekly' && routine.daysOfWeek?.includes(dayOfWeek)) shouldAdd = true;

                const existingInstance = (state.actions || []).find(a => a.fromRoutineId === routine.id && a.date === dateStr);

                if (shouldAdd && !existingInstance) {
                    items.push({
                        id: `routine-proj-${routine.id}-${dateStr}`,
                        type: 'routine',
                        title: routine.title,
                        date: dateStr,
                        time: routine.time || undefined,
                        duration: routine.duration,
                        status: 'future',
                        entityId: routine.id,
                        areaId: routine.areaId,
                        color: 'bg-slate-400'
                    });
                }
            });
            current = addDays(current, 1);
        }

        // Deadlines (Goals & Projects)
        (state.goals || []).forEach(goal => {
            if (goal.deadline && isWithinInterval(parseISO(goal.deadline), { start: startDate, end: endDate })) {
                items.push({
                    id: `deadline-goal-${goal.id}`,
                    type: 'deadline',
                    title: `🎯 ${goal.title}`,
                    date: goal.deadline,
                    status: goal.status === 'completed' ? 'completed' : 'pending',
                    entityId: goal.id,
                    areaId: goal.areaId,
                    color: 'bg-emerald-500'
                });
            }
        });

        (state.projects || []).forEach(project => {
            if (project.deadline && isWithinInterval(parseISO(project.deadline), { start: startDate, end: endDate })) {
                items.push({
                    id: `deadline-project-${project.id}`,
                    type: 'deadline',
                    title: `📁 ${project.title}`,
                    date: project.deadline,
                    status: project.status === 'completed' ? 'completed' : 'pending',
                    entityId: project.id,
                    areaId: project.areaId,
                    color: 'bg-blue-500'
                });
            }
        });
    }

    // --- 3. Month View: EXPECTATIONS (Milestones & Deadlines ONLY) ---
    if (viewMode === 'month') {
        // Goal Deadlines
        (state.goals || []).forEach(goal => {
            if (goal.deadline && isWithinInterval(parseISO(goal.deadline), { start: startDate, end: endDate })) {
                items.push({
                    id: `deadline-goal-${goal.id}`,
                    type: 'deadline',
                    title: `🎯 ${goal.title}`,
                    date: goal.deadline,
                    status: goal.status === 'completed' ? 'completed' : 'pending',
                    entityId: goal.id,
                    areaId: goal.areaId,
                    color: 'bg-emerald-500'
                });
            }
        });

        // Project Deadlines
        (state.projects || []).forEach(project => {
            if (project.deadline && isWithinInterval(parseISO(project.deadline), { start: startDate, end: endDate })) {
                items.push({
                    id: `deadline-project-${project.id}`,
                    type: 'deadline',
                    title: `📁 ${project.title}`,
                    date: project.deadline,
                    status: project.status === 'completed' ? 'completed' : 'pending',
                    entityId: project.id,
                    areaId: project.areaId,
                    color: 'bg-blue-500'
                });
            }
        });

        // Major Events (Milestones)
        (state.events || []).forEach(event => {
            if (event.type === 'milestone' && event.date && isWithinInterval(parseISO(event.date), { start: startDate, end: endDate })) {
                items.push({
                    id: `event-${event.id}`,
                    type: 'event', // milestone
                    title: `🚩 ${event.title}`,
                    date: event.date,
                    status: 'future',
                    entityId: event.id,
                    areaId: event.areaId,
                    color: 'bg-amber-500'
                });
            }
        });
    }

    // --- 4. Year View: DIRECTION (Strategic Goals & Phases) ---
    if (viewMode === 'year') {
        // Strategic Goals
        (state.goals || []).forEach(goal => {
            if ((goal.type === 'strategic' || goal.horizon === 'year') && goal.deadline && isWithinInterval(parseISO(goal.deadline), { start: startDate, end: endDate })) {
                items.push({
                    id: `strat-goal-${goal.id}`,
                    type: 'deadline',
                    title: `🔭 ${goal.title}`,
                    date: goal.deadline,
                    status: goal.status === 'completed' ? 'completed' : 'pending',
                    entityId: goal.id,
                    areaId: goal.areaId,
                    color: 'bg-purple-500'
                });
            }
        });
    }

    // Sort by time, then title (common sorting)
    return items.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;
        return 0;
    });
};

function calculateDuration(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
}
