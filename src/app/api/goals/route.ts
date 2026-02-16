import { NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { trackEvent } from '@/lib/analytics-server';
import { cookies } from 'next/headers';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const goalSchema = z.object({
    title: z.string().min(1),
    areaId: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'completed', 'paused']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    startDate: z.string().optional(),
    deadline: z.string().optional(),
    subGoals: z.array(z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
    })).optional(),
});

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;
    return await verifyJWT(token);
}

export async function GET(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const areaId = searchParams.get('areaId');

    try {
        const filters = [eq(goals.userId, user.userId as string)];
        if (areaId && areaId !== 'all') {
            filters.push(eq(goals.areaId, areaId));
        }

        const data = await db.select()
            .from(goals)
            .where(and(...filters))
            .orderBy(desc(goals.createdAt));

        return NextResponse.json(data);
    } catch (err) {
        console.error("Failed to fetch goals", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const validData = goalSchema.parse(body);

        const [newItem] = await db.insert(goals).values({
            id: uuidv4(),
            userId: user.userId as string,
            title: validData.title,
            areaId: validData.areaId,
            description: validData.description,
            status: validData.status || 'active',
            priority: validData.priority || 'medium',
            progress: 0,
            startDate: validData.startDate ? new Date(validData.startDate) : undefined,
            deadline: validData.deadline ? new Date(validData.deadline) : undefined,
            subGoals: validData.subGoals || [],
        }).returning();

        // Track Goal Creation
        await trackEvent({
            eventName: 'goal_created',
            userId: user.userId as string,
            entityType: 'goal',
            entityId: newItem.id,
            source: 'web'
        });

        return NextResponse.json(newItem);
    } catch (err) {
        console.error("Failed to create goal", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: (err as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
