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
        const { messages, selectedAreaIds } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
             return NextResponse.json({ error: 'No chat history provided' }, { status: 400 });
        }

        // Convert the chat log into a single transcript string
        const transcript = messages.map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n\n');

        const systemPrompt = `You are an expert system architect parsing a completed deep life coaching conversation into database records.
IMPORTANT RULES:
1. YOU MUST RESPOND ONLY IN UKRAINIAN (УКРАЇНСЬКОЮ МОВОЮ).
2. You MUST NOT create new Life Areas. You must create Goals, Projects, Tasks, Metrics, and Habits and map them directly to these pre-existing Life Area IDs:
Selected Area IDs: ${selectedAreaIds.join(', ')}

Conversation Transcript:
"""
${transcript}
"""

TASK:
Analyze the transcript above and extract absolutely EVERY concrete Goal, Project, Task, Metric, and Habit that was discussed and agreed upon. This is a Deep Planning session, meaning the breakdown must be exhaustive.

Output JSON format:
{
  "goals": [
    {
      "areaId": "<Area ID>",
      "title": "Goal Title",
      "description": "Short description based on chat context",
      "type": "strategic", // "vision", "strategic", or "tactical"
      "metric": {
        "name": "What to measure (e.g., Дохід) - ONLY if a specific number was given",
        "unit": "Unit (e.g., $)",
        "target": 1000,
        "frequency": "weekly" // "daily", "weekly", or "monthly"
      },
      "tasks": [
        { "title": "Specific actionable task for this goal" }
      ]
    }
  ],
  "projects": [
     {
       "areaId": "<Area ID>",
       "title": "Project Title",
       "description": "Description",
       "tasks": [
           { "title": "Actionable task for this project" }
       ]
     }
  ],
  "habits": [
    { "title": "Habit Title", "frequency": "daily" }
  ]
}`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are an expert data parser. Output ONLY valid JSON matching the requested structure. ALWAYS answer in Ukrainian." },
                { role: "user", content: systemPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2, // Low temp for reliable formatting
        });

        let content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const result = JSON.parse(content);

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

        await trackEvent({
            eventName: 'deep_planning_chat_saved',
            userId,
            metadata: { 
                goalsCount: result.goals?.length || 0,
                habitCount: result.habits?.length || 0,
                projectCount: result.projects?.length || 0,
                messageCount: messages.length
            }
        });

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error('Deep Planning Save Error:', error);
        return NextResponse.json({ error: 'Failed to save deep plan.' }, { status: 500 });
    }
}
