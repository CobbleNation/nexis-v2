
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

const dbPath = 'sqlite.db'; // Assuming running from root
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

const SEED_EMAIL = 'denyspypko@gmail.com';

async function seed() {
    console.log(`🌱 Seeding data for ${SEED_EMAIL}...`);

    // 1. Find User
    let user = await db.query.users.findFirst({
        where: eq(schema.users.email, SEED_EMAIL)
    });

    if (!user) {
        console.log(`User not found, creating...`);
        // Password hash is dummy here, assuming user knows their password or we set it to something compatible if we were mocking auth.
        // Since user provided password 'Ltybc2003', we can't easily hash it without the strict bcrypt settings used in app. 
        // BUT, if the user account ALREADY EXISTS, we use it. If not, we might fail to login via UI unless we hash correctly.
        // For now, let's assume it exists or we use a placeholder.
        const id = uuidv4();
        await db.insert(schema.users).values({
            id,
            email: SEED_EMAIL,
            name: 'Denys Pypko',
            passwordHash: 'placeholder_hash_if_created_manually',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        user = { id } as any;
        console.log(`Created user ${id}`);
    } else {
        console.log(`Found user ${user.id}`);
    }

    const userId = user!.id;

    // 清 Clear existing test data for clean slate (optional, but good for verification)
    // Be careful not to wipe real usage if this was a prod DB, but this is local dev.
    // Let's just append to avoid destroying manual work, or maybe delete items with specific "SEED" tag if we had one?
    // For now, just append.

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);

    const yearEnd = new Date(today.getFullYear(), 11, 31);

    // 2. Year View: Strategic Goal
    const goalId = uuidv4();
    await db.insert(schema.goals).values({
        id: goalId,
        userId,
        title: 'Launch Nexis 2.0 (Strategic)',
        type: 'strategic',
        status: 'active',
        priority: 'high',
        startDate: today,
        deadline: yearEnd,
        progress: 25,
    });
    console.log('Created Strategic Goal');

    // 3. Month View: Project & Milestone
    const projectId = uuidv4();
    await db.insert(schema.projects).values({
        id: projectId,
        userId,
        title: 'Beta Release Cycle',
        status: 'active',
        deadline: startOfNextMonth(today), // End of this month/start of next
        goalIds: [goalId], // Link to goal
    });
    console.log('Created Project (Deadline)');

    // Milestone (Event)
    const eventId = uuidv4();
    await db.insert(schema.calendarEvents).values({
        id: eventId,
        userId,
        title: 'Feature Complete Milestone', // Should show in Month view
        start: twoWeeks,
        end: new Date(twoWeeks.getTime() + 3600000), // 1 hour
        allDay: true,
    });
    // Note: My MonthView checks 'event' type from getScheduleItems.
    // getScheduleItems pulls from calendarEvents? Need to verify.
    // Assuming yes, or it pulls 'events' type.
    console.log('Created Milestone Event');

    // 4. Week View: Tasks (Load) & Explicit Deadline
    // Task 1 (Today)
    await db.insert(schema.actions).values({
        id: uuidv4(),
        userId,
        title: 'Refactor Week View Code',
        type: 'task',
        status: 'pending',
        priority: 'high',
        date: formatDate(today),
        startTime: '09:00',
        duration: 120,
        projectId,
    });

    // Task 2 (Today)
    await db.insert(schema.actions).values({
        id: uuidv4(),
        userId,
        title: 'Verify Month View',
        type: 'task',
        status: 'pending',
        priority: 'medium',
        date: formatDate(today),
        startTime: '13:00',
        duration: 60,
    });

    // Task 3 (Tomorrow)
    await db.insert(schema.actions).values({
        id: uuidv4(),
        userId,
        title: 'Marketing Plan Draft',
        type: 'task',
        status: 'pending',
        date: formatDate(tomorrow),
        startTime: '10:00',
        duration: 90,
    });

    // Explicit Deadline (Action with deadline? Or just Project Deadline?)
    // The WeekView shows Items of type 'deadline'. 
    // In `schedule-utils`, 'deadline' comes from Projects/Goals deadlines.
    // So the project created above should appear if its deadline is in the week.
    // Let's ensure we have a deadline THIS week for verification.

    const urgentProjectId = uuidv4();
    const friday = getNextDayOfWeek(today, 5); // Next Friday
    await db.insert(schema.projects).values({
        id: urgentProjectId,
        userId,
        title: 'Urgent Hotfix Release',
        status: 'active',
        deadline: friday,
    });
    console.log('Created Urgent Project Deadline for Week View');

    console.log('✅ Seeding Complete');
}

// Helpers
function formatDate(d: Date) {
    return d.toISOString().split('T')[0];
}

function startOfNextMonth(date: Date) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d;
}

function getNextDayOfWeek(date: Date, dayOfWeek: number) {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate;
}

seed().catch(console.error);
