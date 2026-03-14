import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, analyticsEvents } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { sql, eq, and, count, countDistinct } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Activation Rate
        // Any user who has performed at least one meaningful action
        const [registeredUsersRes] = await db.select({ count: count() }).from(users);
        const registeredUsers = registeredUsersRes.count;

        const [activatedUsersRes] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents)
            .where(and(
                sql`${analyticsEvents.userId} IS NOT NULL`,
                sql`${analyticsEvents.eventName} IN ('created_first_entry', 'task_created', 'goal_created', 'habit_created', 'project_created')`
            ));
        const activatedUsers = activatedUsersRes.count;

        const activationRate = registeredUsers > 0 ? (activatedUsers / registeredUsers) * 100 : 0;

        // 2. Funnel
        // Registration -> Email Verified -> First Login -> Activation (Any action)
        
        const [funnelRegister] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents).where(eq(analyticsEvents.eventName, 'user_registered'));
            
        const [funnelVerify] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents).where(eq(analyticsEvents.eventName, 'email_verified'));
            
        const [funnelLogin] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents).where(eq(analyticsEvents.eventName, 'user_login')); // Note: switched from first_login to user_login proxy if needed
            
        const [funnelAction] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.eventName} IN ('created_first_entry', 'task_created', 'goal_created', 'habit_created', 'project_created')`);

        const funnel = [
            { stage: 'Реєстрація', count: funnelRegister.count },
            { stage: 'Email Підтверджено', count: funnelVerify.count },
            { stage: 'Вхід у систему', count: funnelLogin.count },
            { stage: 'Перша Дія', count: funnelAction.count },
        ];

        // 3. Retention (Cohort Analysis)
        const calculateRetention = async (daysAfter: number) => {
            const cohortDate = new Date();
            cohortDate.setDate(now.getDate() - (daysAfter + 1));
            
            // Users who registered exactly around cohort period or before
            const cohortUsers = await db.select({ id: users.id, createdAt: users.createdAt })
                .from(users)
                .where(sql`${users.createdAt} <= ${cohortDate}`);
            
            if (cohortUsers.length === 0) return 0;

            const cohortUserIds = cohortUsers.map(u => u.id);
            
            // Returned users = users from cohort who have events occurring at least 'daysAfter' later
            const [returnedRes] = await db.select({ count: countDistinct(analyticsEvents.userId) })
                .from(analyticsEvents)
                .innerJoin(users, eq(analyticsEvents.userId, users.id))
                .where(and(
                    sql`${analyticsEvents.userId} IN ${cohortUserIds}`,
                    sql`${analyticsEvents.createdAt} >= date(${users.createdAt}, '+' || ${daysAfter} || ' days')`
                ));

            return (returnedRes.count / cohortUsers.length) * 100;
        };

        const retention = {
            day1: await calculateRetention(1),
            day7: await calculateRetention(7),
            day30: await calculateRetention(30),
        };

        // 4. DAU
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        const [dauRes] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${startOfToday}`);

        return NextResponse.json({
            activationRate: Number(activationRate.toFixed(1)),
            funnel,
            retention: {
                day1: Number(retention.day1.toFixed(1)).toString() === "NaN" ? 0 : Number(retention.day1.toFixed(1)),
                day7: Number(retention.day7.toFixed(1)).toString() === "NaN" ? 0 : Number(retention.day7.toFixed(1)),
                day30: Number(retention.day30.toFixed(1)).toString() === "NaN" ? 0 : Number(retention.day30.toFixed(1)),
            },
            dau: dauRes.count || 0,
        });
    } catch (error) {
        console.error('Detailed Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
