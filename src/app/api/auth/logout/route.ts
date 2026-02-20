import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Using NextResponse directly to ensure headers aren't merged incorrectly
    // by next/headers in Vercel production.
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
