export interface LifeArea {
    id: string;
    title: string;
    color: string;
    icon?: string;
    iconName?: string;
    order?: number;
}

export interface Goal {
    id: string;
    title: string;
    description?: string;
    status: 'active' | 'completed' | 'paused';
    priority?: 'low' | 'medium' | 'high';
    progress: number;
    areaId?: string;
    startDate?: string;
    deadline?: string;
    type?: string;
    subGoals?: { id: string; title: string; completed: boolean }[];
}

export interface Action {
    id: string;
    title: string;
    description?: string;
    type: 'task' | 'habit';
    status: string;
    priority?: 'low' | 'medium' | 'high';
    completed: boolean;
    areaId?: string;
    projectId?: string;
    linkedGoalId?: string;
    date?: string;
    startTime?: string;
    duration?: number;
    isFocus?: boolean;
    subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface Project {
    id: string;
    title: string;
    description?: string;
    status: 'active' | 'completed' | 'paused';
    areaId?: string;
    goalIds?: string[];
}

export interface Habit {
    id: string;
    title: string;
    areaId?: string;
    frequency?: string;
    streak?: number;
    status?: string;
}

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    date: string;
}
