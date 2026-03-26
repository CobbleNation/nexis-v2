import { NextResponse } from 'next/server';
import { verifyJWT, hashToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, userLimits, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

export async function GET(req: Request) {
    const cookieStore = await cookies();
    
    // Support both cookie-based (web) and Bearer token (mobile) auth
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : cookieStore.get('access_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized-ME' }, { status: 401, headers: noCacheHeaders });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
        return NextResponse.json({ error: 'Invalid Token' }, { status: 401, headers: noCacheHeaders });
    }

    // Double-check session in DB if refresh_token exists (web clients only)
    const refreshToken = cookieStore.get('refresh_token')?.value;
    if (refreshToken) {
        const [session] = await db.select().from(sessions).where(eq(sessions.refreshTokenHash, await hashToken(refreshToken))).limit(1);
        if (!session || session.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Session Revoked' }, { status: 401, headers: noCacheHeaders });
        }
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404, headers: noCacheHeaders });
    }

    // Fetch limits with defensive check
    let limits = null;
    try {
        const [limitsResult] = await db.select().from(userLimits).where(eq(userLimits.userId, user.id)).limit(1);
        limits = limitsResult || null;
    } catch (err) {
        console.warn("[Auth-Me] Failed to fetch user limits. Table user_limits might be missing.", err);
    }

    return NextResponse.json({
        user: {
            id: user.id,
            name: user.name || '',
            email: user.email,
            avatar: user.avatar,
            subscriptionTier: user.subscriptionTier,
            subscriptionStartedAt: user.subscriptionStartedAt,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            subscriptionPeriod: user.subscriptionPeriod,
            currentPriceOverride: user.currentPriceOverride,
            recurringPriceOverride: user.recurringPriceOverride,
            autoRenew: user.autoRenew,
            role: user.role,
            cardLast4: user.cardLast4,
            cardToken: user.cardToken,
            onboardingCompleted: user.onboardingCompleted,
            createdAt: user.createdAt,
            customLimits: limits ?? null
        }
    }, { headers: noCacheHeaders });
}

