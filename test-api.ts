import { config } from 'dotenv';
import { db } from './src/db';
import { users } from './src/db/schema';
import { SignJWT } from 'jose';

config({ path: '.env.local' });

async function run() {
    try {
        const userList = await db.select().from(users).limit(1);
        if (!userList.length) {
            console.log("No users found");
            return;
        }
        const userId = userList[0].id;

        // Generate JWT token like the app does
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
        const token = await new SignJWT({ userId, role: 'user' })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        // Payload for ADD_ACTION
        const payload = {
            type: 'ADD_ACTION',
            data: {
                id: "test-task-1",
                userId: "current-user",
                title: "Test Task via API",
                type: "task",
                status: "pending",
                completed: false,
                priority: "medium",
                date: "2026-03-02",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
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

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);

    } catch (e) {
        console.error(e);
    }
}
run();
