import { NextResponse } from 'next/server';
import { db } from '@/db';
import { actions } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
    title: z.string().min(1).optional(),
    status: z.string().optional(),
    completed: z.boolean().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    scheduledTime: z.string().optional(),
    areaId: z.string().optional(),
    streak: z.number().optional(),
});

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;
    return await verifyJWT(token);
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    try {
        const body = await req.json();
        const validData = updateSchema.parse(body);

        const [updated] = await db.update(actions)
            .set({
                ...validData,
                updatedAt: new Date(),
            })
            .where(and(eq(actions.id, id), eq(actions.userId, user.userId as string)))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (err) {
        console.error("Failed to update action", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;

    try {
        const deleted = await db.delete(actions)
            .where(and(eq(actions.id, id), eq(actions.userId, user.userId as string)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, id });
    } catch (err) {
        console.error("Failed to delete action", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
