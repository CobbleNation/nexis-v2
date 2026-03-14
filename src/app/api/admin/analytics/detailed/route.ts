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
        // activation rate = activated users / registered users
        const [registeredUsersRes] = await db.select({ count: count() }).from(users);
        const registeredUsers = registeredUsersRes.count;

        const [activatedUsersRes] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents)
            .where(eq(analyticsEvents.eventName, 'created_first_entry'));
        const activatedUsers = activatedUsersRes.count;

        const activationRate = registeredUsers > 0 ? (activatedUsers / registeredUsers) * 100 : 0;

        // 2. Funnel
        // Landing (implied) -> Register -> Verify email -> First login -> First action
        // For Landing page, we might use 'app_visited' or just start from Register
        
        const [funnelRegister] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents).where(eq(analyticsEvents.eventName, 'user_registered'));
            
        const [funnelVerify] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents).where(eq(analyticsEvents.eventName, 'email_verified'));
            
        const [funnelLogin] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents).where(eq(analyticsEvents.eventName, 'first_login'));
            
        const [funnelAction] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents).where(eq(analyticsEvents.eventName, 'created_first_entry'));

        const funnel = [
            { stage: 'Registration', count: funnelRegister.count },
            { stage: 'Email Verified', count: funnelVerify.count },
            { stage: 'First Login', count: funnelLogin.count },
            { stage: 'First Action', count: funnelAction.count },
        ];

        // 3. Retention (Simplified Cohort)
        // Day 1, Day 7, Day 30 Retention
        // Percentage of users who registered X days ago and returned Y days after registration
        
        const calculateRetention = async (daysAfter: number) => {
            // Users who registered at least (daysAfter + 1) days ago
            const refDate = new Date();
            refDate.setDate(refDate.getDate() - (daysAfter + 1));
            
            const [usersCohort] = await db.select({ count: count() })
                .from(users)
                .where(sql`${users.createdAt} <= ${refDate.getTime()}`);
            
            if (usersCohort.count === 0) return 0;

            // Of those users, how many had an event at least (daysAfter) days after registration
            // This is a proxy for retention
            const [returnedUsers] = await db.select({ count: countDistinct(analyticsEvents.userId) })
                .from(analyticsEvents)
                .innerJoin(users, eq(analyticsEvents.userId, users.id))
                .where(and(
                    sql`${analyticsEvents.createdAt} >= ${users.createdAt} + ${daysAfter * 24 * 60 * 60 * 1000}`,
                    sql`${users.createdAt} <= ${refDate.getTime()}`
                ));

            return (returnedUsers.count / usersCohort.count) * 100;
        };

        const retention = {
            day1: await calculateRetention(1),
            day7: await calculateRetention(7),
            day30: await calculateRetention(30),
        };

        // 4. DAU (Daily Active Users) - Distinct users with any event today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        const [dauRes] = await db.select({ count: countDistinct(analyticsEvents.userId) })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${startOfToday.getTime()}`);

        return NextResponse.json({
            activationRate: Number(activationRate.toFixed(1)),
            funnel,
            retention: {
                day1: Number(retention.day1.toFixed(1)),
                day7: Number(retention.day7.toFixed(1)),
                day30: Number(retention.day30.toFixed(1)),
            },
            dau: dauRes.count,
        });
    } catch (error) {
        console.error('Detailed Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
