import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fixSchema() {
    try {
        console.log("Adding onboarding_completed to users table...");
        await db.run(sql`ALTER TABLE users ADD onboarding_completed integer DEFAULT false;`);
        console.log("Column added successfully!");
    } catch (err: any) {
        if (err.message?.includes('duplicate column name')) {
            console.log("Column already exists.");
        } else {
            console.error("Failed to alter table:", err);
        }
    }
}

fixSchema();
