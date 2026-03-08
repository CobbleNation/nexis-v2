import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createAccessToken, createRefreshToken, setAuthCookies, createSession } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zynorvia.com';

    // Safety: Redirect GET requests to the UI page to prevent bot pre-fetching from consuming tokens
    return NextResponse.redirect(new URL(`/auth/verify?token=${token || ''}`, baseUrl));
}

export async function POST(req: Request) {
    try {
        const { token } = await req.json();
        console.log('[Verify] POST received with token:', token?.substring(0, 8) + '...');

        if (!token) {
            return NextResponse.json({ error: 'Токен відсутній' }, { status: 400 });
        }

        // Find user with this token
        const [user] = await db.select()
            .from(users)
            .where(eq(users.verificationToken, token))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: 'Недійсний токен або акаунт уже підтверджено' }, { status: 400 });
        }

        // Check expiry
        if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
            return NextResponse.json({ error: 'Термін дії токена закінчився' }, { status: 400 });
        }

        // Mark as verified
        await db.update(users)
            .set({
                emailVerified: new Date(),
                verificationToken: null,
                verificationTokenExpiry: null
            })
            .where(eq(users.id, user.id));

        // Auto-login: Create session and set cookies
        const accessToken = await createAccessToken({ userId: user.id, role: user.role });
        const refreshToken = await createRefreshToken({ userId: user.id });
        await createSession(user.id, refreshToken);
        await setAuthCookies(accessToken, refreshToken);

        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
    }
}

