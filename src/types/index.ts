export type LifeAreaStatus = 'up' | 'down' | 'stable';

export interface LifeArea {
    id: string;
    title: string;
    iconName: string; // lucide icon name
    icon?: string; // fallback alias
    description?: string;
    color: string;
    priority?: number; // 1-10;
    connections?: string[]; // IDs of related areas
    status: LifeAreaStatus;
}

export interface DayLog {
    date: string;
    focus: string[];
    mood?: number;
    notes?: string;
}

export type ActionType = 'task' | 'routine_instance' | 'project' | 'event';

export interface Action {
    id: string;
    userId: string;
    title: string;
    description?: string;
    // Nexis: Cleaned up structure
    type: 'task' | 'routine_instance'; // 'habit' deprecated in favor of routine system
    status: 'pending' | 'in-progress' | 'completed' | 'canceled' | 'deferred';
    completed: boolean;

    // Core
    areaId?: string;
    linkedGoalId?: string;
    projectId?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    date?: string;
    dueDate?: Date | string; // Deadline
    scheduledTime?: string; // HH:MM or specific date
    streak?: number;
    priority?: 'low' | 'medium' | 'high';
    expectedResult?: string;
    frequency?: string;

    // Nexis New Fields
    fromRoutineId?: string;
    isFocus?: boolean;
    energyLevel?: 'high' | 'medium' | 'low'; // Post-completion check
    impact?: string; // "Supports [Area]"
    duration?: number; // Minutes
    startTime?: string; // "HH:mm"
    subtasks?: { id: string; title: string; completed: boolean; }[];
    reminderAt?: string; // ISO Date for specific reminder
    reminderSent?: boolean;
    isSystemDefault?: boolean;
}

export interface Routine {
    id: string;
    userId: string;
    title: string;
    areaId?: string;
    frequency: 'daily' | 'weekly' | 'manual';
    daysOfWeek?: number[]; // 0-6
    time?: string; // HH:mm
    linkedGoalId?: string;
    createdAt: Date | string;
    lastGeneratedDate?: string; // To track daily generation
    duration?: number; // Minutes
    isSystemDefault?: boolean;
}

export type HabitType = 'binary' | 'quantitative';
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
    id: string;
    userId: string;
    title: string;
    areaId: string;
    type: HabitType;
    frequency: HabitFrequency; // daily basis default
    daysOfWeek?: number[]; // for custom frequency

    // Quantitative
    targetValue?: number; // e.g. 2000 (ml)
    unit?: string; // e.g. 'ml', 'min', 'pages'
    minimum?: string; // Minimum viable habit

    // Integration
    relatedMetricIds?: string[]; // IDs of metrics this habit analytically influences
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';

    status: 'active' | 'paused' | 'archived';

    createdAt: string | Date;
    streak: number;
    isSystemDefault?: boolean;
}

export interface HabitLog {
    id: string;
    habitId: string;
    date: string; // YYYY-MM-DD
    value: number; // 1 for binary true, actual number for quantitative
    completed: boolean; // derived from value >= targetValue
    notes?: string;
}

export type GoalType = 'vision' | 'strategic' | 'tactical';

export interface Goal {
    id: string;
    userId?: string;
    title: string;
    description?: string;
    areaId: string;
    type: GoalType;

    // Metric Driven Outcome (For Strategic)
    targetMetricId?: string;
    metricTargetValue?: number;
    metricStartValue?: number;
    metricCurrentValue?: number;
    metricDirection?: 'increase' | 'decrease' | 'maintain'; // New field
    additionalMetricIds?: string[]; // For tracking secondary metrics

    horizon?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    deadline?: string;
    startDate?: string;

    progress: number; // calculated %
    status: 'active' | 'completed' | 'paused' | 'achieved' | 'not_achieved' | 'abandoned';
    priority?: 'low' | 'medium' | 'high';

    subGoals?: { id: string; title: string; completed: boolean }[];
    expectedImpact?: string;

    createdAt?: Date | string;
    updatedAt?: Date | string;
    endDate?: Date | string;
    isSystemDefault?: boolean;
}

export interface Focus {
    id: string;
    userId: string;
    title: string;
    areaId?: string;
    period: 'day' | 'week';
    date: string; // Date of the focus
    reason?: string;
    expectedEffect?: string;
    linkedEntityIds?: string[];
    createdAt: string;
}

export interface CheckIn {
    id: string;
    userId: string;
    areaId: string;
    date: string;
    rating: number; // 1-10
    comment?: string;
    impactDescription?: string; // How it affects other areas
    createdAt: string;
}

export interface Insight {
    id: string;
    userId: string;
    title: string;
    content: string;
    type: 'observation' | 'error' | 'discovery' | 'pattern';
    relatedAreaIds?: string[];
    date: string;
    linkedEntityId?: string; // e.g., learned from a specific task
    createdAt: string;
}

export interface Period {
    id: string;
    userId: string;
    title: string;
    type: 'week' | 'month' | 'custom';
    startDate: string;
    endDate: string;
    mainFocus?: string;
    goalIds?: string[];
    expectedResult?: string;
    createdAt: string;
}

export interface Experiment {
    id: string;
    userId: string;
    title: string;
    areaId?: string;
    hypothesis: string;
    startDate: string;
    endDate?: string;
    criteria: string; // Success criteria
    result?: string;
    conclusion?: string;
    status: 'planned' | 'active' | 'completed' | 'failed';
    createdAt: string;
}

export interface Note {
    id: string;
    userId: string;
    title: string;
    content: string; // HTML
    relatedAreaIds?: string[];
    tags?: string[];
    date: string;
    audioUrl?: string; // Base64 or Blob URL
    pinned?: boolean;
    createdAt: string;
    updatedAt?: string;
    isSystemDefault?: boolean;
}

export interface AppEvent { // Renamed to avoid reserved word Event
    id: string;
    userId: string;
    title: string;
    type: 'meeting' | 'reminder' | 'milestone' | 'other';
    date: string;
    startTime?: string;
    endTime?: string;
    areaId?: string;
    linkedEntityIds?: string[];
    description?: string;
    createdAt: string;
    reminderAt?: string;
    reminderSent?: boolean;
}

export interface Project {
    id: string;
    title: string;
    areaId?: string;
    goalIds?: string[];
    status: 'active' | 'completed' | 'paused';
    deadline?: string;
    description?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    isSystemDefault?: boolean;
}

export interface MetricDefinition {
    id: string;
    userId: string;
    areaId: string;
    name: string;

    // Onboarding
    onboardingCompleted?: boolean;
    subscriptionTier?: 'free' | 'pro';
    unit?: string; // e.g. "kg", "hours", "points" - optional for boolean
    direction: 'increase' | 'decrease' | 'neutral';
    frequency: string; // 'daily', 'weekly', etc.

    // Optional Config
    baseline?: number;
    target?: number;
    description?: string;
    options?: string[]; // For enum types

    valueType?: 'number' | 'scale' | 'boolean' | 'numeric' | 'enum'; // 'numeric' matches usage in wizard
    type?: 'number' | 'scale' | 'boolean'; // Deprecated in favor of valueType, keep for backward compat for now or migrate? I will keep it synced for now.

    createdAt: Date | string;
}

export interface MetricEntry {
    id: string;
    userId: string;
    metricId: string;
    value: number;
    date: Date | string;
    note?: string;
    createdAt: Date | string;
}

export interface JournalEntry {
    id: string;
    userId: string;
    date: string;
    content: string; // HTML or Markdown
    mood?: number; // 1-10
    tags?: string[];
    createdAt: string;
}

export interface FileAsset {
    id: string;
    userId: string;
    title: string;
    url: string; // If external or local path mock
    type: 'image' | 'document' | 'other';
    size?: string;
    relatedEntityId?: string; // e.g. linked to a note
    createdAt: string;
}

export interface LibraryItem {
    id: string;
    userId: string;
    title: string;
    type: 'book' | 'article' | 'video' | 'course' | 'link';
    url?: string;
    author?: string;
    status: 'to_consume' | 'consuming' | 'consumed';
    rating?: number; // 1-5
    notes?: string;
    areaId?: string;
    isSystemDefault?: boolean;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    date: string; // ISO date
    read: boolean;
    link?: string; // Optional link to relevant page
    createdAt: string;
}
