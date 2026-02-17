import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt-utils';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/api/auth/login', '/api/auth/register', '/api/debug/fix-areas', '/pricing', '/privacy', '/terms', '/api/billing/webhook'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow public paths
    if (pathname === '/' || PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        // If user is already logged in and tries to visit login/register, verify token first
        const token = request.cookies.get('access_token')?.value;
        if (token && (pathname === '/login' || pathname === '/register')) {
            // VERIFY token before redirecting. Simply checking existence causes loops if token is invalid/expired.
            const payload = await verifyJWT(token);
            if (payload) {
                return NextResponse.redirect(new URL('/overview', request.url));
            }
            // If token is invalid, let them stay on /login (and theoretically we could clear cookie here, but next() is enough)
        }
        return NextResponse.next();
    }

    // 2. Protect /app routes (or any route not public)
    // Assuming everything not public is protected given the structure
    // But specifically we want to protect /overview, /timeline, /actions, /goals, /content, /settings
    // And /api routes except auth

    // Check for Access Token
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // NOTE: In a real "memory-only" access token architecture, middleware might not see it if it's in headers.
    // But we implemented it as HttpOnly cookie in `auth-utils.ts` for this reason - Middleware support.

    if (!accessToken) {
        // If we have a refresh token, let the client handle the refresh
        if (refreshToken) {
            return NextResponse.next();
        }

        // If it's an API call, return 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Otherwise redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Verify token and check role for Admin routes
    // console.log('[Middleware] Verifying token for:', pathname);
    const payload = await verifyJWT(accessToken);
    // console.log('[Middleware] Token verified, payload:', payload ? 'valid' : 'invalid');

    if (!payload) {
        // If access token is invalid but we have a refresh token, let the client handle it
        if (refreshToken) {
            return NextResponse.next();
        }

        // Invalid Token
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Admin Guard
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const role = payload.role as string | undefined;
        if (role !== 'admin') {
            // If it's an API call, return 403
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            // Otherwise redirect to dashboard with error or 404/403 page
            // For now, redirect to overview
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
