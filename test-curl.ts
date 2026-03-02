import { SignJWT } from 'jose';
import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function run() {
    try {
        const userList = await db.select().from(users).limit(1);
        if (!userList.length) return;
        const userId = userList[0].id;

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
        const token = await new SignJWT({ userId, role: 'user' })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        // Simulate frontend Action update
        const payload = {
            type: 'UPDATE_ACTION',
            data: {
                id: "test-task-api-1234",
                userId: "current-user", // <--- THE BUG IS LIKELY HERE
                title: "Test Task via API Updated",
                type: "task",
                status: "pending",
                completed: false,
                priority: "medium",
                date: "2026-03-05",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };

        const res = await fetch('http://localhost:3000/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${token}`
            },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        console.log("Response JSON:", await res.text());
    } catch (e) { console.error(e); }
}

run();
