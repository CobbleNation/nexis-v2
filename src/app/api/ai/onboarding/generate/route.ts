import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, lifeAreas, goals, actions, habits, analyticsEvents, metricDefinitions, projects } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { trackEvent } from '@/lib/analytics-server';

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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 });
        }

        const body = await req.json();
        const { answers, selectedAreaIds } = body;

        // Structured prompt from user answers
        const areaGoalsText = selectedAreaIds.map((id: string) => `Area ${id}: ${answers.areaGoals?.[id] || 'Not specified'}`).join('\n');

        const userPrompt = `
Generate a highly detailed life management system for this user.
IMPORTANT RULES:
1. YOU MUST RESPOND ONLY IN UKRAINIAN (УКРАЇНСЬКОЮ МОВОЮ). ABSOLUTELY NO ENGLISH.
2. You MUST NOT create new Life Areas. You must create Goals, Projects, and Habits and map them directly to these pre-existing Life Area IDs:
Selected Area IDs: ${selectedAreaIds.join(', ')}

User Profile:
- Specific Goals by Area: 
${areaGoalsText}
- 1-5 Year Vision: ${answers.longTermGoals || 'Not specified'}
- Daily Challenges/Obstacles: ${answers.challenges || 'Not specified'}
- Preferred Structure Level: ${answers.structure || 'Balanced'}

INSTRUCTIONS:
First, ATTEMPT TO GENERATE A COMPLETE SYSTEM using the provided information, even if it is vague. You must auto-generate reasonable goals, metrics, projects, and actionable tasks based on general best practices for the chosen life areas.
Якщо інформація абсолютно відсутня, ти можеш встановити "clarificationNeeded": true, але старайся цього уникати.
ПРАВИЛО УТОЧНЕНЬ: Уточнення мають стосуватися ЛИШЕ відсутніх конкретних параметрів для метрик або цілей (наприклад: "У якій валюті вимірювати дохід?", "Скільки кілограмів ви хочете скинути?"). НЕ запитуй користувача, які кроки чи проекти йому створити — придумай їх самостійно і запропонуй готову систему.
Якщо "clarificationNeeded" is false (ЦЕ МАЄ БУТИ В БІЛЬШОСТІ ВИПАДКІВ, НАВІТЬ ЯКЩО ІНФОРМАЦІЯ ЗАГАЛЬНА), згенеруй ПОВНУ систему ("goals", "projects", "habits"), пропонуючи конкретні, добре сформульовані цілі та метрики автоматично.

Output JSON format:
{
  "clarificationNeeded": boolean,
  "questions": [
    { "areaId": "<Area ID>", "question": "Friendly question WITH 2-3 SUGGESTIONS built-in..." }
  ],
  "goals": [
    {
      "areaId": "<Area ID>",
      "title": "Goal Title",
      "description": "Short description",
      "type": "strategic", // "vision", "strategic", or "tactical"
      "metric": {
        "name": "What to measure (e.g., Дохід) - ONLY if a specific number was given",
        "unit": "Unit (e.g., $)",
        "target": 1000,
        "frequency": "weekly" // "daily", "weekly", or "monthly"
      },
      "tasks": [
        { "title": "Task title (actionable step specifically for this goal)" }
      ]
    }
  ],
  "projects": [
     {
       "areaId": "<Area ID>",
       "title": "Project Title",
       "description": "Description",
       "tasks": [
           { "title": "Task title (actionable step specifically for this project)" }
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
                { role: "system", content: "You are an expert life coach AI. Output ONLY valid JSON matching the requested structure. ALWAYS answer in Ukrainian." },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const result = JSON.parse(content);

        // If AI needs clarification, return early
        if (result.clarificationNeeded) {
            return NextResponse.json({ 
                clarificationNeeded: true, 
                questions: result.questions || [] 
            });
        }

        // --- Database Population ---
        
        // Get all user's areas to map the requested 'areaId' (which corresponds to iconName in DEFAULT_AREAS) to the real DB UUID
        let userAreas = await db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId));
        
        // If the user has no areas yet, initialize the ones they selected
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
        
        // Helper to find the real area ID based on the 'iconName' (passed as areaId by frontend)
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
                        name: goal.metric.name,
                        unit: goal.metric.unit || '',
                        type: 'number',
                        frequency: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(goal.metric.frequency) ? goal.metric.frequency : 'weekly'
                    });
                }
                
                await db.insert(goals).values({
                    id: realGoalId,
                    userId,
                    areaId: realAreaId,
                    title: goal.title,
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
                    title: proj.title,
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

        // 3. Create Habits
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

        // 4. Mark Onboarding as Completed
        await db.update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, userId));

        // 5. Track Events
        await trackEvent({
            eventName: 'ai_plan_generated',
            userId,
            metadata: { 
                goalsCount: result.goals?.length || 0,
                habitCount: result.habits?.length || 0,
                projectCount: result.projects?.length || 0
            }
        });

        await trackEvent({
            eventName: 'ai_plan_accepted',
            userId
        });

        return NextResponse.json({
             clarificationNeeded: false,
             data: result // Returning the full schema for UI render mapping
        });

    } catch (error: any) {
        console.error('AI Onboarding Error:', error);
        return NextResponse.json({ error: 'Failed to generate system. Please try again.' }, { status: 500 });
    }
}
