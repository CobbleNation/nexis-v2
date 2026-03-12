import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminEmailAccounts } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return false;
    return true;
}

// GET all email accounts
export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const accounts = await db.select({
            id: adminEmailAccounts.id,
            address: adminEmailAccounts.address,
            displayName: adminEmailAccounts.displayName,
            smtpHost: adminEmailAccounts.smtpHost,
            smtpPort: adminEmailAccounts.smtpPort,
            smtpSecure: adminEmailAccounts.smtpSecure,
            imapHost: adminEmailAccounts.imapHost,
            imapPort: adminEmailAccounts.imapPort,
            isActive: adminEmailAccounts.isActive,
            createdAt: adminEmailAccounts.createdAt,
        }).from(adminEmailAccounts);

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error('Failed to fetch email accounts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST create new email account
export async function POST(req: NextRequest) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const body = await req.json();
        const { address, displayName, smtpHost, smtpPort, smtpSecure, imapHost, imapPort, imapSecure, username, password } = body;

        if (!address || !displayName || !smtpHost || !username || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const id = uuid();
        await db.insert(adminEmailAccounts).values({
            id,
            address,
            displayName,
            smtpHost,
            smtpPort: smtpPort || 465,
            smtpSecure: smtpSecure !== false,
            imapHost: imapHost || null,
            imapPort: imapPort || 993,
            imapSecure: imapSecure !== false,
            username,
            password,
            isActive: true,
        });

        return NextResponse.json({ id, address, displayName }, { status: 201 });
    } catch (error) {
        console.error('Failed to create email account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE email account
export async function DELETE(req: NextRequest) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await db.delete(adminEmailAccounts).where(eq(adminEmailAccounts.id, id));
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Failed to delete email account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
