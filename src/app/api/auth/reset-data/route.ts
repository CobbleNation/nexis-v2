
import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
    goals, actions, journalEntries, focuses, checkIns, insights,
    periods, experiments, routines, habitLogs, habits, fileAssets,
    libraryItems, calendarEvents, notes, metricEntries, metricDefinitions,
    projects, lifeAreas
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { seedLifeAreas } from '@/lib/seed-areas';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const userId = payload.userId as string;

        // Delete all user data
        // Order matters slightly for FKs if not cascade, but generally independent in this schema or linked to user

        await db.delete(habitLogs).where(eq(habitLogs.userId, userId));
        await db.delete(habits).where(eq(habits.userId, userId));
        await db.delete(routines).where(eq(routines.userId, userId));

        await db.delete(actions).where(eq(actions.userId, userId));
        await db.delete(projects).where(eq(projects.userId, userId));
        await db.delete(goals).where(eq(goals.userId, userId));

        await db.delete(metricEntries).where(eq(metricEntries.userId, userId));
        await db.delete(metricDefinitions).where(eq(metricDefinitions.userId, userId));

        await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
        await db.delete(notes).where(eq(notes.userId, userId));
        await db.delete(fileAssets).where(eq(fileAssets.userId, userId));
        await db.delete(libraryItems).where(eq(libraryItems.userId, userId));

        await db.delete(calendarEvents).where(eq(calendarEvents.userId, userId));
        await db.delete(focuses).where(eq(focuses.userId, userId));
        await db.delete(checkIns).where(eq(checkIns.userId, userId));
        await db.delete(insights).where(eq(insights.userId, userId));
        await db.delete(periods).where(eq(periods.userId, userId));
        await db.delete(experiments).where(eq(experiments.userId, userId));

        // Finally delete Life Areas (will be re-seeded)
        await db.delete(lifeAreas).where(eq(lifeAreas.userId, userId));

        // Re-seed Logic
        await seedLifeAreas(userId);

        return NextResponse.json({ success: true, message: 'Account reset successfully' });

    } catch (error: any) {
        console.error("Reset Account Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
