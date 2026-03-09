import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
    users, goals, projects, actions, metricDefinitions, metricEntries,
    calendarEvents, notes, focuses, checkIns, insights,
    periods, experiments, routines, journalEntries, fileAssets,
    libraryItems, habits, habitLogs, sessions, userLimits, lifeAreas,
    adminAuditLogs
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifyJWT } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(accessToken);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userIds, action } = await req.json();

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
        }

        const adminId = payload.id as string;

        switch (action) {
            case 'verify':
                await db.update(users)
                    .set({ emailVerified: new Date() })
                    .where(inArray(users.id, userIds));
                break;

            case 'set_pro':
                await db.update(users)
                    .set({ subscriptionTier: 'pro' })
                    .where(inArray(users.id, userIds));
                break;

            case 'set_free':
                await db.update(users)
                    .set({ subscriptionTier: 'free' })
                    .where(inArray(users.id, userIds));
                break;

            case 'delete':
                await db.transaction(async (tx) => {
                    // For bulk delete, we'll go through each user to ensure all related data is cleared 
                    // (since some tables might not have composite inArray support on userId easily in this setup)
                    for (const userId of userIds) {
                        const tables = [
                            goals, projects, actions, metricDefinitions, metricEntries,
                            calendarEvents, notes, focuses, checkIns, insights,
                            periods, experiments, routines, journalEntries, fileAssets,
                            libraryItems, habits, habitLogs, sessions, userLimits, lifeAreas
                        ];

                        for (const table of tables) {
                            await tx.delete(table).where(eq((table as any).userId, userId));
                        }
                        await tx.delete(users).where(eq(users.id, userId));
                    }
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log bulk action
        await db.insert(adminAuditLogs).values({
            id: uuidv4(),
            adminId: adminId,
            action: `BULK_${action.toUpperCase()}`,
            entityType: 'user',
            entityId: 'multiple',
            details: { userIds, count: userIds.length },
            createdAt: new Date()
        });

        return NextResponse.json({ success: true, message: `Bulk action ${action} completed for ${userIds.length} users` });
    } catch (error: any) {
        console.error('Error in bulk action:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
