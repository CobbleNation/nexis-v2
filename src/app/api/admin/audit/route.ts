import { NextResponse } from 'next/server';
import { db } from '@/db';
import { adminAuditLogs, users } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { desc, eq } from 'drizzle-orm';

async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'admin') return false;

    return true;
}

export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const logs = await db.select({
            id: adminAuditLogs.id,
            action: adminAuditLogs.action,
            entityType: adminAuditLogs.entityType,
            entityId: adminAuditLogs.entityId,
            details: adminAuditLogs.details,
            createdAt: adminAuditLogs.createdAt,
            adminName: users.name,
            adminEmail: users.email
        })
            .from(adminAuditLogs)
            .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
            .orderBy(desc(adminAuditLogs.createdAt))
            .limit(100); // Pagination later

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
