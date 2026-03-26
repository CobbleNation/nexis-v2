import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiMemories, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const MEMORY_PREFIX = 'USER CONTEXT & IDENTITY:';

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
                like(aiMemories.content, `${MEMORY_PREFIX}%`)
            )
        });

        if (!existingMemory) {
            return NextResponse.json({ profileData: {} });
        }

        // Parse structured JSON from memory content
        const rawContent = existingMemory.content.replace(`${MEMORY_PREFIX}\n`, '');
        try {
            const profileData = JSON.parse(rawContent);
            return NextResponse.json({ profileData });
        } catch {
            // Legacy: plain text format — return as-is for migration
            return NextResponse.json({ profileData: { _legacy: rawContent } });
        }
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
        const { profileData } = body; // Record<string, string>

        // Serialize to structured JSON
        const finalContent = `${MEMORY_PREFIX}\n${JSON.stringify(profileData, null, 2)}`;

        // Check if memory exists to overwrite it
        const existingMemory = await db.query.aiMemories.findFirst({
            where: (aiMemories, { eq, and, like }) => and(
                eq(aiMemories.userId, userId),
                like(aiMemories.content, `${MEMORY_PREFIX}%`)
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
        console.error("POST Profile Error:", e);
        return NextResponse.json({ error: 'Save failed' }, { status: 500 });
    }
}
