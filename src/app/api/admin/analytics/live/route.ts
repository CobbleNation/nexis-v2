import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, analyticsEvents } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { sql, eq, desc, and, gte } from 'drizzle-orm';

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

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '7');

    try {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        let query = db.select({
            id: analyticsEvents.id,
            eventName: analyticsEvents.eventName,
            createdAt: analyticsEvents.createdAt,
            userId: analyticsEvents.userId,
            userName: users.name,
            userEmail: users.email,
            metadata: analyticsEvents.metadata,
        })
        .from(analyticsEvents)
        .leftJoin(users, eq(analyticsEvents.userId, users.id))
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(100);

        const conditions = [];
        if (userId) {
            conditions.push(eq(analyticsEvents.userId, userId));
        }
        if (days > 0) {
            conditions.push(gte(analyticsEvents.createdAt, dateLimit));
        }

        if (conditions.length > 0) {
            // @ts-ignore - drizzle type complexity
            query = query.where(and(...conditions));
        }

        const events = await query;

        return NextResponse.json(events);
    } catch (error) {
        console.error('Live Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
