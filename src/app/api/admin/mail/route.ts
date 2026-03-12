import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adminEmails, adminEmailAccounts } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuid } from 'uuid';
import { eq, desc, and } from 'drizzle-orm';
import nodemailer from 'nodemailer';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return false;
    return true;
}

// GET emails — ?accountId=...&folder=inbox|sent|archive|trash
export async function GET(req: NextRequest) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');
        const folder = searchParams.get('folder') || 'inbox';

        const conditions = [eq(adminEmails.folder, folder)];
        if (accountId) {
            conditions.push(eq(adminEmails.accountId, accountId));
        }

        const emails = await db.select()
            .from(adminEmails)
            .where(and(...conditions))
            .orderBy(desc(adminEmails.createdAt))
            .limit(100);

        return NextResponse.json({ emails });
    } catch (error) {
        console.error('Failed to fetch emails:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST send a new email
export async function POST(req: NextRequest) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const body = await req.json();
        const { accountId, to, toName, subject, bodyHtml, bodyText, inReplyTo } = body;

        if (!accountId || !to || !subject) {
            return NextResponse.json({ error: 'Missing required fields: accountId, to, subject' }, { status: 400 });
        }

        // Get the sending account's SMTP settings
        const [account] = await db.select().from(adminEmailAccounts).where(eq(adminEmailAccounts.id, accountId));
        if (!account) {
            return NextResponse.json({ error: 'Email account not found' }, { status: 404 });
        }

        // Create transporter with the account's settings
        const transporter = nodemailer.createTransport({
            host: account.smtpHost,
            port: account.smtpPort,
            secure: account.smtpSecure ?? true,
            auth: {
                user: account.username,
                pass: account.password,
            },
            tls: { rejectUnauthorized: false },
        });

        // Send the email
        const info = await transporter.sendMail({
            from: `"${account.displayName}" <${account.address}>`,
            to: toName ? `"${toName}" <${to}>` : to,
            subject,
            html: bodyHtml || undefined,
            text: bodyText || undefined,
            inReplyTo: inReplyTo || undefined,
        });

        // Store in DB as sent
        const emailId = uuid();
        const now = new Date();
        await db.insert(adminEmails).values({
            id: emailId,
            accountId,
            folder: 'sent',
            fromAddress: account.address,
            fromName: account.displayName,
            toAddress: to,
            toName: toName || null,
            subject,
            bodyHtml: bodyHtml || null,
            bodyText: bodyText || null,
            isRead: true,
            messageId: info.messageId,
            inReplyTo: inReplyTo || null,
            sentAt: now,
        });

        return NextResponse.json({ id: emailId, messageId: info.messageId });
    } catch (error: any) {
        console.error('Failed to send email:', error);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
