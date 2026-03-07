import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userLimits } from '@/db/schema';
import { verifyPassword, createAccessToken, createRefreshToken, setAuthCookies, createSession } from '@/lib/auth-utils';
import { trackEvent } from '@/lib/analytics-server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        // Find User
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check Password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if Email is Verified
        if (!user.emailVerified) {
            return NextResponse.json({
                error: 'Email not verified',
                unverified: true
            }, { status: 403 });
        }

        // Create Tokens
        const accessToken = await createAccessToken({ userId: user.id, role: user.role });
        const refreshToken = await createRefreshToken({ userId: user.id, role: user.role });

        // Store session in DB and set cookies
        await createSession(user.id, refreshToken);
        await setAuthCookies(accessToken, refreshToken);

        // Track Login
        await trackEvent({
            eventName: 'user_login',
            userId: user.id,
            plan: user.subscriptionTier as 'free' | 'pro' || 'free',
            source: 'web'
        });

        // Fetch Custom Limits with defensive check
        let limits = null;
        try {
            const [limitsResult] = await db.select().from(userLimits).where(eq(userLimits.userId, user.id)).limit(1);
            limits = limitsResult || null;
        } catch (err) {
            console.warn("[Auth-Login] Failed to fetch user limits. Table user_limits might be missing.", err);
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                subscriptionTier: user.subscriptionTier,
                onboardingCompleted: user.onboardingCompleted,
                cardLast4: user.cardLast4,
                cardToken: user.cardToken,
                customLimits: limits ?? null
            }
        });
    } catch (err) {
        console.error("Login Critical Error:", err);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? (err as any).message : 'Please check server logs'
        }, { status: 500 });
    }
}
