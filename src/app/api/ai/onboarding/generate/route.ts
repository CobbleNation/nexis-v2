import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, lifeAreas, goals, actions, habits, analyticsEvents } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { AI_ONBOARDING_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { OnboardingResponse } from '@/lib/ai/types';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { trackEvent } from '@/lib/analytics-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const userId = payload.userId as string;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 });
        }

        const body = await req.json();
        const { answers } = body;

        // Structured prompt from user answers
        const userPrompt = `
Generate a life management system for a user with these answers:
1. Important Areas: ${answers.areas}
2. Goals: ${answers.goals}
3. Challenges: ${answers.challenges}
4. Structure Level: ${answers.structure || 'Balanced'}
`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: AI_ONBOARDING_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const result: OnboardingResponse = JSON.parse(content);

        // --- Database Population ---
        // We do this in a single transaction-like sequence (though SQLite via Turso doesn't have multi-statement transactions the same way here easily, we'll just run them)
        
        const areaIdsMap = new Map<string, string>(); // AI Temp ID -> Real UUID

        // 1. Create Areas
        for (const area of result.areas) {
            const realAreaId = uuidv4();
            areaIdsMap.set(area.id, realAreaId);
            
            await db.insert(lifeAreas).values({
                id: realAreaId,
                userId,
                title: area.title,
                color: area.color || '#4F46E5',
                icon: area.icon || 'Layout',
                order: 0
            });

            // 2. Create Goals inside Area
            for (const goal of area.goals) {
                const realGoalId = uuidv4();
                
                await db.insert(goals).values({
                    id: realGoalId,
                    userId,
                    areaId: realAreaId,
                    title: goal.title,
                    description: goal.description,
                    type: goal.type || 'strategic',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // 3. Create Tasks for each Goal
                for (const task of goal.tasks) {
                    await db.insert(actions).values({
                        id: uuidv4(),
                        userId,
                        areaId: realAreaId,
                        linkedGoalId: realGoalId,
                        title: task.title,
                        type: 'task',
                        status: 'pending',
                        priority: task.priority || 'medium',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
        }

        // 4. Create Habits
        for (const habit of result.habits) {
            await db.insert(habits).values({
                id: uuidv4(),
                userId,
                title: habit.title,
                frequency: habit.frequency || 'daily',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // 5. Mark Onboarding as Completed
        await db.update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, userId));

        // 6. Track Events
        await trackEvent({
            eventName: 'ai_plan_generated',
            userId,
            metadata: { 
                areaCount: result.areas.length,
                habitCount: result.habits.length
            }
        });

        await trackEvent({
            eventName: 'ai_plan_accepted',
            userId
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('AI Onboarding Error:', error);
        return NextResponse.json({ error: 'Failed to generate system. Please try again.' }, { status: 500 });
    }
}
