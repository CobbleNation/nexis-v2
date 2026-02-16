
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';

const dbPath = 'sqlite.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

const SEED_EMAIL = 'denyspypko@gmail.com';

async function seedRoutine() {
    console.log(`🌱 Seeding Routine for ${SEED_EMAIL}...`);

    const user = await db.query.users.findFirst({
        where: eq(schema.users.email, SEED_EMAIL)
    });

    if (!user) {
        console.error("User not found!");
        process.exit(1);
    }

    const userId = user.id;

    // Create a Morning Routine
    await db.insert(schema.routines).values({
        id: uuidv4(),
        userId,
        title: 'Morning Yoga (Routine)',
        frequency: 'daily',
        time: '07:30',
        duration: 45,
        areaId: undefined, // General
    });

    console.log('✅ Routine Created: Morning Yoga at 07:30 (45 mins)');
}

seedRoutine().catch(console.error);
