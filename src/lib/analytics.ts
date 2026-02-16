import { AppState } from "@/lib/store";
import { format, subDays, isSameDay } from "date-fns";

export interface CorrelationResult {
    variableX: string;
    variableY: string;
    correlation: number;
    impactPercent: number;
    significance: number; // 0-1 (p-value approx or sample size weight)
    message: string;
    explanation: string;
}

export interface DailyData {
    date: string;
    mood: number | null;
    energy: number | null;
    metrics: Record<string, number>;
    tasksCompleted: number;
    habitsCompleted: number;
    focusMinutes: number;
}

/**
 * Helper to build a continuous array of DailyData for analysis.
 * Fills gaps with empty/default values.
 */
export function getDailyDataRange(state: AppState, days: number = 30): DailyData[] {
    const result: DailyData[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');

        // Find existing logs for this day
        // 1. Mood (Journal)
        // Check if journal exists on state, fallback to empty array if not defined (though it should be)
        const journalEntries = state.journal || [];
        const journal = journalEntries.find(j => {
            if (!j.date) return false;
            return isSameDay(new Date(j.date), date);
        });
        const mood = journal?.mood ?? null;

        // 2. Metrics
        const metrics: Record<string, number> = {};
        state.metricEntries.filter(m => {
            return isSameDay(new Date(m.date), date);
        }).forEach(m => {
            metrics[m.metricId] = m.value;
        });

        // 3. Tasks Completed (Actions)
        // Note: Assuming actions have a 'lastCompletedAt' or we track completion date in history.
        // For MVP, we might use 'updatedAt' if completed=true, or just rely on 'date' field if action was scheduled.
        // This is a simplification. Real implementation needs a 'TaskHistory' or reliable completion timestamps.
        const tasksCompleted = state.actions.filter(a =>
            a.completed && a.updatedAt && isSameDay(new Date(a.updatedAt), date)
        ).length;

        // 4. Habits
        const habitsCompleted = state.habitLogs.filter(h => h.date === dateStr && h.completed).length;

        // 5. Focus Time (Actions marked as Focus)
        // Sum duration of completed actions where isFocus is true
        const focusMinutes = state.actions
            .filter(a =>
                a.completed &&
                a.isFocus &&
                a.updatedAt &&
                isSameDay(new Date(a.updatedAt), date)
            )
            .reduce((total, action) => total + (action.duration || 0), 0);

        result.push({
            date: dateStr,
            mood,
            energy: null,
            metrics,
            tasksCompleted,
            habitsCompleted,
            focusMinutes
        });
    }

    return result.reverse(); // Chronological order
}

/**
 * Calculates simple Pearson correlation coefficient.
 * Returns null if not enough data.
 */
export function calculateCorrelation(x: number[], y: number[]): number | null {
    if (x.length !== y.length || x.length < 5) return null;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Analyzes correlation between a driver (Metric or Routine/Habit) and an outcome (Mood or Productivity).
 * 
 * @param data Array of DailyData
 * @param driverType 'metric' | 'routine'
 * @param driverId ID of the metric or habit/routine
 * @param driverLag Days shift (e.g. sleep affects NEXT day mood) - default 0 or 1
 * @param outcomeField 'mood' | 'task_count'
 */
export function analyzeCorrelation(
    data: DailyData[],
    driverType: 'metric' | 'routine',
    driverId: string,
    driverLag: number,
    outcomeField: 'mood' | 'energy' | 'task_count' | 'focusMinutes',
    outcomeMessage: string,
    driverName: string,
    outcomeName: string
): CorrelationResult | null {

    const x: number[] = [];
    const y: number[] = [];

    // Align data with lag
    // If lag = 1, Driver(Day 1) vs Outcome(Day 2)
    for (let i = 0; i < data.length - driverLag; i++) {
        const driverDay = data[i];
        const outcomeDay = data[i + driverLag];

        let valX: number | null = null;
        let valY: number | null = null;

        // Get Driver Value
        if (driverType === 'metric') {
            valX = driverDay.metrics[driverId] ?? null;
        } else if (driverType === 'routine') {
            // For routines/habits, simplistic boolean 1/0 or count?
            // Assuming we check habitLogs for this routine/habit ID? 
            // The 'DailyData' struct currently aggregates total habits.
            // For specific correlation we need granular data which getDailyDataRange simplifies.
            // *Correction*: We need to pass full state or lookup specific habit logs.
            // For now, let's assume we can't easily correlate specific habits without deeper lookup in this helper.
            // We will skip specific routine correlation in this simple helper unless we expand DailyData.
            // ... SKIPPING SPECIFIC ROUTINE LOGIC FOR MVP HELPER ...
            return null;
        }

        // Get Outcome Value
        // Get Outcome Value
        if (outcomeField === 'mood') valY = driverDay.mood;
        if (outcomeField === 'energy') valY = driverDay.energy;
        if (outcomeField === 'task_count') valY = driverDay.tasksCompleted;
        if (outcomeField === 'focusMinutes') valY = driverDay.focusMinutes;

        if (valX !== null && valY !== null) {
            x.push(valX);
            y.push(valY);
        }
    }

    const r = calculateCorrelation(x, y);
    if (r === null) return null;

    // Interpret
    const impactPercent = Math.round(r * 100);
    let message = "";
    let explanation = "";

    if (Math.abs(r) < 0.3) {
        message = "Слабкий або відсутній вплив.";
        explanation = "Зміни цього показника майже не впливають на результат.";
    } else if (r > 0) {
        message = `Позитивний вплив: коли росте ${driverName}, покращується ${outcomeName}.`;
        explanation = "Є прямий зв'язок. Підтримуйте цей показник високим.";
    } else {
        message = `Негативний вплив: коли росте ${driverName}, погіршується ${outcomeName}.`;
        explanation = "Зворотній зв'язок. Спробуйте зменшити цей показник.";
    }

    return {
        variableX: driverName,
        variableY: outcomeName,
        correlation: r,
        impactPercent,
        significance: x.length / 30, // Rough confidence based on sample size relative to month
        message,
        explanation
    };
}


/**
 * Calculates Trend (Slope) for a simple array of numbers.
 * Used for sparklines.
 */
export function getTrendData(data: DailyData[]): number[] {
    return data.map(d => d.tasksCompleted);
}

/**
 * Groups daily data by Week (ISO week or just chunks) for Rhythm Chart.
 */
export function getWeeklyStats(data: DailyData[]) {
    // Group by Day of Week (0-6)
    const daysStats = Array(7).fill(0).map((_, i) => ({
        name: format(new Date(2024, 0, i + 7), 'EEE'), // Mon, Tue...
        totalTasks: 0,
        count: 0
    }));

    data.forEach(d => {
        const date = new Date(d.date);
        const dayIdx = date.getDay(); // 0 = Sun
        // Adjust to Mon-Sun if needed, but Recharts doesn't care
        const idx = dayIdx === 0 ? 6 : dayIdx - 1; // Mon=0, Sun=6

        if (daysStats[idx]) {
            daysStats[idx].totalTasks += d.tasksCompleted;
            daysStats[idx].count += 1;
        }
    });

    return daysStats.map(d => ({
        name: d.name,
        avgTasks: d.count > 0 ? Math.round(d.totalTasks / d.count) : 0
    }));
}

/**
 * Prepares data for Heatmap (Calendar).
 */
export function getHeatmapData(data: DailyData[]) {
    return data.map(d => ({
        date: d.date,
        count: d.habitsCompleted,
        intensity: Math.min(d.habitsCompleted / 5, 1) // Cap at 5 habits for variable intensity
    }));
}
