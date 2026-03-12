import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminEmails } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return false;
    return true;
}

// GET single email
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id } = await params;
        const [email] = await db.select().from(adminEmails).where(eq(adminEmails.id, id));
        if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ email });
    } catch (error) {
        console.error('Failed to fetch email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH — mark read/unread, star, move to folder
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id } = await params;
        const body = await req.json();

        const updates: Record<string, any> = {};
        if (body.isRead !== undefined) updates.isRead = body.isRead;
        if (body.isStarred !== undefined) updates.isStarred = body.isStarred;
        if (body.folder) updates.folder = body.folder;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        await db.update(adminEmails).set(updates).where(eq(adminEmails.id, id));

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Failed to update email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE email
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id } = await params;
        await db.delete(adminEmails).where(eq(adminEmails.id, id));
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Failed to delete email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
