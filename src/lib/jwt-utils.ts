import { SignJWT, jwtVerify } from 'jose';

// In production on Vercel, append the deployment commit SHA to the secret.
// This ensures that EVERY new deployment invalidates all existing sessions,
// because the signing key changes and old tokens can no longer be verified.
const baseSecret = process.env.JWT_SECRET || 'dependency-injection-is-cool-but-hard-coded-secrets-are-bad';
const deploymentSalt = process.env.VERCEL_GIT_COMMIT_SHA || '';
const JWT_SECRET = new TextEncoder().encode(baseSecret + deploymentSalt);
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

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
