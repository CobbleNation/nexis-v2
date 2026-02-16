import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, actions, goals, habits, habitLogs, analyticsDailyAgg } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { sql, count, countDistinct } from 'drizzle-orm';

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
            .where(sql`${users.createdAt} >= ${date30DaysAgo.getTime()}`);
        const newUsers = newUsersRes.count;

        // 2. Active Users (DAU/MAU) - Utilizing analytics_daily_agg for speed if populated, or fallback to sessions
        // For MVP without aggregation job running yet, we query sessions or actions table
        // Best proxy for DAU in this MVP: distinct users in 'actions' updated recently (active usage)

        // Let's use specific queries for "Actions"
        const [tasksCreatedRes] = await db.select({ count: count() }).from(actions).where(sql`${actions.type} = 'task'`);
        const [tasksCompletedRes] = await db.select({ count: count() }).from(actions).where(sql`${actions.type} = 'task' AND ${actions.completed} = true`);

        const tasksCreated = tasksCreatedRes.count;
        const tasksCompleted = tasksCompletedRes.count;
        const completionRate = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;

        const [goalsCreatedRes] = await db.select({ count: count() }).from(goals);
        const goalsCreated = goalsCreatedRes.count;

        const [habitCheckinsRes] = await db.select({ count: count() }).from(habitLogs);
        const habitCheckins = habitCheckinsRes.count;

        // Pro Conversion using SQL
        const [proUsersRes] = await db.select({ count: count() }).from(users).where(sql`${users.subscriptionTier} = 'pro'`);
        const conversionRate = totalUsers > 0 ? ((proUsersRes.count / totalUsers) * 100).toFixed(1) : 0;

        return NextResponse.json({
            stats: {
                totalUsers,
                newUsers,
                activeUsersDAU: 0, // Placeholder, requires agg table or complex session query
                activeUsersMAU: 0,
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
