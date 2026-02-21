import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// --- Hashing ---
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12); // Argon2 is better but bcrypt is requested standard fallback
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// --- JWT ---
import { createAccessToken, createRefreshToken, verifyJWT } from './jwt-utils';
export { createAccessToken, createRefreshToken, verifyJWT };

// --- Cookies ---
export async function setAuthCookies(accessToken: string, refreshToken: string) {
    const cookieStore = await cookies();

    // Access Token - Short lived, accessible to client (optional) or httpOnly. 
    // Request says "memory" OR "cookie". We'll use HttpOnly cookie for simplicity in Nextjs middleware protection
    cookieStore.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 min
        path: '/',
    });

    // Refresh Token - Long lived, HttpOnly, Secure
    cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Strict can cause issues with redirect from external sites, Lax is good balance
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/', // Allow middleware to see it for auto-refresh on protected routes
    });
}

export async function clearAuthCookies() {
    const cookieStore = await cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;
    return verifyJWT(token);
}
