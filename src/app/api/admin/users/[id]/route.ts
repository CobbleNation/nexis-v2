import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, adminAuditLogs } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, sql, desc, like, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return null;

    return payload.userId as string;
}

// ... imports

// ... checkAdmin function

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    try {
        const [user] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            subscriptionTier: users.subscriptionTier,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            avatar: users.avatar,
            onboardingCompleted: users.onboardingCompleted,
            goalsCount: sql<number>`(SELECT COUNT(*) FROM goals WHERE goals.user_id = ${users.id})`,
            habitsCount: sql<number>`(SELECT COUNT(*) FROM habits WHERE habits.user_id = ${users.id})`,
            lastActive: sql<string>`(SELECT MAX(last_used_at) FROM sessions WHERE sessions.user_id = ${users.id})`
        })
            .from(users)
            .where(eq(users.id, id));

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params; // Resolve params promise in Next.js 15+

    try {
        const body = await req.json();
        const { role, subscriptionTier } = body;

        // Validation
        const validRoles = ['user', 'support', 'manager', 'admin'];
        const validTiers = ['free', 'pro'];

        const updateData: any = {};
        if (role && validRoles.includes(role)) updateData.role = role;
        if (subscriptionTier && validTiers.includes(subscriptionTier)) updateData.subscriptionTier = subscriptionTier;
        if (typeof body.name === 'string' && body.name.trim().length > 0) updateData.name = body.name.trim();
        if (typeof body.onboardingCompleted === 'boolean') updateData.onboardingCompleted = body.onboardingCompleted;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        updateData.updatedAt = new Date();

        // Perform Update
        await db.update(users)
            .set(updateData)
            .where(eq(users.id, id));

        // Audit Log
        await db.insert(adminAuditLogs).values({
            id: uuidv4(),
            adminId: adminId,
            action: 'UPDATE_USER',
            entityType: 'user',
            entityId: id,
            details: updateData,
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, user: updateData });
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
