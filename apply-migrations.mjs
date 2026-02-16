import { createClient } from '@libsql/client';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing TURSO credentials");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function applyMigrations() {
    const migrationsDir = path.join(process.cwd(), 'drizzle');
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
        console.log(`Applying ${file}...`);
        const sql = readFileSync(path.join(migrationsDir, file), 'utf8');

        // Split by semicolon to execute statements individually if needed, 
        // but LibSQL executeMultiple is better if available, or just split.
        // Simple split by ';' might be fragile for complex SQL but good enough for simple schema.
        const statements = sql.split('--> statement-breakpoint');

        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    await client.execute(trimmed);
                } catch (e) {
                    // Ignore "already exists" errors for idempotency if possible, 
                    // or just log error. 
                    console.log(`Error applying statement (might be safe if exists): ${e.message}`);
                }
            }
        }
    }
    console.log("Migrations applied.");
}

applyMigrations();
