
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

async function check() {
    try {
        console.log("--- Users Schema ---");
        const res = await client.execute("PRAGMA table_info(users)");
        res.rows.forEach(row => {
            if (['subscription_expires_at', 'auto_renew', 'subscription_tier'].includes(row.name)) {
                console.log(`${row.name}: ${row.type}`);
            }
        });

        console.log("\n--- Recent Subscriptions ---");
        const users = await client.execute("SELECT id, email, subscription_tier, subscription_expires_at, auto_renew FROM users WHERE subscription_tier = 'pro' OR subscription_expires_at IS NOT NULL ORDER BY updated_at DESC LIMIT 5");
        users.rows.forEach(u => {
            console.log(`${u.email} | Tier: ${u.subscription_tier} | Expires: ${u.subscription_expires_at} | Auto: ${u.auto_renew}`);
        });
    } catch (e) {
        console.error(e);
    }
}

check();
