import { createClient } from '@libsql/client';
import "dotenv/config";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
    try {
        await client.execute('ALTER TABLE notifications ADD COLUMN content text;');
        console.log("Success: Added content column to notifications");
    } catch (e: any) {
        if (e.message.includes('duplicate column')) {
             console.log("Column already exists, skipping.");
        } else {
             console.error("Failed:", e);
        }
    }
}

main();
