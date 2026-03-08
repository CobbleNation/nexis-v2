import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');
        console.log('[Verify] Request received with token:', token?.substring(0, 8) + '...');

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zynorvia.com';
        if (!token) {
            return NextResponse.redirect(new URL('/login?error=missing_token', baseUrl));
        }

        // Find user with this token and check expiry
        const [user] = await db.select()
            .from(users)
            .where(eq(users.verificationToken, token))
            .limit(1);

        if (!user) {
            return NextResponse.redirect(new URL('/login?error=invalid_token', baseUrl));
        }

        if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
            return NextResponse.redirect(new URL('/login?error=expired_token', baseUrl));
        }

        // Mark as verified
        await db.update(users)
            .set({
                emailVerified: new Date(),
                verificationToken: null,
                verificationTokenExpiry: null
            })
            .where(eq(users.id, user.id));

        const response = NextResponse.redirect(new URL('/auth/verified', baseUrl));
        response.headers.set('X-Verification-Source', 'route-handler');
        return response;
    } catch (error) {
        console.error('Verification error:', error);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zynorvia.com';
        return NextResponse.redirect(new URL('/login?error=internal_error', baseUrl));
    }
}
