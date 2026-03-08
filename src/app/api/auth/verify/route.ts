import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/login?error=missing_token', req.url));
        }

        // Find user with this token and check expiry
        const [user] = await db.select()
            .from(users)
            .where(eq(users.verificationToken, token))
            .limit(1);

        if (!user) {
            return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
        }

        if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
            return NextResponse.redirect(new URL('/login?error=expired_token', req.url));
        }

        // Mark as verified
        await db.update(users)
            .set({
                emailVerified: new Date(),
                verificationToken: null,
                verificationTokenExpiry: null
            })
            .where(eq(users.id, user.id));

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zynorvia.com';
        const secureBaseUrl = baseUrl.includes('zynorvia.com') ? baseUrl.replace('http://', 'https://') : baseUrl;

        return NextResponse.redirect(new URL('/auth/verified', secureBaseUrl));
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.redirect(new URL('/login?error=internal_error', req.url));
    }
}
