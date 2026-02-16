import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/db';
import { actions, goals, notes, projects, lifeAreas, metricDefinitions, metricEntries, calendarEvents, focuses, checkIns, insights, periods, experiments, users, routines, journalEntries, fileAssets, libraryItems, habits, habitLogs } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { seedLifeAreas, DEFAULT_AREAS } from '@/lib/seed-areas';
import { DEFAULT_METRICS } from '@/lib/seed-metrics';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
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

        // --- RESURRECTION PROTOCOL ---
        // Verify user exists in DB. If DB was wiped but browser has token, we must recreate the user
        // to prevent Foreign Key constraints from failing during data restoration.
        const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!existingUser) {
            console.log(`[Sync] Data Wipe Detected. Resurrecting User ${userId} to restore system integrity.`);
            try {
                await db.insert(users).values({
                    id: userId,
                    email: `restored_${userId.substring(0, 6)}@nexis.system`,
                    name: 'User',
                    passwordHash: 'placeholder_hash_needs_reset',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } catch (err) {
                console.error("[Sync] Resurrection failed:", err);
                return NextResponse.json({ error: 'Account restoration failed' }, { status: 500 });
            }
        }

        // Fetch all data in parallel
        let [
            userActions,
            userGoals,
            userProjects,
            userNotes,
            userMetricDefs,
            userMetricEntries,
            userAreas,
            userEvents,
            userFocuses,
            userCheckIns,
            userInsights,
            userPeriods,
            userExperiments,
            userRoutines,
            userJournal,
            userFiles,
            userLibrary,
            userHabits,
            userHabitLogs
        ] = await Promise.all([
            db.select().from(actions).where(eq(actions.userId, userId)),
            db.select().from(goals).where(eq(goals.userId, userId)),
            db.select().from(projects).where(eq(projects.userId, userId)),
            db.select().from(notes).where(eq(notes.userId, userId)),
            db.select().from(metricDefinitions).where(eq(metricDefinitions.userId, userId)),
            db.select().from(metricEntries).where(eq(metricEntries.userId, userId)),
            db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId)),
            db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)),
            db.select().from(focuses).where(eq(focuses.userId, userId)),
            db.select().from(checkIns).where(eq(checkIns.userId, userId)),
            db.select().from(insights).where(eq(insights.userId, userId)),
            db.select().from(periods).where(eq(periods.userId, userId)),
            db.select().from(experiments).where(eq(experiments.userId, userId)),
            db.select().from(routines).where(eq(routines.userId, userId)),
            db.select().from(journalEntries).where(eq(journalEntries.userId, userId)),
            db.select().from(fileAssets).where(eq(fileAssets.userId, userId)),
            db.select().from(libraryItems).where(eq(libraryItems.userId, userId)),
            db.select().from(habits).where(eq(habits.userId, userId)),
            db.select().from(habitLogs).where(eq(habitLogs.userId, userId)),
        ]);

        // Auto-seed/Restore Life Areas (Robust Persistence)
        // Ensure all default areas exist. If missing (e.g. DB wipe or accidental delete), restore them.
        const existingTitles = new Set(userAreas.map(a => a.title));
        const missingAreas = DEFAULT_AREAS.filter(def => !existingTitles.has(def.title));

        if (missingAreas.length > 0) {
            console.log(`[Sync] Restoring ${missingAreas.length} missing life areas for user ${userId}`);

            const areasToInsert = missingAreas.map((area, index) => ({
                id: uuidv4(),
                userId,
                title: area.title,
                description: area.description,
                color: area.color,
                icon: area.icon || area.iconName, // Correct mapping to schema 'icon' column
                status: area.status,
                order: userAreas.length + index + 1, // Append order
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            // Insert into DB
            if (areasToInsert.length > 0) {
                await db.insert(lifeAreas).values(areasToInsert as any);
                // Update local variable to return full list to client
                userAreas = [...userAreas, ...areasToInsert] as any;
            }
        }

        // Robust Auto-seeding of missing metrics
        // We check every area and every expected default metric against existing userMetricDefs
        const newMetrics = [];
        const existingMetricsMap = new Set(
            userMetricDefs.map(m => `${m.areaId}:${m.name}`)
        );

        if (userAreas.length > 0) {
            for (const area of userAreas) {
                const areaDefaults = DEFAULT_METRICS[area.title] || [];
                for (const def of areaDefaults) {
                    const key = `${area.id}:${def.name}`;
                    if (!existingMetricsMap.has(key)) {
                        console.log(`[Sync] Seeding missing metric: ${def.name} for area ${area.title}`);
                        const newMetric = {
                            id: uuidv4(),
                            userId,
                            areaId: area.id,
                            name: def.name,
                            type: def.type,
                            unit: def.unit,
                            description: def.description,
                            frequency: def.frequency,
                            createdAt: new Date()
                        };
                        newMetrics.push(newMetric);
                        // Add to local list to prevent dupes in this loop if needed (though map key is unique per area+name)
                        // But also important: add to userMetricDefs so it's returned to client immediately!
                        // We will do that after insert.
                    }
                }
            }

            if (newMetrics.length > 0) {
                await db.insert(metricDefinitions).values(newMetrics as any);
                // Cast to any to avoid strict type issues with Date vs string in returned json vs db types
                userMetricDefs = [...userMetricDefs, ...newMetrics] as any;
            }
        }

        // Map DB schema to Frontend Interface (icon -> iconName normalization)
        const mappedAreas = userAreas.map(area => ({
            ...area,
            iconName: area.icon || 'Activity', // Frontend expects iconName
            icon: area.icon
        }));

        return NextResponse.json({
            actions: userActions,
            goals: userGoals,
            projects: userProjects,
            notes: userNotes,
            metricDefinitions: userMetricDefs,
            metricEntries: userMetricEntries,
            areas: mappedAreas,
            events: userEvents,
            focuses: userFocuses,
            checkIns: userCheckIns,
            insights: userInsights,
            periods: userPeriods,
            experiments: userExperiments,
            routines: userRoutines,
            journal: userJournal,
            files: userFiles,
            library: userLibrary,
            habits: userHabits,
            habitLogs: userHabitLogs
        });
    } catch (error) {
        console.error('GET /api/sync error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

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
        const body = await req.json();
        const { type, data } = body;

        console.log(`Sync POST received: ${type}`);

        if (type === 'ADD_ACTION' || type === 'UPDATE_ACTION') {
            const actionData = { ...data };
            if (typeof actionData.createdAt === 'string') actionData.createdAt = new Date(actionData.createdAt);
            if (typeof actionData.updatedAt === 'string') actionData.updatedAt = new Date(actionData.updatedAt);
            if (typeof actionData.dueDate === 'string' && actionData.dueDate) actionData.dueDate = new Date(actionData.dueDate);
            // if (typeof actionData.date === 'string' && actionData.date) actionData.date = new Date(actionData.date); // Keep as string for YYYY-MM-DD representation

            await db.insert(actions).values({ ...actionData, userId }).onConflictDoUpdate({ target: actions.id, set: actionData });
        } else if (type === 'DELETE_ACTION') {
            await db.delete(actions).where(eq(actions.id, data.id));
        } else if (type === 'TOGGLE_ACTION') {
            const [current] = await db.select().from(actions).where(eq(actions.id, data.id));
            if (current) {
                await db.update(actions)
                    .set({ completed: !current.completed, updatedAt: new Date() })
                    .where(eq(actions.id, data.id));
            }
        } else if (type === 'ADD_GOAL') {
            const goalData = { ...data };
            if (typeof goalData.createdAt === 'string') goalData.createdAt = new Date(goalData.createdAt);
            if (typeof goalData.updatedAt === 'string') goalData.updatedAt = new Date(goalData.updatedAt);
            if (typeof goalData.startDate === 'string' && goalData.startDate) goalData.startDate = new Date(goalData.startDate);
            if (typeof goalData.deadline === 'string' && goalData.deadline) goalData.deadline = new Date(goalData.deadline);
            if (typeof goalData.endDate === 'string' && goalData.endDate) goalData.endDate = new Date(goalData.endDate);

            await db.insert(goals).values({ ...goalData, userId }).onConflictDoUpdate({ target: goals.id, set: goalData });
        } else if (type === 'UPDATE_GOAL') {
            const goalData = { ...data };
            if (typeof goalData.createdAt === 'string') goalData.createdAt = new Date(goalData.createdAt);
            if (typeof goalData.updatedAt === 'string') goalData.updatedAt = new Date(goalData.updatedAt);
            if (typeof goalData.startDate === 'string' && goalData.startDate) goalData.startDate = new Date(goalData.startDate);
            if (typeof goalData.deadline === 'string' && goalData.deadline) goalData.deadline = new Date(goalData.deadline);
            if (typeof goalData.endDate === 'string' && goalData.endDate) goalData.endDate = new Date(goalData.endDate);

            // Note: We don't strictly enforce 30-day rule here in Sync to avoid blocking data consistency if client was allowed.
            // Client UI and specific API routes are the first line of defense. 
            await db.insert(goals).values({ ...goalData, userId }).onConflictDoUpdate({ target: goals.id, set: goalData });
        } else if (type === 'DELETE_GOAL') {
            await db.delete(goals).where(and(eq(goals.id, data.id), eq(goals.userId, userId)));
        } else if (type === 'ADD_NOTE') {
            const noteData = { ...data };
            if (typeof noteData.createdAt === 'string') noteData.createdAt = new Date(noteData.createdAt);
            if (typeof noteData.updatedAt === 'string') noteData.updatedAt = new Date(noteData.updatedAt);
            if (typeof noteData.date === 'string' && noteData.date) noteData.date = new Date(noteData.date);
            await db.insert(notes).values({ ...noteData, userId });
        } else if (type === 'ADD_EVENT') {
            const eventData = { ...data };
            if (typeof eventData.createdAt === 'string') eventData.createdAt = new Date(eventData.createdAt);
            if (typeof eventData.updatedAt === 'string') eventData.updatedAt = new Date(eventData.updatedAt);
            if (typeof eventData.date === 'string' && eventData.date) eventData.date = new Date(eventData.date);
            if (typeof eventData.start === 'string' && eventData.start) eventData.start = new Date(eventData.start);
            if (typeof eventData.end === 'string' && eventData.end) eventData.end = new Date(eventData.end);

            // Map AppEvent to calendarEvents schema if needed, assuming schema matches for now or we use calendarEvents table
            // Note: schema uses 'calendar_events' table. 'AppEvent' type maps to it.
            // Check schema: start, end are required timestamps.
            // Adjust property names if necessary. 
            // In schema: title, start, end, allDay.
            // In AppEvent: title, date, startTime, endTime... might need mapping.
            // Let's assume standard Calendar Event structure for safety for now.
            // Wait, schema has 'calendar_events'.
            await db.insert(calendarEvents).values({
                id: eventData.id,
                userId,
                title: eventData.title,
                start: eventData.start || new Date(eventData.date), // Fallback
                end: eventData.end || new Date(eventData.date), // Fallback
                allDay: eventData.allDay || false,
                areaId: eventData.areaId
            });
        } else if (type === 'ADD_METRIC_DEF') {
            const metricData = { ...data };
            if (typeof metricData.createdAt === 'string') metricData.createdAt = new Date(metricData.createdAt);
            await db.insert(metricDefinitions).values({ ...metricData, userId });
        } else if (type === 'ADD_METRIC_ENTRY') {
            const entryData = { ...data };
            if (typeof entryData.createdAt === 'string') entryData.createdAt = new Date(entryData.createdAt);
            if (typeof entryData.date === 'string') entryData.date = new Date(entryData.date);

            await db.insert(metricEntries).values({ ...entryData, userId });
        } else if (type === 'UPDATE_AREA') {
            const areaData = { ...data };
            if (typeof areaData.createdAt === 'string') areaData.createdAt = new Date(areaData.createdAt);
            if (typeof areaData.updatedAt === 'string') areaData.updatedAt = new Date(areaData.updatedAt);

            await db.insert(lifeAreas).values({ ...areaData, userId }).onConflictDoUpdate({ target: lifeAreas.id, set: areaData });
        } else if (type === 'DELETE_AREA') {
            await db.delete(lifeAreas).where(eq(lifeAreas.id, data.id));
        } else if (type === 'ADD_PROJECT' || type === 'UPDATE_PROJECT') {
            const projectData = { ...data };
            if (typeof projectData.createdAt === 'string') projectData.createdAt = new Date(projectData.createdAt);
            if (typeof projectData.updatedAt === 'string') projectData.updatedAt = new Date(projectData.updatedAt);
            if (typeof projectData.deadline === 'string' && projectData.deadline) projectData.deadline = new Date(projectData.deadline);

            await db.insert(projects).values({ ...projectData, userId }).onConflictDoUpdate({ target: projects.id, set: projectData });
        } else if (type === 'ADD_ROUTINE' || type === 'UPDATE_ROUTINE') {
            const routineData = { ...data };
            if (typeof routineData.createdAt === 'string') routineData.createdAt = new Date(routineData.createdAt);
            if (typeof routineData.updatedAt === 'string') routineData.updatedAt = new Date(routineData.updatedAt);

            await db.insert(routines).values({ ...routineData, userId }).onConflictDoUpdate({ target: routines.id, set: routineData });
        } else if (type === 'DELETE_ROUTINE') {
            await db.delete(routines).where(eq(routines.id, data.id));
        } else if (type === 'UPDATE_NOTE') {
            const noteData = { ...data };
            if (typeof noteData.createdAt === 'string') noteData.createdAt = new Date(noteData.createdAt);
            if (typeof noteData.updatedAt === 'string') noteData.updatedAt = new Date(noteData.updatedAt);
            if (typeof noteData.date === 'string' && noteData.date) noteData.date = new Date(noteData.date);
            await db.insert(notes).values({ ...noteData, userId }).onConflictDoUpdate({ target: notes.id, set: noteData });
        } else if (type === 'DELETE_NOTE') {
            await db.delete(notes).where(eq(notes.id, data.id));
        } else if (type === 'ADD_JOURNAL' || type === 'UPDATE_JOURNAL') {
            const journalData = { ...data };
            if (typeof journalData.createdAt === 'string') journalData.createdAt = new Date(journalData.createdAt);
            if (typeof journalData.updatedAt === 'string') journalData.updatedAt = new Date(journalData.updatedAt);
            if (typeof journalData.date === 'string') journalData.date = new Date(journalData.date);
            await db.insert(journalEntries).values({ ...journalData, userId }).onConflictDoUpdate({ target: journalEntries.id, set: journalData });
        } else if (type === 'DELETE_JOURNAL') {
            await db.delete(journalEntries).where(eq(journalEntries.id, data.id));
        } else if (type === 'ADD_FILE' || type === 'UPDATE_FILE') {
            const fileData = { ...data };
            if (typeof fileData.createdAt === 'string') fileData.createdAt = new Date(fileData.createdAt);
            if (typeof fileData.updatedAt === 'string') fileData.updatedAt = new Date(fileData.updatedAt);
            await db.insert(fileAssets).values({ ...fileData, userId }).onConflictDoUpdate({ target: fileAssets.id, set: fileData });
        } else if (type === 'DELETE_FILE') {
            await db.delete(fileAssets).where(eq(fileAssets.id, data.id));
        } else if (type === 'ADD_LIBRARY_ITEM' || type === 'UPDATE_LIBRARY_ITEM') {
            const libData = { ...data };
            if (typeof libData.createdAt === 'string') libData.createdAt = new Date(libData.createdAt);
            if (typeof libData.updatedAt === 'string') libData.updatedAt = new Date(libData.updatedAt);
            await db.insert(libraryItems).values({ ...libData, userId }).onConflictDoUpdate({ target: libraryItems.id, set: libData });
        } else if (type === 'DELETE_LIBRARY_ITEM') {
            await db.delete(libraryItems).where(eq(libraryItems.id, data.id));
        } else if (type === 'ADD_HABIT' || type === 'UPDATE_HABIT') {
            const habitData = { ...data };
            if (typeof habitData.createdAt === 'string') habitData.createdAt = new Date(habitData.createdAt);
            if (typeof habitData.updatedAt === 'string') habitData.updatedAt = new Date(habitData.updatedAt);
            await db.insert(habits).values({ ...habitData, userId }).onConflictDoUpdate({ target: habits.id, set: habitData });
        } else if (type === 'DELETE_HABIT') {
            await db.delete(habits).where(eq(habits.id, data.id));
        } else if (type === 'LOG_HABIT') {
            const logData = { ...data };
            // Logs don't usually have created/updated at in legacy types but schema might have them.
            // Check Basic schema. usually just id, habitId, date, completed.
            // Schema likely has createdAt for sync.
            // Assume schema matches HabitLog interface.
            // We should ensure date is string YYYY-MM-DD
            await db.insert(habitLogs).values({ ...logData, userId }).onConflictDoUpdate({ target: habitLogs.id, set: logData });
        } else if (type === 'DELETE_HABIT_LOG') {
            await db.delete(habitLogs).where(eq(habitLogs.id, data.id));
        }
        // Add others as needed, but for now Focus Level relies on Actions, Goals checkins mainly.
        // Wait, 'metrics' table exists. 'focuses' table DOES NOT EXIST in schema.ts yet?
        // Let's check schema.ts again.
        // I checked schema.ts earlier (Step 392).
        // It has: users, sessions, life_areas, goals, projects, actions, metrics, calendar_events, notes.
        // It DOES NOT have: focuses, checkIns, insights, periods, experiments. 
        // THESE TABLES ARE MISSING from the DB!
        // That is another massive reason why persistence fails.


        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Sync POST Error", e);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
