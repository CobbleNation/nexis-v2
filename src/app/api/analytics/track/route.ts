import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { trackEvent, EventName } from '@/lib/analytics-server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { eventName, metadata } = body;

        if (!eventName) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
        }

        // Fire and forget the DB lookup and event tracking to instantly return the API response
        (async () => {
            try {
                const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

                await trackEvent({
                    eventName: eventName as EventName,
                    userId: payload.userId as string,
                    plan: user?.subscriptionTier as any || 'free',
                    source: 'web',
                    metadata
                });
            } catch (bgErr) {
                console.error("Background tracking failed:", bgErr);
            }
        })();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Tracking API Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
