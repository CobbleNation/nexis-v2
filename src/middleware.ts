import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt-utils';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/api/auth/login', '/api/auth/register', '/api/debug/fix-areas', '/pricing', '/privacy', '/terms', '/api/billing/webhook'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow public paths
    if (pathname === '/' || PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        // For Auth entry pages, we want to actively redirect authenticated users to /overview,
        // and aggressively clear ANY lingering broken cookies for unauthenticated users 
        // to prevent ghost session resurrections.
        if (pathname === '/login' || pathname === '/register') {
            const accessToken = request.cookies.get('access_token')?.value;
            const refreshToken = request.cookies.get('refresh_token')?.value;

            let isAuthorized = false;

            if (accessToken) {
                if (await verifyJWT(accessToken)) isAuthorized = true;
            }
            if (!isAuthorized && refreshToken) {
                if (await verifyJWT(refreshToken)) isAuthorized = true;
            }

            if (isAuthorized) {
                return NextResponse.redirect(new URL('/overview', request.url));
            } else {
                // If they are not authorized, but HAVE cookies lying around, NUKE them.
                // This self-heals any broken state where a browser failed to delete a token on logout.
                if (accessToken || refreshToken) {
                    const response = NextResponse.next();
                    const isProduction = process.env.NODE_ENV === 'production';
                    response.cookies.set({ name: 'access_token', value: '', maxAge: 0, expires: new Date(0), path: '/', secure: isProduction, sameSite: 'lax', httpOnly: true });
                    response.cookies.set({ name: 'refresh_token', value: '', maxAge: 0, expires: new Date(0), path: '/', secure: isProduction, sameSite: 'lax', httpOnly: true });
                    return response;
                }
            }
        }
        return NextResponse.next();
    }

    // 2. Protect routes
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    let isAuthorized = false;
    let payload: any = null;

    if (accessToken) {
        payload = await verifyJWT(accessToken);
        if (payload) {
            isAuthorized = true;
        }
    }

    // If access token is invalid/missing, check if refresh token is VALID
    if (!isAuthorized && refreshToken) {
        const refreshPayload = await verifyJWT(refreshToken);
        if (refreshPayload) {
            // Valid refresh token, allow request through. 
            // The client or layout will trigger a call to /api/auth/refresh to get a new access token.
            isAuthorized = true;
            // Note: Since we don't have the access token's payload, we might need to be careful with role checks here.
            // But generally, the refresh flow handles this.
            // If admin route, we might need to wait for the refresh call on the client, or decode the refresh token to check roles if available (we only store userId currently).
        }
    }

    if (!isAuthorized) {
        // Unauthorized
        const response = pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            : NextResponse.redirect(new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url));

        // Clear invalid cookies to completely remove the ghost session
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookies.set({
            name: 'access_token',
            value: '',
            maxAge: 0,
            expires: new Date(0),
            path: '/',
            secure: isProduction,
            sameSite: 'lax',
            httpOnly: true,
        });

        response.cookies.set({
            name: 'refresh_token',
            value: '',
            maxAge: 0,
            expires: new Date(0),
            path: '/',
            secure: isProduction,
            sameSite: 'lax',
            httpOnly: true,
        });

        return response;
    }

    // Admin Guard
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        // If they only had a refresh token, we don't know their role immediately from jwt verify without hitting db.
        // It's safer to redirect them to /overview and let them refresh their token on the client, or we could fetch the user here.
        // But since payload is only set if accessToken is valid:
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
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
