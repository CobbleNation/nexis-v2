'use client';

import { useData } from '@/lib/store';
import { ContextBlock } from '@/components/areas/ContextBlock';
import { AttentionBlock } from '@/components/areas/AttentionBlock';
import { SmartAreaCard } from '@/components/areas/SmartAreaCard';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { calculateAreaStatus, calculateGlobalState } from '@/lib/status-utils';

export default function AreasPage() {
    const { state, dispatch } = useData();
    const { areas, actions, goals, metricEntries } = state;

    // Helper: Find last activity for an area
    const getLastActivity = (areaId: string) => {
        const areaActions = actions.filter(a => a.areaId === areaId);
        const areaGoals = goals.filter(g => g.areaId === areaId);

        type ActivityItem = { date: Date; text: string; originalDate: string | Date };
        let activities: ActivityItem[] = [];

        // Check Actions
        if (areaActions.length > 0) {
            const validActions = areaActions.filter(a => a.updatedAt);
            const sortedActions = validActions.sort((a, b) => {
                const dateA = new Date(a.updatedAt!).getTime();
                const dateB = new Date(b.updatedAt!).getTime();
                return dateB - dateA;
            });

            const latestAction = sortedActions[0];
            if (latestAction) {
                activities.push({
                    date: new Date(latestAction.updatedAt!),
                    text: `Завдання: ${latestAction.title}`,
                    originalDate: latestAction.updatedAt!
                });
            }
        }

        // Check Goals
        if (areaGoals.length > 0) {
            const validGoals = areaGoals.filter(g => g.createdAt);
            const sortedGoals = validGoals.sort((a, b) => {
                const dateA = new Date(a.createdAt!).getTime();
                const dateB = new Date(b.createdAt!).getTime();
                return dateB - dateA;
            });

            const latestGoal = sortedGoals[0];
            if (latestGoal) {
                activities.push({
                    date: new Date(latestGoal.createdAt!),
                    text: `Нова ціль: ${latestGoal.title}`,
                    originalDate: latestGoal.createdAt!
                });
            }
        }

        if (activities.length === 0) return undefined;

        // Sort combined activities strict desc
        activities.sort((a, b) => b.date.getTime() - a.date.getTime());
        const latest = activities[0];

        // Format Date
        const timeAgo = formatDistanceToNow(latest.date, { addSuffix: true, locale: uk });

        return {
            text: latest.text,
            date: timeAgo
        };
    };

    // --- Status System Integration ---
    const areaStatuses = areas.map(area => {
        const status = calculateAreaStatus(
            area,
            actions,
            state.metricDefinitions || [], // Ensure these exist in state
            metricEntries
        );
        return { area, status };
    });

    // Calculate Global State
    const globalState = calculateGlobalState(
        areaStatuses.map(item => ({ status: item.status, title: item.area.title }))
    );

    // Filter Attention Areas
    const attentionAreas = areaStatuses
        .filter(item => item.status.status === 'attention')
        .map(item => item.area);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-12">
            {/* 1. Context Block */}
            {/* 1. Context Block */}
            <ContextBlock
                overallScore={globalState.score}
                message={`${globalState.label}. ${globalState.score >= 65 ? 'Продовжуй рух.' : 'Варто переглянути пріоритети.'}`}
            />

            {/* 2. Attention Block (Dynamic) */}
            {attentionAreas.length > 0 && (
                <div className="animate-in slide-in-from-top-4 duration-500 delay-100">
                    <AttentionBlock areas={attentionAreas} />
                </div>
            )}

            {/* 3. Header - Simplified (No buttons) */}
            <div className="border-b border-border/40 pb-6">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Сфери Життя</h1>
                <p className="text-muted-foreground text-lg">
                    Твій компас для балансу та розвитку.
                </p>
            </div>

            {/* 4. Smart Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {areaStatuses.map(({ area, status }, index) => (
                    <SmartAreaCard
                        key={area.id}
                        area={area}
                        index={index}
                        lastActivity={getLastActivity(area.id)}
                        computedStatus={status}
                    />
                ))}
            </div>
        </div>
    );
}
