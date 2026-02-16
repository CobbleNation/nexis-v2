import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { desc, like, or, sql } from 'drizzle-orm';

// Helper to check admin role
async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return false;

    return true;
}

export async function GET(req: Request) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    try {
        const filters = search
            ? or(
                like(users.name, `%${search}%`),
                like(users.email, `%${search}%`)
            )
            : undefined;

        const allUsers = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            subscriptionTier: users.subscriptionTier,
            createdAt: users.createdAt,
            // Subqueries for basic stats to avoid massive joins/group by issues with simple Drizzle usage
            goalsCount: sql<number>`(SELECT COUNT(*) FROM goals WHERE goals.user_id = ${users.id})`,
            lastActive: sql<string>`(SELECT MAX(last_used_at) FROM sessions WHERE sessions.user_id = ${users.id})`
        })
            .from(users)
            .where(filters)
            .orderBy(desc(users.createdAt));

        return NextResponse.json({ users: allUsers });
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
