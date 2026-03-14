import { db } from '@/db';
import { lifeAreas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_AREAS } from './default-areas';

export async function seedLifeAreas(userId: string) {
    // 1. Check if areas exist
    const existing = await db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId));

    if (existing.length > 0) {
        return existing;
    }

    // 2. Create default areas
    const newAreas = DEFAULT_AREAS.map((area, index) => ({
        id: uuidv4(),
        userId,
        title: area.title,
        color: area.color,
        icon: area.iconName, // Map Internal 'iconName' to DB 'icon' column
        order: index + 1,
        // 'status' is not in schema, so we skip it
    }));

    await db.insert(lifeAreas).values(newAreas);

    return newAreas;
}
