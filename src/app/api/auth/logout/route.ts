import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

export async function GET(request: Request) {
    await clearAuthCookies();
    return NextResponse.redirect(new URL('/login?logged_out=1', request.url), { headers: noCacheHeaders });
}

export async function POST() {
    await clearAuthCookies();
    return NextResponse.json({ success: true }, { headers: noCacheHeaders });
}
