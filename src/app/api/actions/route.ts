import { NextResponse } from 'next/server';
import { db } from '@/db';
import { actions } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { trackEvent } from '@/lib/analytics-server';
import { cookies } from 'next/headers';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const actionSchema = z.object({
    title: z.string().min(1),
    type: z.enum(['task', 'habit']),
    areaId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    scheduledTime: z.string().optional(),
    dueDate: z.string().optional(), // ISO String
    frequency: z.string().optional(),
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
        const filters = [eq(actions.userId, user.userId as string)];
        if (areaId && areaId !== 'all') {
            filters.push(eq(actions.areaId, areaId));
        }

        const data = await db.select()
            .from(actions)
            .where(and(...filters))
            .orderBy(desc(actions.createdAt));

        return NextResponse.json(data);
    } catch (err) {
        console.error("Failed to fetch actions", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const validData = actionSchema.parse(body);

        const [newItem] = await db.insert(actions).values({
            id: uuidv4(),
            userId: user.userId as string,
            title: validData.title,
            type: validData.type,
            areaId: validData.areaId,
            priority: validData.priority || 'medium',
            status: 'pending',
            completed: false,
            scheduledTime: validData.scheduledTime,
            dueDate: validData.dueDate ? new Date(validData.dueDate) : undefined,
            frequency: validData.frequency,
        }).returning();

        // Track Action Creation
        await trackEvent({
            eventName: validData.type === 'task' ? 'task_created' : 'habit_created',
            userId: user.userId as string,
            entityType: validData.type,
            entityId: newItem.id,
            source: 'web'
        });

        return NextResponse.json(newItem);
    } catch (err) {
        console.error("Failed to create action", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: (err as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
