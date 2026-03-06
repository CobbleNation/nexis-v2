// GET /api/users/limits - fetch the current user's custom limit overrides
// Used by the app's store/hooks to apply per-user limits on top of plan defaults
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userLimits } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return NextResponse.json({ limits: null });

    const payload = await verifyJWT(token);
    if (!payload?.userId) return NextResponse.json({ limits: null });

    try {
        const [limits] = await db
            .select()
            .from(userLimits)
            .where(eq(userLimits.userId, payload.userId as string));

        return NextResponse.json({ limits: limits ?? null });
    } catch {
        return NextResponse.json({ limits: null });
    }
}
