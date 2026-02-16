import { NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'completed', 'paused']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    progress: z.number().min(0).max(100).optional(),
    deadline: z.string().optional(),
    endDate: z.string().optional(),
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

const UPDATE_RESTRICTED_FIELDS = ['title', 'description', 'type', 'priority'] as const;

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    try {
        const body = await req.json();
        const validData = updateSchema.parse(body);

        // Fetch existing goal to check createdAt
        const [existingGoal] = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, user.userId as string))).limit(1);
        if (!existingGoal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const createdAt = new Date(existingGoal.createdAt || new Date());
        const daysDiff = (new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
        const isOld = daysDiff > 30;

        if (isOld) {
            // Check if restricted fields are being modified
            const hasRestrictedChanges = Object.keys(validData).some(key =>
                UPDATE_RESTRICTED_FIELDS.includes(key as any) && (validData as any)[key] !== (existingGoal as any)[key]
            );

            if (hasRestrictedChanges) {
                return NextResponse.json({
                    error: 'Goal is locked. Cannot modify title, description, or type after 30 days.'
                }, { status: 403 });
            }
        }

        const [updated] = await db.update(goals)
            .set({
                ...validData,
                deadline: validData.deadline ? new Date(validData.deadline) : undefined,
                endDate: validData.endDate ? new Date(validData.endDate) : undefined,
                updatedAt: new Date(),
            })
            .where(and(eq(goals.id, id), eq(goals.userId, user.userId as string)))
            .returning();

        return NextResponse.json(updated);
    } catch (err) {
        console.error("Failed to update goal", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    try {
        // Fetch existing goal to check createdAt
        const [existingGoal] = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.userId, user.userId as string))).limit(1);
        if (!existingGoal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const createdAt = new Date(existingGoal.createdAt || new Date());
        const daysDiff = (new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24);

        if (daysDiff > 30) {
            return NextResponse.json({
                error: 'Goal is locked. Cannot delete goals older than 30 days.'
            }, { status: 403 });
        }

        const deleted = await db.delete(goals)
            .where(and(eq(goals.id, id), eq(goals.userId, user.userId as string)))
            .returning();

        return NextResponse.json({ success: true, id });
    } catch (err) {
        console.error("Failed to delete goal", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
