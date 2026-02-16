import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const log = [];

        // 1. Create metric_definitions if missing
        try {
            await db.run(sql`
                CREATE TABLE IF NOT EXISTS metric_definitions (
                    id text PRIMARY KEY NOT NULL,
                    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    area_id text NOT NULL,
                    name text NOT NULL,
                    type text DEFAULT 'number',
                    unit text,
                    description text,
                    frequency text DEFAULT 'weekly',
                    created_at integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
                );
             `);
            log.push("Created metric_definitions table");
        } catch (e) { log.push(`Error creating metric_definitions: ${e}`); }

        // 2. Create metric_entries if missing
        try {
            await db.run(sql`
                CREATE TABLE IF NOT EXISTS metric_entries (
                    id text PRIMARY KEY NOT NULL,
                    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    metric_id text NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
                    value real NOT NULL,
                    date integer NOT NULL,
                    note text,
                    created_at integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
                );
             `);
            log.push("Created metric_entries table");
        } catch (e) { log.push(`Error creating metric_entries: ${e}`); }

        // 3. Drop old 'metrics' table if exists to confirm cleanup (optional, maybe keep for backup)
        // log.push("Skipping drop of old metrics table for safety");

        // 4. Check tables again
        const tables = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table'`);

        return NextResponse.json({
            success: true,
            log,
            tables: tables.map((r: any) => r.name)
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
