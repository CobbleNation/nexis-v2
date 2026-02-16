import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth-utils';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // Downgrade user to free
        await db.update(users)
            .set({ subscriptionTier: 'free' })
            .where(eq(users.id, payload.userId as string));

        return NextResponse.json({ message: 'Subscription cancelled' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
