import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth-utils';
import { trackEvent } from '@/lib/analytics-server';
import { seedLifeAreas } from '@/lib/seed-areas';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = registerSchema.parse(body);

        // Check availability
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Create User
        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
            id: uuidv4(),
            name,
            email,
            passwordHash: hashedPassword,
        }).returning();

        // Create Tokens
        const accessToken = await createAccessToken({ userId: newUser.id });
        const refreshToken = await createRefreshToken({ userId: newUser.id });

        // TODO: Store Refresh Token Hash in DB (sessions) - Skipping for brevity in MVP but highly recommended

        // Seed Default Life Areas
        await seedLifeAreas(newUser.id);

        await setAuthCookies(accessToken, refreshToken);

        // Track Registration
        await trackEvent({
            eventName: 'user_registered',
            userId: newUser.id,
            plan: 'free',
            source: 'web'
        });

        return NextResponse.json({
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar,
                subscriptionTier: newUser.subscriptionTier,
                onboardingCompleted: newUser.onboardingCompleted,
                cardLast4: newUser.cardLast4,
                cardToken: newUser.cardToken
            }
        });
    } catch (err) {
        console.error("Registration Error:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: (err as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
