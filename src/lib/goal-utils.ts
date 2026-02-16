import { Goal, MetricEntry, Action } from '@/types';
import { differenceInDays } from 'date-fns';

export interface ComputedGoalStatus {
    progress: number; // 0-100
    displayStatus: 'on-track' | 'at-risk' | 'off-track' | 'completed' | 'not-started';
    reason: string;
    isMetricBased: boolean;
}

/**
 * Calculates the 'Truthful' progress of a goal.
 * Rule: Only Strategic goals have numeric progress based on Metrics.
 * Vision goals have no progress.
 * Tactical goals might have binary progress or sub-item based? User said: "System must strictly separate Actions from Outcome".
 * So Tactical goals (which are short term milestones) likely also rely on outcome? 
 * Actually, user said: "Tacitcal goals ... Example: 30 days without skipping". That implies metric (streak) or just completion.
 * Let's assume Tactical can be manual or metric, but Strategic MUST be metric.
 */
export function calculateGoalProgress(
    goal: Goal,
    currentMetricValue?: number,
    linkedActions: Action[] = []
): ComputedGoalStatus {
    // 1. Vision Goals: No progress tracking
    if (goal.type === 'vision') {
        return {
            progress: 0,
            displayStatus: 'on-track', // Vision is always "there" as a compass
            reason: 'Напрямок руху (Vision)',
            isMetricBased: false
        };
    }

    // 2. Strategic Goals: STRICT Metric Dependency
    if (goal.type === 'strategic') {
        if (!goal.targetMetricId) {
            return {
                progress: 0,
                displayStatus: 'not-started',
                reason: 'Немає привʼязаної метрики (Результат неможливо виміряти)',
                isMetricBased: true
            };
        }

        if (goal.metricStartValue === undefined || goal.metricTargetValue === undefined) {
            return {
                progress: 0,
                displayStatus: 'not-started',
                reason: 'Не задані цільові значення метрики',
                isMetricBased: true
            };
        }

        const start = goal.metricStartValue;
        const target = goal.metricTargetValue;
        const current = currentMetricValue ?? start; // Default to start if no entry

        const totalChange = target - start;
        const currentChange = current - start;

        // Prevent division by zero
        if (totalChange === 0) return { progress: 100, displayStatus: 'completed', reason: 'Ціль досягнуто', isMetricBased: true };

        let progressPercent = (currentChange / totalChange) * 100;

        // Clamp 0-100
        progressPercent = Math.max(0, Math.min(100, progressPercent));

        // Determine Status based on progress vs time (simple version) or just progress
        let status: ComputedGoalStatus['displayStatus'] = 'on-track';
        let reason = 'Рух до цілі';

        if (progressPercent >= 100) {
            status = 'completed';
            reason = 'Ціль досягнуто';
        } else if (progressPercent === 0 && linkedActions.length > 0) {
            status = 'at-risk';
            reason = 'Дії є, але результат відсутній'; // Honest status
        } else if (progressPercent === 0) {
            status = 'not-started';
            reason = 'Поки без змін';
        } else {
            // If we had time info, we could say "Slower than expected"
            status = 'on-track';
            reason = `Прогрес ${progressPercent.toFixed(1)}%`;
        }

        return {
            progress: progressPercent,
            displayStatus: status,
            reason,
            isMetricBased: true
        };
    }

    // 3. Tactical Goals (Milestones): Can be simple completion or metric
    // For now, treat as manual completion or check subgoals?
    // User said: "Can be subgoals... Limited number".
    // Let's assume for MVP they are binary? Or manual progress?
    // User: "Progress = current change / scheduled".
    // Let's treat them similar to Strategic if they have metrics, otherwise manual?
    // For now, let's keep it simple: Tactical behaves like Strategic if metrics exist, otherwise Manual scale (0-100).

    // Quick fallback for tactical without metric
    if (!goal.targetMetricId) {
        // Fallback to existing manual progress logic or subtasks?
        // User hates "Tasks = Progress".
        // Let's just return current manual progress but mark it as "Manual Estimate".
        return {
            progress: goal.progress || 0,
            displayStatus: goal.progress >= 100 ? 'completed' : 'on-track',
            reason: 'Ручна оцінка (Tactical)',
            isMetricBased: false
        };
    }

    // If tactical has metric, use same logic as strategic
    return calculateGoalProgress({ ...goal, type: 'strategic' }, currentMetricValue, linkedActions);
}
