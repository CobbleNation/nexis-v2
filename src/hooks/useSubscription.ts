import { useAuth } from '@/lib/auth-context';
import { LIMITS, SUBSCRIPTION_PLAN, SubscriptionTier, CHECK_LIMIT } from '@/lib/limits';
import { useData } from '@/lib/store';

export function useSubscription() {
    const { user } = useAuth();
    const { state } = useData();

    // Default to FREE if no tier specified
    const tier: SubscriptionTier = user?.subscriptionTier || SUBSCRIPTION_PLAN.FREE;

    // Check if user is on PRO plan AND it hasn't expired yet
    const now = new Date();
    const isPro = tier === SUBSCRIPTION_PLAN.PRO &&
        (!user?.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > now);

    // Create a merged limits object for backwards compatibility where `limits.MAX_GOALS` was used directly
    const customLimits = user?.customLimits;

    // We import CHECK_LIMIT from limits.ts but we can't easily destructure it. 
    // Wait, let's just use CHECK_LIMIT properly
    const checkLimit = (feature: keyof typeof LIMITS['free']) => {
        const hasFullAi = CHECK_LIMIT(tier, 'HAS_FULL_AI', customLimits);
        // If the user has Full AI access, it unlocks specific AI-driven features
        if (hasFullAi === true && (
            feature.startsWith('HAS_AI') ||
            feature === 'HAS_HISTORY_ANALYTICS' ||
            feature === 'HAS_VOICE'
        )) {
            return true;
        }
        return CHECK_LIMIT(tier, feature, customLimits);
    };

    // Specific limit checks
    const canCreateGoal = () => {
        const limit = checkLimit('MAX_GOALS');
        if (limit === Infinity) return true;

        // Count active goals (not completed/archived)
        const activeGoals = state.goals.filter(g => g.status !== 'completed' && g.status !== 'achieved' && g.status !== 'abandoned').length;
        return activeGoals < (limit as number);
    };

    const canCreateTask = () => {
        const limit = checkLimit('MAX_TASKS');
        if (limit === Infinity) return true;

        // Count active tasks
        const activeTasks = state.actions.filter(a => !a.completed && a.status !== 'canceled' && a.status !== 'deferred').length;
        return activeTasks < (limit as number);
    };

    const canCreateJournalEntry = () => {
        const limit = checkLimit('MAX_JOURNAL_ENTRIES');
        if (limit === Infinity) return true;
        return state.journal.length < (limit as number);
    };

    const canCreateNote = () => {
        const limit = checkLimit('MAX_NOTES');
        if (limit === Infinity) return true;
        return state.notes.length < (limit as number);
    };

    const getDailyAiUsage = () => {
        if (typeof window === 'undefined') return 0;
        const today = new Date().toISOString().split('T')[0];
        const key = `zynorvia_ai_usage_${today}`;
        return parseInt(localStorage.getItem(key) || '0', 10);
    };

    const canUseAiHint = () => {
        const limit = checkLimit('MAX_AI_HINTS');
        if (limit === Infinity) return true;

        const usage = getDailyAiUsage();
        return usage < (limit as number);
    };

    const recordAiHintUsage = () => {
        const limit = checkLimit('MAX_AI_HINTS');
        if (limit === Infinity) return;

        if (typeof window === 'undefined') return;
        const today = new Date().toISOString().split('T')[0];
        const key = `zynorvia_ai_usage_${today}`;
        const current = getDailyAiUsage();
        localStorage.setItem(key, (current + 1).toString());
    };

    return {
        tier,
        isPro,
        limits: LIMITS[tier], // Keep raw plan limits for any direct access that doesn't use checkLimit
        checkLimit,
        canCreateGoal,
        canCreateTask,
        canCreateJournalEntry,
        canCreateNote,
        canUseAiHint,
        recordAiHintUsage
    };
}
