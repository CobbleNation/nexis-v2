import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userLimits } from '@/db/schema';
import { hashPassword, createAccessToken, createRefreshToken, setAuthCookies, createSession } from '@/lib/auth-utils';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
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

        // Generate Verification Token
        const verificationToken = randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 hours

        // Create User
        const hashedPassword = await hashPassword(password);
        const [newUser] = await db.insert(users).values({
            id: uuidv4(),
            name,
            email,
            passwordHash: hashedPassword,
            verificationToken: verificationToken,
            verificationTokenExpiry: tokenExpiry
        }).returning();

        // Send Verification Email
        try {
            await sendVerificationEmail(email, name, verificationToken);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // We continue even if email fails, user can request again or admin can verify
        }

        // Seed Default Life Areas
        await seedLifeAreas(newUser.id).catch(err => {
            console.error("Failed to seed life areas, but continuing registration:", err);
        });

        // Initialize User Limits with defaults
        try {
            await db.insert(userLimits).values({
                id: uuidv4(),
                userId: newUser.id,
                // Defaults will be null/plan-based, but having the record is safer
                updatedAt: new Date()
            });
        } catch (err) {
            console.error("Failed to initialize user limits, but continuing registration:", err);
        }

        // DO NOT log in automatically anymore - require verification
        // await setAuthCookies(accessToken, refreshToken); 

        // Track Registration
        await trackEvent({
            eventName: 'user_registered',
            userId: newUser.id,
            plan: 'free',
            source: 'web'
        });

        return NextResponse.json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (err) {
        console.error("Registration Critical Error:", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: (err as any).errors }, { status: 400 });
        }
        return NextResponse.json({
            error: 'Internal Server Error',
            message: (err as any).message,
            stack: process.env.NODE_ENV === 'development' ? (err as any).stack : undefined
        }, { status: 500 });
    }
}
