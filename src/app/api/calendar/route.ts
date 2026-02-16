import { NextResponse } from 'next/server';
import { db } from '@/db';
import { calendarEvents } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const eventSchema = z.object({
    title: z.string().min(1),
    start: z.string(), // ISO
    end: z.string(),   // ISO
    allDay: z.boolean().optional(),
    areaId: z.string().optional(),
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
        const filters = [eq(calendarEvents.userId, user.userId as string)];
        if (areaId && areaId !== 'all') {
            filters.push(eq(calendarEvents.areaId, areaId));
        }

        const data = await db.select()
            .from(calendarEvents)
            .where(and(...filters))
            .orderBy(desc(calendarEvents.start));

        return NextResponse.json(data);
    } catch (err) {
        console.error("Failed to fetch events", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const validData = eventSchema.parse(body);

        const [newItem] = await db.insert(calendarEvents).values({
            id: uuidv4(),
            userId: user.userId as string,
            title: validData.title,
            start: new Date(validData.start),
            end: new Date(validData.end),
            allDay: validData.allDay || false,
            areaId: validData.areaId,
        }).returning();

        return NextResponse.json(newItem);
    } catch (err) {
        console.error("Failed to create event", err);
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: (err as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
