import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearAuthCookies, revokeSession } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

export async function GET(request: Request) {
    // Revoke DB session before clearing cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    if (refreshToken) {
        await revokeSession(refreshToken).catch(() => { });
    }

    await clearAuthCookies();
    return NextResponse.redirect(new URL('/login?logged_out=1', request.url), { headers: noCacheHeaders });
}

export async function POST() {
    // Revoke DB session before clearing cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    if (refreshToken) {
        await revokeSession(refreshToken).catch(() => { });
    }

    await clearAuthCookies();
    return NextResponse.json({ success: true }, { headers: noCacheHeaders });
}
