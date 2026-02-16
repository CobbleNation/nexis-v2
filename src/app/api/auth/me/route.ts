import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
        return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            subscriptionTier: user.subscriptionTier,
            onboardingCompleted: user.onboardingCompleted,
            role: user.role,
            cardLast4: user.cardLast4,
            cardToken: user.cardToken
        }
    });
}
