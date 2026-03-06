import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userLimits, adminAuditLogs } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return null;
    return payload.userId as string;
}

// GET /api/admin/users/[id]/limits - fetch current custom limits for a user
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        const [limits] = await db
            .select()
            .from(userLimits)
            .where(eq(userLimits.userId, id));

        // Return the limits row (or null if no custom limits have been set)
        return NextResponse.json({ limits: limits ?? null });
    } catch (error) {
        console.error('Failed to fetch user limits:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/admin/users/[id]/limits - upsert custom limits for a user
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    try {
        const body = await req.json();

        // Helper: parse nullable integer (empty string / null / undefined -> null, otherwise integer)
        const parseNullableInt = (val: any) => {
            if (val === '' || val === null || val === undefined) return null;
            const n = parseInt(String(val), 10);
            return isNaN(n) ? null : n;
        };
        // Helper: parse nullable boolean (null/undefined -> null)
        const parseNullableBool = (val: any): boolean | null => {
            if (val === null || val === undefined) return null;
            return Boolean(val);
        };

        const data = {
            maxGoals: parseNullableInt(body.maxGoals),
            maxTasks: parseNullableInt(body.maxTasks),
            maxJournalEntries: parseNullableInt(body.maxJournalEntries),
            maxNotes: parseNullableInt(body.maxNotes),
            maxAiHints: parseNullableInt(body.maxAiHints),
            hasSubgoals: parseNullableBool(body.hasSubgoals),
            hasAiGoalBreakdown: parseNullableBool(body.hasAiGoalBreakdown),
            hasGoalAnalytics: parseNullableBool(body.hasGoalAnalytics),
            hasTaskPriority: parseNullableBool(body.hasTaskPriority),
            hasRecurringTasks: parseNullableBool(body.hasRecurringTasks),
            hasSmartFilters: parseNullableBool(body.hasSmartFilters),
            hasAutoPlanning: parseNullableBool(body.hasAutoPlanning),
            hasWeeklyView: parseNullableBool(body.hasWeeklyView),
            hasMonthlyView: parseNullableBool(body.hasMonthlyView),
            hasTags: parseNullableBool(body.hasTags),
            hasSearch: parseNullableBool(body.hasSearch),
            hasAiSummaries: parseNullableBool(body.hasAiSummaries),
            hasHistoryAnalytics: parseNullableBool(body.hasHistoryAnalytics),
            hasFullAi: parseNullableBool(body.hasFullAi),
            hasVoice: parseNullableBool(body.hasVoice),
            adminNote: typeof body.adminNote === 'string' ? body.adminNote.trim() || null : null,
            updatedAt: new Date(),
            updatedBy: adminId,
        };

        // Check if row already exists
        const [existing] = await db.select({ id: userLimits.id }).from(userLimits).where(eq(userLimits.userId, id));

        if (existing) {
            await db.update(userLimits).set(data).where(eq(userLimits.userId, id));
        } else {
            await db.insert(userLimits).values({ id: uuidv4(), userId: id, ...data });
        }

        // Audit log
        await db.insert(adminAuditLogs).values({
            id: uuidv4(),
            adminId,
            action: 'UPDATE_USER_LIMITS',
            entityType: 'user',
            entityId: id,
            details: data,
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update user limits:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
