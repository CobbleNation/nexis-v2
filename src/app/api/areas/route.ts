import { NextResponse } from 'next/server';
import { db } from '@/db';
import { lifeAreas } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const areaSchema = z.object({
    title: z.string().min(1),
    color: z.string(),
    icon: z.string().optional(),
    order: z.number().optional()
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

    try {
        const data = await db.select()
            .from(lifeAreas)
            .where(eq(lifeAreas.userId, user.userId as string))
            .orderBy(asc(lifeAreas.order));

        return NextResponse.json(data);
    } catch (err) {
        console.error("Failed to fetch areas", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const validData = areaSchema.parse(body);

        const [newItem] = await db.insert(lifeAreas).values({
            id: uuidv4(),
            userId: user.userId as string,
            title: validData.title,
            color: validData.color,
            icon: validData.icon,
            order: validData.order || 0,
        }).returning();

        return NextResponse.json(newItem);
    } catch (err) {
        console.error("Failed to create area", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: (err as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
