import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log("Checking columns for 'users' table...");
        const result = await (db as any).run(sql`PRAGMA table_info(users)`);
        console.table(result.rows);

        console.log("\nChecking if 'user_limits' table exists...");
        const tables = await (db as any).run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='user_limits'`);
        console.table(tables.rows);
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

main();
