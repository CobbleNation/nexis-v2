import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dependency-injection-is-cool-but-hard-coded-secrets-are-bad'); // Helper for dev
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// --- Hashing ---
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12); // Argon2 is better but bcrypt is requested standard fallback
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// --- JWT ---
export async function createAccessToken(payload: { userId: string; role?: string }) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: { userId: string }) {
    // We sign it but mostly rely on the random hash in DB for revocation
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(JWT_SECRET);
}

export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (err) {
        return null; // Invalid or expired
    }
}

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
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/api/auth', // Scoped only to auth endpoints
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
