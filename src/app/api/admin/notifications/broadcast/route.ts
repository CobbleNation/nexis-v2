import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, notifications } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        // Verify Admin Role
        const [adminUser] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { title, message, type = 'announcement', link } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        // Get all users
        const allUsers = await db.select({ id: users.id }).from(users);

        // Create notifications for all users
        // Note: For very large user bases, this should be a background job / batch process.
        // For current scale, we'll do them in a loop or batch insert.
        const notificationRecords = allUsers.map(u => ({
            id: uuidv4(),
            userId: u.id,
            title,
            message,
            type,
            link,
            read: false,
            createdAt: new Date()
        }));

        // Batch insert in chunks of 100 to avoid statement limits
        const chunkSize = 100;
        for (let i = 0; i < notificationRecords.length; i += chunkSize) {
            const chunk = notificationRecords.slice(i, i + chunkSize);
            await db.insert(notifications).values(chunk);
        }

        return NextResponse.json({ 
            success: true, 
            count: notificationRecords.length 
        });

    } catch (error: any) {
        console.error('Broadcast Error:', error);
        return NextResponse.json({ error: 'Failed to broadcast notification' }, { status: 500 });
    }
}

import { eq } from 'drizzle-orm';
