
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function update() {
    try {
        const expiryDate = new Date('2026-04-09T00:00:00Z').getTime();
        const startedAt = new Date('2026-03-09T00:00:00Z').getTime();

        console.log(`Setting subscription for denyspypko@gmail.com to expire on ${new Date(expiryDate).toISOString()}`);

        const res = await client.execute({
            sql: "UPDATE users SET subscription_tier = 'pro', subscription_expires_at = ?, subscription_started_at = ?, auto_renew = 1 WHERE email = 'denyspypko@gmail.com'",
            args: [expiryDate, startedAt]
        });

        console.log("Update result:", res.rowsAffected);
    } catch (e) {
        console.error(e);
    }
}

update();
