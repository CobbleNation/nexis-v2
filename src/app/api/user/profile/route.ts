import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiMemories, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const userId = payload.userId as string;
        const body = await req.json();
        
        const { identityString } = body;

        // Insert Core Identity Memory
        await db.insert(aiMemories).values({
            id: uuidv4(),
            userId,
            content: `USER CONTEXT & IDENTITY: ${identityString}`,
            importanceWeight: 1.0, // Critical memory, never forget
            decayFactor: 0.0, // Do not decay
            createdAt: new Date(),
            lastAccessed: new Date(),
        });

        // Update User status
        await db.update(users)
            .set({ onboardingCompleted: true })
            .where(eq(users.id, userId));

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("User Profile Update Error:", e);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
