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
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify',
    '/auth/verify',
    '/auth/verified',
    '/api/debug/fix-areas',
    '/pricing',
    '/privacy',
    '/terms',
    '/api/billing/webhook',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') || '';
    const proto = request.headers.get('x-forwarded-proto');

    // 0. ENFORCE HTTPS
    if (proto === 'http') {
        return NextResponse.redirect(new URL(`https://${hostname}${pathname}${request.nextUrl.search}`, request.url));
    }

    // 0.1 IMMEDIATE EXEMPTIONS FOR CRITICAL AUTH FLOWS
    if (pathname === '/api/auth/verify' || pathname === '/api/auth/forgot-password' || pathname === '/api/auth/reset-password') {
        return NextResponse.next();
    }

    // 1. PUBLIC PATHS CHECK (Marketing & Public API)
    const MARKETING_PATHS = ['/', '/pricing', '/privacy', '/terms'];
    const isPublic =
        MARKETING_PATHS.some(path => pathname === path) ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/api/ai') ||
        PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));

    // 2. DOMAIN REDIRECTS
    if (hostname === 'admin.zynorvia.com') {
        if (pathname === '/') {
            return NextResponse.rewrite(new URL(`/admin${request.nextUrl.search}`, request.url));
        }
        if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
            return NextResponse.rewrite(new URL(`/admin${pathname}${request.nextUrl.search}`, request.url));
        }
    } else if (hostname === 'app.zynorvia.com') {
        // App subdomain should not host the landing page
        if (pathname === '/') {
            return NextResponse.redirect(new URL(`https://zynorvia.com/${request.nextUrl.search}`, request.url));
        }
    } else if (hostname === 'zynorvia.com') {
        // Redirect non-marketing app routes to the app subdomain
        const isMarketing = MARKETING_PATHS.includes(pathname);
        if (!isMarketing && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
            return NextResponse.redirect(new URL(`https://app.zynorvia.com${pathname}${request.nextUrl.search}`, request.url));
        }
    }

    // 3. AUTHENTICATION (EVERYTHING ELSE)
    // Support both cookies (web) and Authorization header (mobile)
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const accessToken = bearerToken || request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    let isAuthorized = false;
    let payload: any = null;

    if (accessToken) {
        payload = await verifyJWT(accessToken);
        if (payload) isAuthorized = true;
    }

    if (!isAuthorized && refreshToken) {
        const refreshPayload = await verifyJWT(refreshToken);
        if (refreshPayload) {
            isAuthorized = true;
            payload = refreshPayload;
        }
    }

    if (!isAuthorized && !isPublic) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Unauthorized_v4', path: pathname, isPublic: isPublic },
                { status: 401, headers: { 'X-Middleware-Path': pathname } }
            );
        }
        return NextResponse.redirect(
            new URL(`/login?returnUrl=${encodeURIComponent(pathname + request.nextUrl.search)}`, request.url)
        );
    }

    // 4. ADMIN GUARD
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        const role = payload?.role as string | undefined;
        if (role !== 'admin') {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            return NextResponse.redirect(new URL(`/overview${request.nextUrl.search}`, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/auth/:path*',
        '/api/admin/:path*',
        '/api/users/:path*',
        '/api/ai/:path*',
        '/api/sync/:path*',
        '/admin/:path*',
        '/overview/:path*',
        '/settings/:path*',
        '/goals/:path*',
        '/projects/:path*',
        '/areas/:path*',
        '/auth/:path*',
        '/forgot-password',
        '/reset-password',
    ],
};
