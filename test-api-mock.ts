import { POST } from './src/app/api/sync/route';
import { db } from './src/db';
import { users } from './src/db/schema';
import { SignJWT } from 'jose';

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
                description: "will be dropped",
            }
        };

        // Mock NextRequest
        const req = new Request('http://localhost:3000/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `access_token=${token}`
            },
            body: JSON.stringify(payload)
        });

        const res = await POST(req as any);
        console.log("Status:", res.status);
        console.log("Response:", await res.text());

    } catch (e) {
        console.error(e);
    }
}
run();
