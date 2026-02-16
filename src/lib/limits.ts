export const SUBSCRIPTION_PLAN = {
    FREE: 'free',
    PRO: 'pro'
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_PLAN[keyof typeof SUBSCRIPTION_PLAN];

export const LIMITS = {
    [SUBSCRIPTION_PLAN.FREE]: {
        MAX_GOALS: 3,
        MAX_TASKS: 10, // Active tasks
        MAX_JOURNAL_ENTRIES: 20, // Total or per month? User said "20 entries". Let's assume total for now as "mirror".
        MAX_NOTES: 20,
        MAX_AI_HINTS: 2, // Per day
        HAS_SUBGOALS: false,
        HAS_AI_GOAL_BREAKDOWN: false,
        HAS_GOAL_ANALYTICS: false,
        HAS_TASK_PRIORITY: false,
        HAS_RECURRING_TASKS: false,
        HAS_SMART_FILTERS: false,
        HAS_AUTO_PLANNING: false,
        HAS_WEEKLY_VIEW: false,
        HAS_MONTHLY_VIEW: false,
        HAS_TAGS: false,
        HAS_SEARCH: false,
        HAS_AI_SUMMARIES: false,
        HAS_HISTORY_ANALYTICS: false,
        HAS_FULL_AI: false,
        HAS_VOICE: false,
    },
    [SUBSCRIPTION_PLAN.PRO]: {
        MAX_GOALS: Infinity,
        MAX_TASKS: Infinity,
        MAX_JOURNAL_ENTRIES: Infinity,
        MAX_NOTES: Infinity,
        MAX_AI_HINTS: Infinity,
        HAS_SUBGOALS: true,
        HAS_AI_GOAL_BREAKDOWN: true,
        HAS_GOAL_ANALYTICS: true,
        HAS_TASK_PRIORITY: true,
        HAS_RECURRING_TASKS: true,
        HAS_SMART_FILTERS: true,
        HAS_AUTO_PLANNING: true,
        HAS_WEEKLY_VIEW: true,
        HAS_MONTHLY_VIEW: true,
        HAS_TAGS: true,
        HAS_SEARCH: true,
        HAS_AI_SUMMARIES: true,
        HAS_HISTORY_ANALYTICS: true,
        HAS_FULL_AI: true,
        HAS_VOICE: false,
    }
};

export const CHECK_LIMIT = (tier: SubscriptionTier = 'free', feature: keyof typeof LIMITS['free']) => {
    return LIMITS[tier][feature];
};
