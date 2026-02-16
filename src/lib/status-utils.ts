import { LifeArea, Action, MetricDefinition, MetricEntry } from '@/types';
import { differenceInDays, subDays } from 'date-fns';

export type AreaStatusType = 'improving' | 'unchanged' | 'stable' | 'attention';

export interface AreaStatus {
    status: AreaStatusType;
    label: string;
    iconName: 'TrendingUp' | 'Minus' | 'AlertTriangle' | 'Activity'; // Mapping to Lucide icon names
    reason: string;
    score: number; // Contribution score: 1.0, 0.7, 0.5, 0.2
}

export const AREA_WEIGHTS: Record<string, number> = {
    'Здоровʼя': 1.3,
    'Фінанси': 1.2,
    'Карʼєра': 1.2,
    'Особисте': 1.1,
    'Відносини': 1.1,
    'Навчання': 1.0,
    'Проекти': 1.0,
    'Подорожі': 0.8
};

// Helper: Determine Metric Trend (Last 3 entries)
// Returns: 'up' | 'down' | 'flat' | 'none'
function getMetricTrend(entries: MetricEntry[]): 'up' | 'down' | 'flat' | 'none' {
    if (!entries || entries.length < 2) return 'none';

    // Sort by date desc
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    const prev = sorted[1];

    const diff = latest.value - prev.value;
    // Threshold for "flat" changes (e.g., < 1% change might be flat, but keeping it simple for now)
    if (Math.abs(diff) < 0.01) return 'flat';

    return diff > 0 ? 'up' : 'down';
}

// Main Calculation Function
export function calculateAreaStatus(
    area: LifeArea,
    actions: Action[],
    metricDefs: MetricDefinition[],
    metricEntries: MetricEntry[]
): AreaStatus {
    // 1. Activity Signals
    const areaActions = actions.filter(a => a.areaId === area.id);
    const recentActions = areaActions.filter(a => {
        const date = a.completed ? new Date(a.updatedAt) : new Date(a.updatedAt);
        return differenceInDays(new Date(), date) <= 7;
    });
    const hasActivity = recentActions.length > 0;

    // 2. Metric Signals
    const areaMetricDefs = metricDefs.filter(m => m.areaId === area.id);
    let positiveMetrics = 0;
    let negativeMetrics = 0;
    let flatMetrics = 0;
    let staleMetrics = 0; // Not updated in > 14 days

    areaMetricDefs.forEach(def => {
        const entries = metricEntries.filter(e => e.metricId === def.id);
        const trend = getMetricTrend(entries);

        // Check staleness
        if (entries.length > 0) {
            const lastEntry = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if (differenceInDays(new Date(), new Date(lastEntry.date)) > 14) {
                staleMetrics++;
            }
        } else {
            staleMetrics++; // Or just "no data"
        }

        // Assume "Higher is Better" for now unless type is distinct?
        // Ideally MetricDef should have `goalDirection`.
        // If not, we map 'up' -> positive.
        if (trend === 'up') positiveMetrics++;
        else if (trend === 'down') negativeMetrics++;
        else if (trend === 'flat') flatMetrics++;
    });

    // 3. Status Determination Logic

    // A. "Покращується" (Improving)
    // Rule: Has Actions + At least 1 Positive Metric
    if (hasActivity && positiveMetrics > 0) {
        return {
            status: 'improving',
            label: 'Покращується',
            iconName: 'TrendingUp',
            reason: 'Дії дають результат, метрики ростуть',
            score: 1.0
        };
    }

    // B. "Потребує уваги" (Attention)
    // Rule: Negative Trend OR Stale Metrics (>50% stale)
    // Also if no activity for long time but that might be "Stable" depending on context.
    // User definition: "Negative dynamics OR metrics not updated OR actions stopped after active period"
    const isStale = areaMetricDefs.length > 0 && (staleMetrics / areaMetricDefs.length) > 0.5;

    if (negativeMetrics > positiveMetrics || isStale) {
        return {
            status: 'attention',
            label: 'Потребує уваги',
            iconName: 'AlertTriangle',
            reason: isStale ? 'Метрики давно не оновлювались' : 'Негативна динаміка показників',
            score: 0.2
        };
    }

    // C. "Без змін" (Unchanged)
    // Rule: Has Actions but Metrics are Flat or No Trend
    if (hasActivity && positiveMetrics === 0 && negativeMetrics === 0) {
        return {
            status: 'unchanged',
            label: 'Без змін',
            iconName: 'Activity',
            reason: 'Дії є, але показники стабільні',
            score: 0.5
        };
    }

    // D. "Стабільно" (Stable)
    // Default fallback: No significant activity, no negative trends.
    // "Little or no actions, metrics unchanged"
    return {
        status: 'stable',
        label: 'Стабільно',
        iconName: 'Minus',
        reason: 'Все рівно, без різких змін',
        score: 0.7
    };
}

export function calculateGlobalState(statuses: { status: AreaStatus, title: string }[]): { score: number, label: string, progress: number } {
    let totalScore = 0;
    let totalWeight = 0;

    statuses.forEach(({ status, title }) => {
        // Safe weight lookup or default 1.0
        // Handle title variations (e.g., 'Health' vs 'Здоровʼя') if needed, assuming title matches keys
        let weight = AREA_WEIGHTS[title] || 1.0;

        // Soft Modifier: If the area is 'stable' but weight is high, maybe it drags less? 
        // User asked for: (Sum of Contributions) / (Sum of Weights) * 100
        // Contribution = Status Score * Weight

        totalScore += status.score * weight;
        totalWeight += weight;
    });

    if (totalWeight === 0) return { score: 0, label: 'Немає даних', progress: 0 };

    const percentage = Math.round((totalScore / totalWeight) * 100);

    let label = '';
    if (percentage >= 85) label = 'Чіткий напрямок';
    else if (percentage >= 65) label = 'Загалом стабільно'; // "але є над чим працювати" is long, keeping short
    else if (percentage >= 45) label = 'Фокус розпорошений';
    else label = 'Потрібне переосмислення';

    return {
        score: percentage,
        label,
        progress: percentage
    };
}
