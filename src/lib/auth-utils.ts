import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// --- Hashing ---
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// --- JWT ---
import { createAccessToken, createRefreshToken, verifyJWT } from './jwt-utils';
export { createAccessToken, createRefreshToken, verifyJWT };

// --- Token Hashing (SHA-256 for session lookup) ---
async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Session Management (DB-backed) ---

/** Create a new session record in the DB for the given refresh token */
export async function createSession(userId: string, refreshToken: string) {
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
        id: uuidv4(),
        userId,
        refreshTokenHash: tokenHash,
        expiresAt,
    });
}

/** Validate that a refresh token has a matching, non-expired session in the DB. Returns the session or null. */
export async function validateSession(refreshToken: string) {
    const tokenHash = await hashToken(refreshToken);

    const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.refreshTokenHash, tokenHash))
        .limit(1);

    if (!session) return null;

    // Check expiry
    if (session.expiresAt < new Date()) {
        // Expired — clean it up
        await db.delete(sessions).where(eq(sessions.id, session.id));
        return null;
    }

    return session;
}

/** Revoke (delete) a single session by its refresh token */
export async function revokeSession(refreshToken: string) {
    const tokenHash = await hashToken(refreshToken);
    await db.delete(sessions).where(eq(sessions.refreshTokenHash, tokenHash));
}

/** Revoke all sessions for a user (e.g. password change, account compromise) */
export async function revokeAllUserSessions(userId: string) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
}

// --- Cookies ---
export async function setAuthCookies(accessToken: string, refreshToken: string) {
    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 min
        path: '/',
    });

    cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
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
