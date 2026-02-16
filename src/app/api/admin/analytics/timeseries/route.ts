import { NextResponse } from 'next/server';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { sql } from 'drizzle-orm';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return null;

    return payload.userId as string;
}

export async function GET(req: Request) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        // Default to last 30 days
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);

        // Fetch aggregation from analytics_events (group by day)
        // Note: In high traffic, this should use analytics_daily_agg table
        const dailyStats = await db.select({
            date: sql<string>`strftime('%Y-%m-%d', datetime(${analyticsEvents.createdAt} / 1000, 'unixepoch'))`,
            tasks_created: sql<number>`sum(case when ${analyticsEvents.eventName} = 'task_created' then 1 else 0 end)`,
            tasks_completed: sql<number>`sum(case when ${analyticsEvents.eventName} = 'task_completed' then 1 else 0 end)`,
            habits_completed: sql<number>`sum(case when ${analyticsEvents.eventName} = 'habit_checked' then 1 else 0 end)`,
            active_users: sql<number>`count(distinct ${analyticsEvents.userId})`
        })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${from.getTime()} AND ${analyticsEvents.createdAt} <= ${to.getTime()}`)
            .groupBy(sql`strftime('%Y-%m-%d', datetime(${analyticsEvents.createdAt} / 1000, 'unixepoch'))`)
            .orderBy(sql`strftime('%Y-%m-%d', datetime(${analyticsEvents.createdAt} / 1000, 'unixepoch'))`);

        return NextResponse.json({ data: dailyStats });
    } catch (error) {
        console.error('Analytics Timeseries Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
