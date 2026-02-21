import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt-utils';

// Routes that don't require authentication
const PUBLIC_PATHS = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/refresh',
    '/api/auth/me',
    '/api/debug/fix-areas',
    '/pricing',
    '/privacy',
    '/terms',
    '/api/billing/webhook',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow all public paths and the landing page — no auth checks at all
    if (pathname === '/' || PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 2. Everything else requires authentication
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    let isAuthorized = false;
    let payload: any = null;

    // Check access token first
    if (accessToken) {
        payload = await verifyJWT(accessToken);
        if (payload) {
            isAuthorized = true;
        }
    }

    // If access token is invalid/expired, check refresh token
    if (!isAuthorized && refreshToken) {
        const refreshPayload = await verifyJWT(refreshToken);
        if (refreshPayload) {
            isAuthorized = true;
            payload = refreshPayload;
        }
    }

    // Not authenticated — redirect to login and clear any stale cookies
    if (!isAuthorized) {
        const isApiRoute = pathname.startsWith('/api/');

        if (isApiRoute) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const response = NextResponse.redirect(
            new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url)
        );

        // Clear any invalid cookies
        const isProduction = process.env.NODE_ENV === 'production';
        response.cookies.set({ name: 'access_token', value: '', maxAge: 0, expires: new Date(0), path: '/', secure: isProduction, sameSite: 'lax', httpOnly: true });
        response.cookies.set({ name: 'refresh_token', value: '', maxAge: 0, expires: new Date(0), path: '/', secure: isProduction, sameSite: 'lax', httpOnly: true });

        return response;
    }

    // 3. Admin route guard
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const role = payload?.role as string | undefined;
        if (role !== 'admin') {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            return NextResponse.redirect(new URL('/overview', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
    ],
};
