// Migration script: creates user_limits table in Turso
// Run with: node migrate-user-limits.mjs
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
}

const url = env.TURSO_DATABASE_URL;
const authToken = env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('❌ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not found in .env.local');
    process.exit(1);
}

const client = createClient({ url, authToken });

const SQL = `
CREATE TABLE IF NOT EXISTS user_limits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Numeric overrides (NULL = use plan default)
    max_goals INTEGER,
    max_tasks INTEGER,
    max_journal_entries INTEGER,
    max_notes INTEGER,
    max_ai_hints INTEGER,

    -- Boolean feature overrides (NULL = use plan default)
    has_subgoals INTEGER,
    has_ai_goal_breakdown INTEGER,
    has_goal_analytics INTEGER,
    has_task_priority INTEGER,
    has_recurring_tasks INTEGER,
    has_smart_filters INTEGER,
    has_auto_planning INTEGER,
    has_weekly_view INTEGER,
    has_monthly_view INTEGER,
    has_tags INTEGER,
    has_search INTEGER,
    has_ai_summaries INTEGER,
    has_history_analytics INTEGER,
    has_full_ai INTEGER,
    has_voice INTEGER,

    -- Admin metadata
    admin_note TEXT,
    updated_at INTEGER NOT NULL,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
`;

try {
    await client.execute(SQL);
    console.log('✅ user_limits table created (or already exists)');
} catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
}
