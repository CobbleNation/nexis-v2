
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error('Missing TURSO credentials in .env.local');
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    try {
        console.log('Connecting to Turso...');

        const email = 'denyspypko@gmail.com';

        console.log(`Checking user: ${email}`);
        const result = await client.execute({
            sql: 'SELECT * FROM users WHERE email = ?',
            args: [email]
        });

        if (result.rows.length === 0) {
            console.error('User not found!');
            return;
        }

        console.log('User found. Updating role to ADMIN...');

        await client.execute({
            sql: "UPDATE users SET role = 'admin', subscription_tier = 'pro' WHERE email = ?",
            args: [email]
        });

        console.log('Success! User promoted to Admin.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.close();
    }
}

main();
