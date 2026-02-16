import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth-utils';

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const payload = await verifyJWT(refreshToken);
    if (!payload || !payload.userId) {
        return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // In a real app, verify against DB whitelist/blacklist here

    const newAccessToken = await createAccessToken({ userId: payload.userId as string });
    const newRefreshToken = await createRefreshToken({ userId: payload.userId as string });

    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json({ success: true });
}
