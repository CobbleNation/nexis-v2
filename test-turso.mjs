import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log('Testing connection to:', url);
console.log('Token length:', authToken?.length);

const client = createClient({
    url,
    authToken,
});

async function test() {
    try {
        const rs = await client.execute("SELECT 1");
        console.log("Connection successful!", rs);
    } catch (e) {
        console.error("Connection failed:", e);
    }
}

test();
