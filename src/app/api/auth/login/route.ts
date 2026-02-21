import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth-utils';
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
            // Timing attack mitigation technically needed here but MVP
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check Password
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create Tokens
        const accessToken = await createAccessToken({ userId: user.id, role: user.role });
        const refreshToken = await createRefreshToken({ userId: user.id, role: user.role });

        await setAuthCookies(accessToken, refreshToken);

        // Track Login
        await trackEvent({
            eventName: 'user_login',
            userId: user.id,
            plan: user.subscriptionTier as 'free' | 'pro' || 'free',
            source: 'web'
        });

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
                cardToken: user.cardToken
            }
        });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
