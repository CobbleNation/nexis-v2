import { SignJWT, jwtVerify } from 'jose';

// Stable secret — sessions persist across deployments.
// To force-logout all users, rotate the JWT_SECRET env var.
const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dependency-injection-is-cool-but-hard-coded-secrets-are-bad'
);
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days

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
