import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth-utils';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const payload = await verifyJWT(refreshToken);
    if (!payload || !payload.userId) {
        return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // Look up user from DB to get the CURRENT role (handles role changes)
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const newAccessToken = await createAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = await createRefreshToken({ userId: user.id, role: user.role });

    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json({ success: true });
}
