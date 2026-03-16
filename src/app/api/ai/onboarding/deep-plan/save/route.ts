import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, lifeAreas, goals, actions, habits, metricDefinitions, projects } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { DEFAULT_AREAS } from '@/lib/default-areas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const userId = payload.userId as string;

        const body = await req.json();
        const { plan, selectedAreaIds } = body;

        if (!plan || !selectedAreaIds) {
             return NextResponse.json({ error: 'Missing plan or area IDs' }, { status: 400 });
        }

        const result = plan;

        // --- Database Population ---
        let userAreas = await db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId));

        if (userAreas.length === 0 && selectedAreaIds && selectedAreaIds.length > 0) {
            const areasToInsert = DEFAULT_AREAS
                .filter(a => selectedAreaIds.includes(a.iconName))
                .map((a, index) => ({
                    id: uuidv4(),
                    userId,
                    title: a.title,
                    color: a.color,
                    icon: a.iconName,
                    order: index
                }));
            
            if (areasToInsert.length > 0) {
                await db.insert(lifeAreas).values(areasToInsert);
                userAreas = await db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId)); // Refresh
            }
        }
        
        const getRealAreaId = (requestedAreaId: string) => {
             const area = userAreas.find(a => a.icon === requestedAreaId);
             return area ? area.id : userAreas[0]?.id; // Fallback
        };

        // 1. Create Goals & Linked Tasks
        if (result.goals && Array.isArray(result.goals)) {
            for (const goal of result.goals) {
                const validAreaId = selectedAreaIds.includes(goal.areaId) ? goal.areaId : selectedAreaIds[0];
                if (!validAreaId) continue;
                
                const realAreaId = getRealAreaId(validAreaId);
                if (!realAreaId) continue;
                
                const realGoalId = uuidv4();
                let targetMetricId: string | undefined = undefined;
                let metricTargetValue: number | undefined = undefined;

                if (goal.metric && goal.metric.name && goal.metric.target != null) {
                    targetMetricId = uuidv4();
                    metricTargetValue = Number(goal.metric.target);
                    
                    await db.insert(metricDefinitions).values({
                        id: targetMetricId,
                        userId,
                        areaId: realAreaId,
                        name: goal.metric.name || 'Метрика',
                        unit: goal.metric.unit || '',
                        type: 'number',
                        frequency: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(goal.metric.frequency) ? goal.metric.frequency : 'weekly'
                    });
                }
                
                await db.insert(goals).values({
                    id: realGoalId,
                    userId,
                    areaId: realAreaId,
                    title: goal.title || 'Нова ціль',
                    description: goal.description || '',
                    type: ['vision', 'strategic', 'tactical'].includes(goal.type) ? goal.type : 'strategic',
                    status: 'active',
                    targetMetricId: targetMetricId || null,
                    metricTargetValue: metricTargetValue || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                if (goal.tasks && Array.isArray(goal.tasks)) {
                    for (const task of goal.tasks) {
                        await db.insert(actions).values({
                            id: uuidv4(),
                            userId,
                            areaId: realAreaId,
                            linkedGoalId: realGoalId,
                            title: task.title || 'Нова задача',
                            type: 'task',
                            status: 'pending',
                            priority: 'medium',
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
            }
        }

        // 2. Create Projects & Linked Tasks
        if (result.projects && Array.isArray(result.projects)) {
             for (const proj of result.projects) {
                const validAreaId = selectedAreaIds.includes(proj.areaId) ? proj.areaId : selectedAreaIds[0];
                const realAreaId = getRealAreaId(validAreaId);
                if (!realAreaId) continue; 

                const realProjectId = uuidv4();

                await db.insert(projects).values({
                    id: realProjectId,
                    userId,
                    areaId: realAreaId,
                    title: proj.title || 'Новий проєкт',
                    description: proj.description || '',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                if (proj.tasks && Array.isArray(proj.tasks)) {
                    for (const task of proj.tasks) {
                        await db.insert(actions).values({
                            id: uuidv4(),
                            userId,
                            areaId: realAreaId,
                            projectId: realProjectId,
                            title: task.title || 'Нова задача',
                            type: 'task',
                            status: 'pending',
                            priority: 'medium',
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
             }
        }

        // 3. Create Habits
        if (result.habits && Array.isArray(result.habits)) {
            for (const habit of result.habits) {
                await db.insert(habits).values({
                    id: uuidv4(),
                    userId,
                    title: habit.title || 'Нова звичка',
                    frequency: habit.frequency || 'daily',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        await db.update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, userId));

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Failed to save deep plan:", e);
        try {
            const fs = require('fs');
            fs.appendFileSync('/tmp/nexis-deep-plan-save-error.log', new Date().toISOString() + ': ' + e.message + '\n' + e.stack + '\n\n');
        } catch (err) {}
        return NextResponse.json({ error: 'Save failed' }, { status: 500 });
    }
}
