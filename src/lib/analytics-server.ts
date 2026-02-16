import 'server-only';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export type EventName =
    | 'user_registered'
    | 'user_login'
    | 'task_created'
    | 'task_completed'
    | 'goal_created'
    | 'project_created'
    | 'habit_created'
    | 'habit_checked'
    | 'upgrade_started'
    | 'upgrade_completed'
    | 'app_visited';

export interface AnalyticsEvent {
    userId?: string | null;
    sessionId?: string | null;
    eventName: EventName;
    entityType?: 'task' | 'project' | 'goal' | 'habit' | 'user' | null;
    entityId?: string | null;
    plan?: 'free' | 'pro' | null;
    source?: 'web' | 'mobile' | 'admin' | null;
    metadata?: Record<string, any> | null;
}

/**
 * Tracks an analytics event.
 * Designed to be non-blocking (fire and forget).
 * SERVER-SIDE ONLY. For client-side tracking, use /api/analytics endpoint (not yet implemented) or server actions.
 */
export async function trackEvent(event: AnalyticsEvent) {
    // Basic check to ensure we are on server
    if (typeof window !== 'undefined') {
        console.warn('[Analytics] trackEvent called on client side. Use an API route instead.');
        return;
    }

    try {
        await db.insert(analyticsEvents).values({
            id: uuidv4(),
            userId: event.userId,
            sessionId: event.sessionId,
            eventName: event.eventName,
            entityType: event.entityType,
            entityId: event.entityId,
            plan: event.plan,
            source: event.source || 'web',
            metadata: event.metadata,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error('[Analytics] Failed to track event:', event.eventName, error);
    }
}
