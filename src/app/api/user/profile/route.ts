import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiMemories, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const userId = payload.userId as string;

        const existingMemory = await db.query.aiMemories.findFirst({
            where: (aiMemories, { eq, and, like }) => and(
                eq(aiMemories.userId, userId),
                like(aiMemories.content, 'USER CONTEXT & IDENTITY:%')
            )
        });

        // Strip the prefix to return clean text to the UI
        const identityString = existingMemory 
            ? existingMemory.content.replace('USER CONTEXT & IDENTITY:\n', '') 
            : '';

        return NextResponse.json({ identityString });
    } catch (e) {
        console.error("Fetch Profile Error:", e);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

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
        const finalContent = `USER CONTEXT & IDENTITY:\n${identityString}`;

        // Check if memory exists to overwrite it
        const existingMemory = await db.query.aiMemories.findFirst({
            where: (aiMemories, { eq, and, like }) => and(
                eq(aiMemories.userId, userId),
                like(aiMemories.content, 'USER CONTEXT & IDENTITY:%')
            )
        });

        if (existingMemory) {
            await db.update(aiMemories)
                .set({ content: finalContent })
                .where(eq(aiMemories.id, existingMemory.id));
        } else {
            await db.insert(aiMemories).values({
                id: uuidv4(),
                userId,
                content: finalContent,
                importanceWeight: 1.0,
                decayFactor: 0.0,
            });
        }

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
