import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { count, eq } from 'drizzle-orm';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return false;

    return true;
}

export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const [totalUsers] = await db.select({ count: count() }).from(users);
        const [proUsers] = await db.select({ count: count() }).from(users).where(eq(users.subscriptionTier, 'pro'));

        // Count system defaults? Maybe later. For now just users.

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers.count,
                activeSubscriptions: proUsers.count,
                systemDefaults: 0 // Placeholder until we query content tables
            }
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
