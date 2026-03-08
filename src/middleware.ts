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

    // 1. PUBLIC PATHS CHECK (MUST BE FIRST)
    // Be very permissive about public paths to avoid 401s on critical auth flows
    const isPublic =
        pathname === '/' ||
        PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (isPublic) {
        return NextResponse.next();
    }

    // 2. DOMAIN REDIRECTS (ONLY FOR NON-PUBLIC PATHS)
    if (hostname === 'admin.zynorvia.com') {
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/admin', request.url));
        }
        if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
            return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
        }
    }

    if (hostname === 'app.zynorvia.com') {
        if (pathname === '/') {
            return NextResponse.rewrite(new URL('/overview', request.url));
        }
    }

    if (hostname === 'zynorvia.com') {
        // Redirect non-public app routes to the app subdomain
        if (!pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
            return NextResponse.redirect(new URL(`https://app.zynorvia.com${pathname}`, request.url));
        }
    }

    // 3. AUTHENTICATION (EVERYTHING ELSE)
    const accessToken = request.cookies.get('access_token')?.value;
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

    if (!isAuthorized) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(
            new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url)
        );
    }

    // 4. ADMIN GUARD
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
