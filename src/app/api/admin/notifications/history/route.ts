import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, notifications } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, desc, sql, and } from 'drizzle-orm';

export async function GET(req: Request) {
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

        // Fetch unique broadcasts grouped by their content
        const history = await db.select({
            title: notifications.title,
            message: notifications.message,
            content: notifications.content,
            type: notifications.type,
            link: notifications.link,
            createdAt: sql<number>`MAX(${notifications.createdAt})`.as('createdAt'),
            count: sql<number>`COUNT(${notifications.id})`.as('count')
        })
        .from(notifications)
        .groupBy(
            notifications.title, 
            notifications.message, 
            notifications.content, 
            notifications.type, 
            notifications.link
        )
        .orderBy(desc(sql`MAX(${notifications.createdAt})`))
        .limit(100);

        return NextResponse.json({ history });

    } catch (error: any) {
        console.error('Fetch History Error:', error);
        return NextResponse.json({ error: 'Failed to fetch notification history' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
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

        const url = new URL(req.url);
        const title = url.searchParams.get('title');
        const message = url.searchParams.get('message');
        const type = url.searchParams.get('type') || 'announcement';

        if (!title || !message) {
            return NextResponse.json({ error: 'Missing identifying parameters (title, message)' }, { status: 400 });
        }

        // Delete all matching notifications
        const result = await db.delete(notifications)
            .where(
                and(
                    eq(notifications.title, title),
                    eq(notifications.message, message),
                    eq(notifications.type, type)
                )
            );

        return NextResponse.json({ success: true, deleted: true });

    } catch (error: any) {
        console.error('Delete Broadcast Error:', error);
        return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 });
    }
}
