import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, createAccessToken, createRefreshToken, setAuthCookies, validateSession, revokeSession, createSession, clearAuthCookies } from '@/lib/auth-utils';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

export async function POST(req: Request) {
    const cookieStore = await cookies();
    
    // Support both cookie-based (web) and body-based (mobile) refresh tokens
    let refreshToken = cookieStore.get('refresh_token')?.value;
    let isMobileClient = false;
    
    if (!refreshToken) {
        try {
            const body = await req.json();
            refreshToken = body.refreshToken;
            isMobileClient = true;
        } catch {
            // No body provided
        }
    }

    if (!refreshToken) {
        return NextResponse.json({ error: 'No refresh token' }, { status: 401, headers: noCacheHeaders });
    }

    // 1. Verify JWT signature
    const payload = await verifyJWT(refreshToken);
    if (!payload || !payload.userId) {
        if (!isMobileClient) await clearAuthCookies();
        return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401, headers: noCacheHeaders });
    }

    // 2. Validate session exists in DB (prevents ghost sessions)
    const session = await validateSession(refreshToken);
    if (!session) {
        if (!isMobileClient) await clearAuthCookies();
        return NextResponse.json({ error: 'Session revoked' }, { status: 401, headers: noCacheHeaders });
    }

    // 3. Look up user from DB to get the CURRENT role
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);
    if (!user) {
        if (!isMobileClient) await clearAuthCookies();
        return NextResponse.json({ error: 'User not found' }, { status: 401, headers: noCacheHeaders });
    }

    // 4. Rotate tokens: revoke old session, create new one
    const newAccessToken = await createAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = await createRefreshToken({ userId: user.id, role: user.role });

    await revokeSession(refreshToken);
    await createSession(user.id, newRefreshToken);
    
    if (!isMobileClient) {
        await setAuthCookies(newAccessToken, newRefreshToken);
    }

    return NextResponse.json({ 
        success: true,
        // Return tokens for mobile clients
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    }, { headers: noCacheHeaders });
}
