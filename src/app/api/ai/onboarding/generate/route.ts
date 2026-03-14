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
        const { answers, selectedAreaIds } = body;

        // Structured prompt from user answers
        const userPrompt = `
Generate a life management system for this user.
IMPORTANT: You MUST NOT create new Life Areas. You must create Goals (and tasks/habits) and map them directly to these pre-existing Life Area IDs:
Selected Area IDs: ${selectedAreaIds.join(', ')}

User Profile:
- 3-12 Month Goals: ${answers.goals || 'Not specified'}
- 1-5 Year Vision: ${answers.longTermGoals || 'Not specified'}
- Daily Challenges/Obstacles: ${answers.challenges || 'Not specified'}
- Preferred Structure Level: ${answers.structure || 'Balanced'}

Output JSON format:
{
  "goals": [
    {
      "areaId": "<one of the Selected Area IDs exactly as provided>",
      "title": "Goal Title",
      "description": "Short description",
      "tasks": [
        { "title": "Task title (actionable)" }
      ]
    }
  ],
  "habits": [
    { "title": "Habit Title", "frequency": "daily" }
  ]
}
`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are an expert life coach AI. Output ONLY valid JSON matching the requested structure." },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const result = JSON.parse(content);

        // --- Database Population ---
        
        // Get all user's areas to map the requested 'areaId' (which corresponds to iconName in DEFAULT_AREAS) to the real DB UUID
        const userAreas = await db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId));
        
        // Helper to find the real area ID based on the 'iconName' (passed as areaId by frontend)
        const getRealAreaId = (requestedAreaId: string) => {
             const area = userAreas.find(a => a.icon === requestedAreaId);
             return area ? area.id : userAreas[0]?.id; // Fallback to the first available area
        };

        // 1. Create Goals & Tasks mapped to existing areas
        if (result.goals && Array.isArray(result.goals)) {
            for (const goal of result.goals) {
                const validAreaId = selectedAreaIds.includes(goal.areaId) ? goal.areaId : selectedAreaIds[0];
                if (!validAreaId) continue;
                
                const realAreaId = getRealAreaId(validAreaId);
                if (!realAreaId) continue; // Safety check if user has no areas at all
                
                const realGoalId = uuidv4();
                
                await db.insert(goals).values({
                    id: realGoalId,
                    userId,
                    areaId: realAreaId,
                    title: goal.title,
                    description: goal.description || '',
                    type: 'strategic',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // Create Tasks for each Goal
                if (goal.tasks && Array.isArray(goal.tasks)) {
                    for (const task of goal.tasks) {
                        await db.insert(actions).values({
                            id: uuidv4(),
                            userId,
                            areaId: realAreaId,
                            linkedGoalId: realGoalId,
                            title: task.title,
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

        // 2. Create Habits
        if (result.habits && Array.isArray(result.habits)) {
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
        }

        // 3. Mark Onboarding as Completed
        await db.update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, userId));

        // 4. Track Events
        await trackEvent({
            eventName: 'ai_plan_generated',
            userId,
            metadata: { 
                goalsCount: result.goals?.length || 0,
                habitCount: result.habits?.length || 0
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
