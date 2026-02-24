'use client';

import React, { createContext, useContext, useEffect, useReducer } from 'react';

import { LifeArea, Goal, Action, Project, MetricDefinition, MetricEntry, DayLog, Focus, CheckIn, Insight, Period, Experiment, Note, AppEvent, Routine, JournalEntry, FileAsset, LibraryItem, Notification, Habit, HabitLog } from '@/types';
import { useAuth } from './auth-context';
import { toast } from 'sonner';

// --- Types ---
export interface AppState {
    user: { name: string; avatar: string };
    areas: LifeArea[];
    goals: Goal[];
    projects: Project[];
    actions: Action[];
    routines: Routine[];
    events: AppEvent[];
    habits: Habit[];
    habitLogs: HabitLog[];
    focuses: Focus[];
    checkIns: CheckIn[];
    insights: Insight[];
    periods: Period[];
    experiments: Experiment[];
    notes: Note[];
    journal: JournalEntry[];
    files: FileAsset[];
    library: LibraryItem[];
    notifications: Notification[];
    notificationSettings: {
        enabled: boolean;
        sound: boolean;
        email: boolean;
        push: boolean;
        reminders: boolean; // 15m before
    };
    metricDefinitions: MetricDefinition[];
    metricEntries: MetricEntry[];
    logs: Record<string, DayLog>; // Date string YYYY-MM-DD -> Log
    period: 'day' | 'week' | 'month' | 'year';
    selectedAreaId: string; // 'all' or specific area ID
    isLoading: boolean;
}

export type AppAction =
    | { type: 'INIT_DATA'; payload: Partial<AppState> }
    | { type: 'ADD_ACTION'; payload: Action }
    | { type: 'UPDATE_ACTION'; payload: Action }
    | { type: 'DELETE_ACTION'; payload: { id: string } }
    | { type: 'TOGGLE_ACTION'; payload: { id: string } }
    | { type: 'ADD_ROUTINE'; payload: Routine }
    | { type: 'UPDATE_ROUTINE'; payload: Routine }
    | { type: 'DELETE_ROUTINE'; payload: { id: string } }
    | { type: 'ADD_HABIT'; payload: Habit }
    | { type: 'UPDATE_HABIT'; payload: Habit }
    | { type: 'DELETE_HABIT'; payload: { id: string } }
    | { type: 'LOG_HABIT'; payload: HabitLog }
    | { type: 'DELETE_HABIT_LOG'; payload: { id: string } }
    | { type: 'ADD_GOAL'; payload: Goal }
    | { type: 'UPDATE_GOAL'; payload: Goal }
    | { type: 'UPDATE_GOAL_PROGRESS'; payload: { id: string; progress: number } }
    | { type: 'DELETE_GOAL'; payload: { id: string } }
    | { type: 'ADD_PROJECT'; payload: Project }
    | { type: 'UPDATE_PROJECT'; payload: Project }
    | { type: 'DELETE_PROJECT'; payload: { id: string } }
    | { type: 'ADD_FOCUS'; payload: Focus }
    | { type: 'ADD_CHECKIN'; payload: CheckIn }
    | { type: 'ADD_INSIGHT'; payload: Insight }
    | { type: 'ADD_PERIOD'; payload: Period }
    | { type: 'ADD_EXPERIMENT'; payload: Experiment }
    | { type: 'ADD_NOTE'; payload: Note }
    | { type: 'UPDATE_NOTE'; payload: Note }
    | { type: 'DELETE_NOTE'; payload: { id: string } }
    | { type: 'ADD_JOURNAL'; payload: JournalEntry }
    | { type: 'UPDATE_JOURNAL'; payload: JournalEntry }
    | { type: 'DELETE_JOURNAL'; payload: { id: string } }
    | { type: 'ADD_FILE'; payload: FileAsset }
    | { type: 'UPDATE_FILE'; payload: FileAsset }
    | { type: 'DELETE_FILE'; payload: { id: string } }
    | { type: 'ADD_LIBRARY_ITEM'; payload: LibraryItem }
    | { type: 'UPDATE_LIBRARY_ITEM'; payload: LibraryItem }
    | { type: 'DELETE_LIBRARY_ITEM'; payload: { id: string } }
    | { type: 'ADD_METRIC_DEF'; payload: MetricDefinition }
    | { type: 'ADD_METRIC_ENTRY'; payload: MetricEntry }
    | { type: 'ADD_EVENT'; payload: AppEvent }
    | { type: 'UPDATE_EVENT'; payload: AppEvent }
    | { type: 'DELETE_EVENT'; payload: { id: string } }
    | { type: 'UPDATE_AREA'; payload: LifeArea }
    | { type: 'DELETE_AREA'; payload: { id: string } }
    | { type: 'SET_PERIOD'; payload: 'day' | 'week' | 'month' | 'year' }
    | { type: 'SET_AREA'; payload: string }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'MARK_NOTIFICATIONS_READ'; payload: { ids: string[] } } // Pass empty array to mark all
    | { type: 'CLEAR_NOTIFICATIONS'; payload: undefined }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['notificationSettings']> };

// --- Helpers ---
function calculateGoalProgress(current: number, start: number, target: number): number {
    const total = Math.abs(target - start);
    if (total === 0) return 0; // Avoid division by zero
    const diff = Math.abs(current - start);
    return Math.min(100, Math.max(0, Math.round((diff / total) * 100)));
}

// --- Initial State ---
// --- Initial State ---


const INITIAL_STATE: AppState = {
    user: { name: '', avatar: '' }, // Empty user
    areas: [],
    goals: [],
    projects: [],
    actions: [],
    routines: [],
    events: [],
    habits: [],
    habitLogs: [],
    focuses: [],
    checkIns: [],
    insights: [],
    periods: [],
    experiments: [],
    notes: [],
    journal: [],
    files: [],
    library: [],
    notifications: [],
    notificationSettings: {
        enabled: true,
        sound: true,
        email: false,
        push: true,
        reminders: true
    },
    metricDefinitions: [],
    metricEntries: [],
    logs: {},
    period: 'day',
    selectedAreaId: 'all',
    isLoading: true,
};

// --- Reducer ---
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'INIT_DATA': {
            // Data sanitization: Ensure valid dates for Journal
            const sanitizedJournal = action.payload.journal?.map((j: any) => ({
                ...j,
                date: (j.date instanceof Date)
                    ? j.date.toISOString().split('T')[0]
                    : (typeof j.date === 'string' ? j.date.split('T')[0] : j.date)
            })) || [];

            // Notifications retention (30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const validNotifications = action.payload.notifications?.filter(n => {
                const date = new Date(n.date);
                return date >= thirtyDaysAgo;
            }) || [];

            // 1. Calculate the latest metric values on load
            const metricMap = new Map<string, number>();

            // Sort entries so we process older ones first, leaving the latest in the map
            // or just find the latest for each metric.
            const sortedEntries = [...(action.payload.metricEntries || [])].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            sortedEntries.forEach(entry => {
                metricMap.set(entry.metricId, entry.value);
            });

            // 2. Sync Goals with Latest Metrics
            const validGoals = (action.payload.goals || []).map(goal => {
                if (goal.targetMetricId && metricMap.has(goal.targetMetricId)) {
                    const current = metricMap.get(goal.targetMetricId)!;
                    const start = goal.metricStartValue ?? 0;
                    const target = goal.metricTargetValue ?? 100;

                    let progress = goal.progress || 0;
                    const total = Math.abs(target - start);
                    if (total > 0 && goal.status !== 'completed') {
                        const diff = Math.abs(current - start);
                        progress = Math.min(100, Math.max(0, Math.round((diff / total) * 100)));
                    }

                    return {
                        ...goal,
                        metricCurrentValue: current,
                        progress: goal.status === 'completed' ? 100 : progress
                    };
                }
                return goal;
            });

            return {
                ...state,
                ...action.payload,
                journal: sanitizedJournal,
                notifications: validNotifications,
                goals: validGoals,
                isLoading: false
            };
        }
        case 'ADD_ACTION':
            return { ...state, actions: [action.payload, ...state.actions] };
        case 'UPDATE_ACTION':
            return { ...state, actions: state.actions.map(a => a.id === action.payload.id ? action.payload : a) };
        case 'DELETE_ACTION':
            return { ...state, actions: state.actions.filter(a => a.id !== action.payload.id) };
        case 'TOGGLE_ACTION':
            return { ...state, actions: state.actions.map(a => a.id === action.payload.id ? { ...a, completed: !a.completed } : a) };
        case 'ADD_ROUTINE':
            return { ...state, routines: [...state.routines, action.payload] };
        case 'UPDATE_ROUTINE':
            return { ...state, routines: state.routines.map(r => r.id === action.payload.id ? action.payload : r) };
        case 'DELETE_ROUTINE':
            return { ...state, routines: state.routines.filter(r => r.id !== action.payload.id) };
        case 'ADD_HABIT':
            return { ...state, habits: [...state.habits, action.payload] };
        case 'UPDATE_HABIT':
            return { ...state, habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h) };
        case 'DELETE_HABIT':
            return { ...state, habits: state.habits.filter(h => h.id !== action.payload.id) };
        case 'LOG_HABIT': {
            // 1. Update/Add Log
            let newLogs = [...state.habitLogs];
            const existingLogIndex = newLogs.findIndex(l => l.habitId === action.payload.habitId && l.date === action.payload.date);

            if (existingLogIndex >= 0) {
                newLogs[existingLogIndex] = action.payload;
            } else {
                newLogs.push(action.payload);
            }

            // 2. Recalculate Streak
            // We need to check the habit's specific logs from newLogs
            const habitId = action.payload.habitId;
            const habitLogs = newLogs.filter(l => l.habitId === habitId && l.completed);

            // Sort desc
            habitLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let streak = 0;
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // Check if today is done
            const isTodayDone = habitLogs.some(l => l.date === todayStr);

            // Start checking from Today (if done) or Yesterday (if not done today, streak might still be alive from yesterday)
            // Actually, usually streak = contiguous days ending at Today of Yesterday.
            // If I haven't done today YET, my streak is still X (from yesterday).
            // If I do today, it becomes X+1.
            // If I missed yesterday, streak is 0.

            let checkDate = new Date(today);
            // If today is NOT done, we shouldn't count it, but we should start checking from yesterday to see if streak is preserved.
            if (!isTodayDone) {
                checkDate.setDate(checkDate.getDate() - 1);
            }

            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                const hasLog = habitLogs.some(l => l.date === dateStr);

                if (hasLog) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            // 3. Update Habit
            const updatedHabits = state.habits.map(h =>
                h.id === habitId ? { ...h, streak } : h
            );

            return { ...state, habitLogs: newLogs, habits: updatedHabits };
        }
        case 'DELETE_HABIT_LOG':
            return { ...state, habitLogs: state.habitLogs.filter(l => l.id !== action.payload.id) };
        case 'ADD_GOAL': {
            const goal = action.payload;
            // Auto-calculate progress if metric data exists
            if (goal.targetMetricId && goal.metricStartValue !== undefined && goal.metricTargetValue !== undefined) {
                const current = goal.metricCurrentValue ?? goal.metricStartValue;
                const calculatedProgress = calculateGoalProgress(current, goal.metricStartValue, goal.metricTargetValue);
                // Only override if progress wasn't explicitly set (e.g. to 100) or if it looks default
                // Actually, for consistency, we probably SHOULD override unless status is completed.
                if (goal.status !== 'completed') {
                    goal.progress = calculatedProgress;
                }
            }
            return { ...state, goals: [...state.goals, goal] };
        }
        case 'UPDATE_GOAL': {
            const updatedGoal = action.payload;
            // Auto-calculate progress if metric data exists and NOT completed
            if (updatedGoal.targetMetricId && updatedGoal.metricStartValue !== undefined && updatedGoal.metricTargetValue !== undefined && updatedGoal.status !== 'completed') {
                const current = updatedGoal.metricCurrentValue ?? updatedGoal.metricStartValue;
                updatedGoal.progress = calculateGoalProgress(current, updatedGoal.metricStartValue, updatedGoal.metricTargetValue);
            }
            return { ...state, goals: state.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g) };
        }
        case 'DELETE_GOAL':
            return { ...state, goals: state.goals.filter(g => g.id !== action.payload.id) };
        case 'UPDATE_GOAL_PROGRESS':
            return {
                ...state,
                goals: state.goals.map(g =>
                    g.id === action.payload.id ? { ...g, progress: action.payload.progress } : g
                )
            };
        case 'ADD_PROJECT': return { ...state, projects: [...state.projects, action.payload] };
        case 'UPDATE_PROJECT': return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PROJECT': return { ...state, projects: state.projects.filter(p => p.id !== action.payload.id) };
        case 'ADD_FOCUS': return { ...state, focuses: [action.payload, ...state.focuses] };
        case 'ADD_CHECKIN': return { ...state, checkIns: [action.payload, ...state.checkIns] };
        case 'ADD_INSIGHT': return { ...state, insights: [action.payload, ...state.insights] };
        case 'ADD_PERIOD': return { ...state, periods: [action.payload, ...state.periods] };
        case 'ADD_EXPERIMENT': return { ...state, experiments: [action.payload, ...state.experiments] };
        case 'ADD_NOTE': return { ...state, notes: [action.payload, ...state.notes] };
        case 'UPDATE_NOTE': return { ...state, notes: state.notes.map(n => n.id === action.payload.id ? action.payload : n) };
        case 'DELETE_NOTE': return { ...state, notes: state.notes.filter(n => n.id !== action.payload.id) };
        case 'ADD_JOURNAL': return { ...state, journal: [action.payload, ...state.journal] };
        case 'UPDATE_JOURNAL': return { ...state, journal: state.journal.map(j => j.id === action.payload.id ? action.payload : j) };
        case 'DELETE_JOURNAL': return { ...state, journal: state.journal.filter(j => j.id !== action.payload.id) };
        case 'ADD_FILE': return { ...state, files: [action.payload, ...state.files] };
        case 'UPDATE_FILE': return { ...state, files: state.files.map(f => f.id === action.payload.id ? action.payload : f) };
        case 'DELETE_FILE': return { ...state, files: state.files.filter(f => f.id !== action.payload.id) };
        case 'ADD_LIBRARY_ITEM': return { ...state, library: [action.payload, ...state.library] };
        case 'UPDATE_LIBRARY_ITEM': return { ...state, library: state.library.map(l => l.id === action.payload.id ? action.payload : l) };
        case 'DELETE_LIBRARY_ITEM': return { ...state, library: state.library.filter(l => l.id !== action.payload.id) };
        case 'ADD_METRIC_DEF': return { ...state, metricDefinitions: [action.payload, ...state.metricDefinitions] };
        case 'ADD_METRIC_ENTRY': {
            const newEntry = action.payload;

            // 1. Update Goals tracking this metric
            const updatedGoals = state.goals.map(goal => {
                if (goal.targetMetricId === newEntry.metricId) {
                    const start = goal.metricStartValue ?? 0;
                    const target = goal.metricTargetValue ?? 100;
                    const current = newEntry.value;

                    // Recalculate Progress
                    const total = Math.abs(target - start);
                    let progress = 0;
                    if (total > 0) {
                        const diff = Math.abs(current - start);
                        progress = Math.min(100, Math.max(0, Math.round((diff / total) * 100)));
                    }

                    // Check if achieved? (We just update progress/value here)
                    return {
                        ...goal,
                        metricCurrentValue: current,
                        progress
                    };
                }
                return goal;
            });

            return {
                ...state,
                metricEntries: [newEntry, ...state.metricEntries],
                goals: updatedGoals
            };
        }
        case 'ADD_EVENT': return { ...state, events: [action.payload, ...state.events] };
        case 'UPDATE_EVENT': return { ...state, events: state.events.map(e => e.id === action.payload.id ? action.payload : e) };
        case 'DELETE_EVENT': return { ...state, events: state.events.filter(e => e.id !== action.payload.id) };
        case 'UPDATE_AREA':
            return {
                ...state,
                areas: state.areas.map(a => a.id === action.payload.id ? action.payload : a)
            };
        case 'DELETE_AREA':
            return { ...state, areas: state.areas.filter(a => a.id !== action.payload.id) };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_PERIOD':
            return { ...state, period: action.payload };
        case 'SET_AREA':
            return { ...state, selectedAreaId: action.payload };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [action.payload, ...state.notifications] };
        case 'MARK_NOTIFICATIONS_READ':
            if (action.payload.ids.length === 0) {
                // Mark all as read
                return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
            }
            return { ...state, notifications: state.notifications.map(n => action.payload.ids.includes(n.id) ? { ...n, read: true } : n) };
        case 'CLEAR_NOTIFICATIONS':
            return state; // No longer user-clearable, cleared 30 days automatically
        case 'UPDATE_SETTINGS':
            return {
                ...state,
                notificationSettings: { ...state.notificationSettings, ...action.payload }
            };
        default:
            return state;
    }
}


// --- Context ---
const DataContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}>({
    state: INITIAL_STATE,
    dispatch: () => null,
});


// --- Provider ---
export function DataProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
    const { user } = useAuth();

    // Reset state when user logs out
    useEffect(() => {
        if (!user) {
            dispatch({ type: 'INIT_DATA', payload: INITIAL_STATE });
        }
    }, [user]);

    // Load data
    useEffect(() => {
        if (!user) return; // Don't load if no user

        const loadData = async () => {
            // 2. Always Sync with Server (Source of Truth)
            try {
                const res = await fetch('/api/sync');
                if (res.ok) {
                    const apiData = await res.json();
                    dispatch({ type: 'INIT_DATA', payload: apiData });
                }
            } catch (e) {
                console.error("Sync failed", e);
                // Fallback to empty/default state on error, or could show toast
            }

            dispatch({ type: 'SET_LOADING', payload: false });
        };
        loadData();
    }, [user]);

    // Force Sync User Profile (Name/Avatar) from Auth to State
    useEffect(() => {
        if (user && user.name && user.name !== state.user.name) {
            // calculated avatar fallback if needed, but usually we just want the name sync
            dispatch({
                type: 'INIT_DATA',
                payload: {
                    user: {
                        name: user.name,
                        avatar: state.user.avatar || user.avatar || '/avatar.png'
                    }
                }
            });
        }
    }, [user, state.user.name, state.user.avatar]);

    // Sync changes to Local Storage - REMOVED for DB Only approach
    // useEffect(() => {
    //     if (!state.isLoading && user && user.id) {
    //         const storageKey = `nexis-data-${user.id}`;
    //         const dataToSave = { ...state, isLoading: false };
    //         localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    //     }
    // }, [state, user]);

    // Auto-translate legacy English areas (Migration)
    useEffect(() => {
        if (state.isLoading || state.areas.length === 0) return;

        const translationMap: Record<string, string> = {
            'Health': 'Здоровʼя',
            'Body & Energy': 'Здоровʼя',
            'Здоров\'я та Енергія': 'Здоровʼя',
            'Finance': 'Фінанси',
            'Career': 'Карʼєра',
            'Career & Business': 'Карʼєра',
            'Кар\'єра та Бізнес': 'Карʼєра',
            'Personal': 'Особисте',
            'Relationships': 'Відносини',
            'Family & Relations': 'Відносини',
            'Learning': 'Навчання',
            'Growth & Learning': 'Навчання',
            'Розвиток та Навчання': 'Навчання',
            'Projects': 'Проекти',
            'Travel': 'Подорожі',
            'Spirituality': 'Духовність',
        };

        const deleteSet = new Set([
            'Lifestyle',
            'Lifestyle & Fun',
            'Лайфстайл та Враження',
            'Яскравість Життя'
        ]);

        state.areas.forEach(area => {
            if (deleteSet.has(area.title)) {
                wrappedDispatch({ type: 'DELETE_AREA', payload: { id: area.id } });
            } else if (translationMap[area.title]) {
                const newTitle = translationMap[area.title];
                // Only update if actually different to avoid loops (though dependency is emptyish)
                if (area.title !== newTitle) {
                    wrappedDispatch({
                        type: 'UPDATE_AREA',
                        payload: { ...area, title: newTitle }
                    });
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isLoading, state.areas.length]); // Run mainly on load



    // Sync to API
    const performSync = async (action: AppAction) => {
        if (action.type === 'INIT_DATA' || action.type === 'SET_LOADING' || action.type === 'SET_PERIOD' || action.type === 'SET_AREA') return;

        try {
            // "data" is the payload. For ADD_ACTION, payload is the Action object.
            // For DELETE_ACTION, payload is { id }.
            // The API expects { type: "ADD_ACTION", data: { ... } }
            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: action.type, data: action.payload }),
            });
            if (action.type === 'ADD_JOURNAL') {
                // console.log('Synced Journal:', action.payload); 
            }
        } catch (e) {
            console.error("Sync failed", e);
            toast.error("Помилка синхронізації (Sync failed)");
        }
    };

    const wrappedDispatch = (action: AppAction) => {
        dispatch(action);
        performSync(action);
    };

    return (
        <DataContext.Provider value={{ state, dispatch: wrappedDispatch }}>
            {children}
        </DataContext.Provider>
    );
}

// --- Hook ---
export function useData() {
    return useContext(DataContext);
}

export function useFilteredData() {
    const { state } = useData();
    const { period, selectedAreaId, actions, goals, projects, areas } = state;

    const isAreaActive = selectedAreaId !== 'all';

    const filteredActions = actions.filter(item => isAreaActive ? item.areaId === selectedAreaId : true);
    const filteredGoals = goals.filter(item => isAreaActive ? item.areaId === selectedAreaId : true);
    const filteredProjects = projects.filter(item => isAreaActive ? item.areaId === selectedAreaId : true);

    const selectedArea = areas.find(a => a.id === selectedAreaId);
    const areaLabel = selectedArea ? selectedArea.title : 'All Areas';
    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
    const contextTitle = `${periodLabel} · ${areaLabel}`;
    const activeColor = selectedArea ? selectedArea.color : 'bg-slate-900';

    return {
        ...state,
        filteredActions,
        filteredGoals,
        filteredProjects,
        contextTitle,
        activeArea: selectedArea,
        activeColor
    };
}
