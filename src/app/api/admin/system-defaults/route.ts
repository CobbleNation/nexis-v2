import { NextResponse } from 'next/server';
import { db } from '@/db';
import { habits, goals, projects, users, adminAuditLogs } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return null;

    return payload.userId as string; // Return admin ID
}

export async function GET(req: Request) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'habit';

    try {
        let data;
        if (type === 'habit') {
            data = await db.select().from(habits).where(eq(habits.isSystemDefault, true));
        } else if (type === 'goal') {
            data = await db.select().from(goals).where(eq(goals.isSystemDefault, true));
        } else if (type === 'project') {
            data = await db.select().from(projects).where(eq(projects.isSystemDefault, true));
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ items: data });
    } catch (error) {
        console.error('Failed to fetch defaults:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { type, title, ...otherProps } = body;

        if (!title || !type) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const id = uuidv4();
        let newItem;

        if (type === 'habit') {
            // Validate habit props if needed
            await db.insert(habits).values({
                id,
                userId: adminId, // Owned by admin
                title,
                isSystemDefault: true,
                ...otherProps, // frequency, etc.
                createdAt: new Date(),
                updatedAt: new Date()
            });
            newItem = { id, title, type: 'habit' };
        } else if (type === 'goal') {
            await db.insert(goals).values({
                id,
                userId: adminId,
                title,
                isSystemDefault: true,
                ...otherProps,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            newItem = { id, title, type: 'goal' };
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        // Audit Log
        await db.insert(adminAuditLogs).values({
            id: uuidv4(),
            adminId: adminId,
            action: 'CREATE_SYSTEM_DEFAULT',
            entityType: type,
            entityId: id,
            details: { title },
            createdAt: new Date()
        });

        return NextResponse.json({ item: newItem });
    } catch (error) {
        console.error('Failed to create default:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
