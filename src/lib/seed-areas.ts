import { db } from '@/db';
import { lifeAreas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
// Initial data for new users
import { LifeArea } from "@/types";

export const DEFAULT_AREAS: Omit<LifeArea, 'userId' | 'createdAt' | 'updatedAt'>[] = [
    {
        id: 'area-1',
        title: 'Здоровʼя',
        description: 'Фізичне та ментальне здоровʼя',
        color: 'bg-emerald-500',
        icon: 'Activity',
        iconName: 'Activity',
        status: 'stable'
    },
    {
        id: 'area-2',
        title: 'Фінанси',
        description: 'Фінансова безпека та ріст',
        color: 'bg-blue-500',
        icon: 'DollarSign',
        iconName: 'DollarSign',
        status: 'stable'
    },
    {
        id: 'area-3',
        title: 'Карʼєра',
        description: 'Професійний розвиток',
        color: 'bg-purple-500',
        icon: 'Briefcase',
        iconName: 'Briefcase',
        status: 'stable'
    },
    {
        id: 'area-4',
        title: 'Особисте',
        description: 'Особистий розвиток та хобі',
        color: 'bg-orange-500',
        icon: 'User',
        iconName: 'User',
        status: 'stable'
    },
    {
        id: 'area-5',
        title: 'Відносини',
        description: 'Сімʼя, друзі, партнери',
        color: 'bg-rose-500',
        icon: 'Heart',
        iconName: 'Heart',
        status: 'stable'
    },
    {
        id: 'area-6',
        title: 'Навчання',
        description: 'Освіта та навички',
        color: 'bg-yellow-500',
        icon: 'BookOpen',
        iconName: 'BookOpen',
        status: 'stable'
    },
    {
        id: 'area-7',
        title: 'Проекти',
        description: 'Робочі та творчі проекти',
        color: 'bg-indigo-500',
        icon: 'Folder',
        iconName: 'Folder',
        status: 'stable'
    },
    {
        id: 'area-8',
        title: 'Подорожі',
        description: 'Подорожі та відкриття',
        color: 'bg-teal-500',
        icon: 'Globe',
        iconName: 'Globe',
        status: 'stable'
    }
];

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
