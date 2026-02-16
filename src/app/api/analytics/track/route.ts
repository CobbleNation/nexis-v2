import { NextResponse } from 'next/server';
import { trackEvent, AnalyticsEvent } from '@/lib/analytics-server';
import { z } from 'zod';

const eventSchema = z.object({
    eventName: z.enum([
        'user_registered', 'user_login', 'task_created', 'task_completed',
        'goal_created', 'project_created', 'habit_created', 'habit_checked',
        'upgrade_started', 'upgrade_completed', 'app_visited'
    ] as [string, ...string[]]),
    userId: z.string().optional().nullable(),
    sessionId: z.string().optional().nullable(),
    entityType: z.enum(['task', 'project', 'goal', 'habit', 'user']).optional().nullable(),
    entityId: z.string().optional().nullable(),
    plan: z.enum(['free', 'pro']).optional().nullable(),
    source: z.enum(['web', 'mobile', 'admin']).optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const eventData = eventSchema.parse(body);

        await trackEvent(eventData as AnalyticsEvent);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track API Error:', error);
        return NextResponse.json({ error: 'Invalid Event Data' }, { status: 400 });
    }
}
