import { useAuth } from '@/lib/auth-context';
import { LIMITS, SUBSCRIPTION_PLAN, SubscriptionTier } from '@/lib/limits';
import { useData } from '@/lib/store';

export function useSubscription() {
    const { user } = useAuth();
    const { state } = useData();

    // Default to FREE if no tier specified
    const tier: SubscriptionTier = user?.subscriptionTier || SUBSCRIPTION_PLAN.FREE;
    const isPro = tier === SUBSCRIPTION_PLAN.PRO;
    const limits = LIMITS[tier];

    const checkLimit = (feature: keyof typeof LIMITS['free']) => {
        return limits[feature];
    };

    // Specific limit checks
    const canCreateGoal = () => {
        if (isPro) return true;

        // Count active goals (not completed/archived)
        const activeGoals = state.goals.filter(g => g.status !== 'completed' && g.status !== 'achieved' && g.status !== 'abandoned').length;
        return activeGoals < (limits.MAX_GOALS as number);
    };

    const canCreateTask = () => {
        if (isPro) return true;

        // Count active tasks
        const activeTasks = state.actions.filter(a => !a.completed && a.status !== 'canceled' && a.status !== 'deferred').length;
        return activeTasks < (limits.MAX_TASKS as number);
    };

    const canCreateJournalEntry = () => {
        if (isPro) return true;
        return state.journal.length < (limits.MAX_JOURNAL_ENTRIES as number);
    };

    const canCreateNote = () => {
        if (isPro) return true;
        return state.notes.length < (limits.MAX_NOTES as number);
    };

    const getDailyAiUsage = () => {
        if (typeof window === 'undefined') return 0;
        const today = new Date().toISOString().split('T')[0];
        const key = `nexis_ai_usage_${today}`;
        return parseInt(localStorage.getItem(key) || '0', 10);
    };

    const canUseAiHint = () => {
        if (isPro) return true;
        const usage = getDailyAiUsage();
        return usage < (limits.MAX_AI_HINTS as number);
    };

    const recordAiHintUsage = () => {
        if (isPro) return;
        if (typeof window === 'undefined') return;
        const today = new Date().toISOString().split('T')[0];
        const key = `nexis_ai_usage_${today}`;
        const current = getDailyAiUsage();
        localStorage.setItem(key, (current + 1).toString());
    };

    return {
        tier,
        isPro,
        limits,
        checkLimit,
        canCreateGoal,
        canCreateTask,
        canCreateJournalEntry,
        canCreateNote,
        canUseAiHint,
        recordAiHintUsage
    };
}
