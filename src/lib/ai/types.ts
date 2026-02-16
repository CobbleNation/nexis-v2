
export type IntentType = 'GOAL' | 'TASK' | 'NOTE' | 'JOURNAL' | 'PROJECT' | 'METRIC';

export interface BaseIntent {
    type: IntentType;
    originalInput: string;
    confidence: number;
    requiresConfirmation: boolean;
    confirmationQuestion?: string;
}

export interface GoalIntent extends BaseIntent {
    type: 'GOAL';
    data: {
        title: string;
        description?: string;
        type: 'strategic' | 'tactical' | 'vision';
        areaId?: string;
        deadline?: string;
        metric?: {
            name: string;
            unit: string;
            startValue?: number;
            targetValue?: number;
            currentValue?: number;
        };
    };
}

export interface TaskIntent extends BaseIntent {
    type: 'TASK';
    data: {
        title: string;
        date?: string; // ISO date
        time?: string; // HH:mm
        durationMinutes?: number;
        areaId?: string;
        projectId?: string;
        goalId?: string;
        priority?: 'low' | 'medium' | 'high';
    };
}

export interface NoteIntent extends BaseIntent {
    type: 'NOTE';
    data: {
        content: string;
        areaId?: string;
        tags?: string[];
    };
}

export interface JournalIntent extends BaseIntent {
    type: 'JOURNAL';
    data: {
        content: string;
        sentiment?: 'positive' | 'neutral' | 'negative';
        tags?: string[];
    };
}

export interface ProjectIntent extends BaseIntent {
    type: 'PROJECT';
    data: {
        title: string;
        description?: string;
        areaId?: string;
        deadline?: string;
        status: 'active' | 'planning' | 'on_hold';
    };
}

export type AssistantAction = GoalIntent | TaskIntent | NoteIntent | JournalIntent | ProjectIntent;

export interface AssistantResponse {
    action?: AssistantAction;
    reply: string; // The text response to speak/show to the user
    suggestions?: string[]; // Quick reply suggestions
}

export interface GoalBreakdownResponse {
    subTasks: {
        title: string;
        estimatedDuration: number; // minutes
    }[];
}

export interface MetricSuggestionResponse {
    metrics: {
        name: string;
        unit: string;
        targetValueSuggestion?: number;
    }[];
}

export interface DayExplanationResponse {
    explanation: string;
    insight: string;
    theme: string;
}
