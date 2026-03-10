import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
    users, goals, projects, actions, metricDefinitions, metricEntries,
    calendarEvents, notes, focuses, checkIns, insights, periods,
    experiments, routines, journalEntries, fileAssets, libraryItems,
    habits, habitLogs, sessions, userLimits, lifeAreas, adminAuditLogs
} from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
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
            emailVerified: users.emailVerified,
            subscriptionTier: users.subscriptionTier,
            subscriptionExpiresAt: users.subscriptionExpiresAt,
            subscriptionPeriod: users.subscriptionPeriod,
            currentPriceOverride: users.currentPriceOverride,
            recurringPriceOverride: users.recurringPriceOverride,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            avatar: users.avatar,

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
        const { role, subscriptionTier, subscriptionExpiresAt } = body;

        // Validation
        const validRoles = ['user', 'support', 'manager', 'admin'];
        const validTiers = ['free', 'pro'];

        const updateData: any = {};
        if (role && validRoles.includes(role)) updateData.role = role;
        if (subscriptionTier && validTiers.includes(subscriptionTier)) updateData.subscriptionTier = subscriptionTier;
        if (typeof body.name === 'string' && body.name.trim().length > 0) updateData.name = body.name.trim();


        if (subscriptionExpiresAt !== undefined) {
            updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
        }

        if (body.subscriptionPeriod !== undefined) {
            updateData.subscriptionPeriod = body.subscriptionPeriod;
        }

        if (body.currentPriceOverride !== undefined) {
            updateData.currentPriceOverride = body.currentPriceOverride === '' ? null : body.currentPriceOverride;
        }

        if (body.recurringPriceOverride !== undefined) {
            updateData.recurringPriceOverride = body.recurringPriceOverride === '' ? null : body.recurringPriceOverride;
        }

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
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'data'; // 'data' or 'account'

    try {
        if (mode === 'data') {
            // Delete all user data except the user record itself
            await db.transaction(async (tx) => {
                const tables = [
                    goals, projects, actions, metricDefinitions, metricEntries,
                    calendarEvents, notes, focuses, checkIns, insights,
                    periods, experiments, routines, journalEntries, fileAssets,
                    libraryItems, habits, habitLogs, sessions, userLimits, lifeAreas
                ];

                for (const table of tables) {
                    // Drizzle delete handles the condition based on the table's userId column
                    await tx.delete(table).where(eq((table as any).userId, userId));
                }
            });

            // Audit
            await db.insert(adminAuditLogs).values({
                id: uuidv4(),
                adminId: adminId,
                action: 'DELETE_USER_DATA',
                entityType: 'user',
                entityId: userId,
                details: { mode: 'data' },
                createdAt: new Date()
            });

            return NextResponse.json({ success: true, message: 'User data cleared successfully' });
        } else if (mode === 'account') {
            // Full account deletion
            // Drizzle should handle cascades if defined, but we'll be thorough
            await db.delete(users).where(eq(users.id, userId));

            // Audit (log remains even if user is gone)
            await db.insert(adminAuditLogs).values({
                id: uuidv4(),
                adminId: adminId,
                action: 'DELETE_USER_ACCOUNT',
                entityType: 'user',
                entityId: userId,
                details: { mode: 'account' },
                createdAt: new Date()
            });

            return NextResponse.json({ success: true, message: 'User account deleted successfully' });
        }

        return NextResponse.json({ error: 'Invalid deletion mode' }, { status: 400 });
    } catch (error) {
        console.error('Failed to delete user/data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
