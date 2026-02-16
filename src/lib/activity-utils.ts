import { AppState } from "@/lib/store";
import { MetricEntry, Goal, Focus, CheckIn } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

export interface ActivityItem {
    id: string;
    type: 'metric' | 'goal' | 'focus' | 'checkin' | 'generic';
    title: string;
    description: string;
    date: Date;
    formattedDate: string;
    timeAgo: string;
    areaColor?: string;
}

export function getActivityFeed(areaId: string | 'all', state: AppState): ActivityItem[] {
    const items: ActivityItem[] = [];
    const isAll = areaId === 'all';

    // 1. Metric Entries
    const targetMetricIds = new Set(
        state.metricDefinitions
            .filter(m => isAll || m.areaId === areaId)
            .map(m => m.id)
    );

    state.metricEntries.forEach(entry => {
        if (targetMetricIds.has(entry.metricId) && entry.date) {
            const metric = state.metricDefinitions.find(m => m.id === entry.metricId);
            if (metric) {
                const area = state.areas.find(a => a.id === metric.areaId);
                items.push({
                    id: entry.id,
                    type: 'metric',
                    title: 'Оновлено метрику',
                    description: `${metric.name}: ${entry.value} ${metric.unit || ''}`,
                    date: new Date(entry.date),
                    formattedDate: format(new Date(entry.date), 'dd MMM HH:mm', { locale: uk }),
                    timeAgo: formatDistanceToNow(new Date(entry.date), { addSuffix: true, locale: uk }),
                    areaColor: area?.color // Optional extra for UI
                });
            }
        }
    });

    // 2. Goals (Created or Completed)
    // 2. Goals (Created or Completed)
    state.goals.filter(g => isAll || g.areaId === areaId).forEach(goal => {
        const area = state.areas.find(a => a.id === goal.areaId);

        // Created
        if (goal.createdAt) {
            items.push({
                id: `goal-created-${goal.id}`,
                type: 'goal',
                title: 'Створено ціль',
                description: goal.title,
                date: new Date(goal.createdAt),
                formattedDate: format(new Date(goal.createdAt), 'dd MMM HH:mm', { locale: uk }),
                timeAgo: formatDistanceToNow(new Date(goal.createdAt), { addSuffix: true, locale: uk }),
                areaColor: area?.color
            });
        }

        // Completed (approximate by updatedAt if status is completed)
        if (goal.status === 'completed' && goal.updatedAt) {
            items.push({
                id: `goal-completed-${goal.id}`,
                type: 'goal',
                title: 'Ціль досягнуто!',
                description: goal.title,
                date: new Date(goal.updatedAt),
                formattedDate: format(new Date(goal.updatedAt), 'dd MMM HH:mm', { locale: uk }),
                timeAgo: formatDistanceToNow(new Date(goal.updatedAt), { addSuffix: true, locale: uk }),
                areaColor: area?.color
            });
        }
    });

    // 3. Focuses
    state.focuses.filter(f => isAll || f.areaId === areaId).forEach(focus => {
        const area = state.areas.find(a => a.id === focus.areaId);
        if (focus.createdAt) {
            items.push({
                id: focus.id,
                type: 'focus',
                title: 'Створено фокус',
                description: focus.title,
                date: new Date(focus.createdAt),
                formattedDate: format(new Date(focus.createdAt), 'dd MMM HH:mm', { locale: uk }),
                timeAgo: formatDistanceToNow(new Date(focus.createdAt), { addSuffix: true, locale: uk }),
                areaColor: area?.color
            });
        }
    });

    // 4. Check-ins
    state.checkIns.filter(c => isAll || c.areaId === areaId).forEach(checkIn => {
        const area = state.areas.find(a => a.id === checkIn.areaId);
        if (checkIn.date) {
            items.push({
                id: checkIn.id,
                type: 'checkin',
                title: 'Зафіксовано стан',
                description: `Рейтинг: ${checkIn.rating}/10 ${checkIn.comment ? `— ${checkIn.comment}` : ''}`,
                date: new Date(checkIn.date),
                formattedDate: format(new Date(checkIn.date), 'dd MMM HH:mm', { locale: uk }),
                timeAgo: formatDistanceToNow(new Date(checkIn.date), { addSuffix: true, locale: uk }),
                areaColor: area?.color
            });
        }
    });

    // Sort by Date Descending (Newest first)
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50); // Limit to 50
}
