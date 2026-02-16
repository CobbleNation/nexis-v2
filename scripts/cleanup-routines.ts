
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { routines } from '../src/db/schema';
import { eq, inArray } from 'drizzle-orm';

const dbPath = 'sqlite.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function cleanupRoutines() {
    console.log('🧹 cleanupRoutines started...');

    const allRoutines = await db.select().from(routines);
    const seen = new Set<string>();
    const toDelete: string[] = [];

    for (const r of allRoutines) {
        // Unique key based on Title and Time
        const key = `${r.userId}-${r.title}-${r.time}`;

        if (seen.has(key)) {
            toDelete.push(r.id);
        } else {
            seen.add(key);
        }
    }

    console.log(`Found ${toDelete.length} duplicate routines.`);

    if (toDelete.length > 0) {
        await db.delete(routines).where(inArray(routines.id, toDelete));
        console.log('✅ Deleted duplicates.');
    } else {
        console.log('✨ No duplicates found.');
    }
}

cleanupRoutines().catch(console.error);
