import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function run() {
    try {
        await db.run(sql`ALTER TABLE actions ADD COLUMN description TEXT;`);
        console.log("Column description added to actions table.");
    } catch (e: any) {
        if (e.message && e.message.includes("duplicate column name")) {
            console.log("Column already exists.");
        } else {
            console.error(e);
        }
    }
}
run();
