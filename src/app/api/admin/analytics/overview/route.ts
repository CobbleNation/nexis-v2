import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, actions, goals, habits, habitLogs, analyticsDailyAgg, analyticsEvents } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { sql, count, countDistinct, eq, and } from 'drizzle-orm';

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
        // Date filters can be implemented here, but for MVP Overview we often want totals or last 30 days
        // const from = searchParams.get('from'); 
        // const to = searchParams.get('to');

        // 1. Total Users & New Users (Last 30 days)
        const [totalUsersRes] = await db.select({ count: count() }).from(users);
        const totalUsers = totalUsersRes.count;

        const date30DaysAgo = new Date();
        date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
        
        const [newUsersRes] = await db.select({ count: count() })
            .from(users)
            .where(sql`${users.createdAt} >= ${date30DaysAgo}`);
        const newUsers = newUsersRes.count;

        // 2. Active Users (DAU) - Distinct users with any event today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [dauRes] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${startOfToday}`);
        const activeUsersDAU = dauRes.count;

        // Fallback or proxies for other metrics
        const [tasksCreatedRes] = await db.select({ count: count() }).from(actions).where(eq(actions.type, 'task'));
        const [tasksCompletedRes] = await db.select({ count: count() }).from(actions).where(and(eq(actions.type, 'task'), eq(actions.completed, true)));

        const tasksCreated = tasksCreatedRes.count;
        const tasksCompleted = tasksCompletedRes.count;
        const completionRate = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;

        const [goalsCreatedRes] = await db.select({ count: count() }).from(goals);
        const goalsCreated = goalsCreatedRes.count;

        const [habitCheckinsRes] = await db.select({ count: count() }).from(habitLogs);
        const habitCheckins = habitCheckinsRes.count;

        // Pro Conversion
        const [proUsersRes] = await db.select({ count: count() }).from(users).where(eq(users.subscriptionTier, 'pro'));
        const conversionRate = totalUsers > 0 ? ((proUsersRes.count / totalUsers) * 100).toFixed(1) : 0;

        return NextResponse.json({
            stats: {
                totalUsers,
                newUsers,
                activeUsersDAU,
                activeUsersMAU: 0, // Placeholder
                conversionRate: Number(conversionRate),
                tasksCreated,
                tasksCompleted,
                completionRate,
                goalsCreated,
                habitCheckins,
            }
        });
    } catch (error) {
        console.error('Analytics Overview Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
