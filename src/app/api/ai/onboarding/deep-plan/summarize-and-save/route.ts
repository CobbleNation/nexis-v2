import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, lifeAreas, goals, actions, habits, analyticsEvents, metricDefinitions } from '@/db/schema';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
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
        const { messages, selectedAreaIds } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
             return NextResponse.json({ error: 'No chat history provided' }, { status: 400 });
        }

        // Convert the chat log into a single transcript string
        const transcript = messages.map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n\n');

        const systemPrompt = `You are an expert system architect parsing a completed life coaching conversation into database records.
IMPORTANT RULES:
1. YOU MUST RESPOND ONLY IN UKRAINIAN (УКРАЇНСЬКОЮ МОВОЮ).
2. You MUST NOT create new Life Areas. You must create Goals (and tasks/habits) and map them directly to these pre-existing Life Area IDs:
Selected Area IDs: ${selectedAreaIds.join(', ')}

Conversation Transcript:
"""
${transcript}
"""

TASK:
Analyze the transcript above and extract the concrete goals, tasks, and habits that were discussed and agreed upon. If the user mentioned specific numbers to reach (like weights, money, pages), parse them into the 'metric' object.

Output JSON format:
{
  "goals": [
    {
      "areaId": "<one of the Selected Area IDs exactly as provided>",
      "title": "Goal Title",
      "description": "Short description based on chat context",
      "metric": {
        "name": "What to measure (e.g., Дохід) - ONLY if a specific number was given",
        "unit": "Unit (e.g., $)",
        "target": 1000 // Number
      },
      "tasks": [
        { "title": "Specific actionable task" }
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

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const result = JSON.parse(content);

        // --- Database Population (Same logic as standard onboarding generation) ---
        
        const userAreas = await db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId));
        
        const getRealAreaId = (requestedAreaId: string) => {
             const area = userAreas.find(a => a.icon === requestedAreaId);
             return area ? area.id : userAreas[0]?.id; // Fallback
        };

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
                        frequency: 'weekly'
                    });
                }
                
                await db.insert(goals).values({
                    id: realGoalId,
                    userId,
                    areaId: realAreaId,
                    title: goal.title,
                    description: goal.description || '',
                    type: 'strategic',
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

        await db.update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, userId));

        await trackEvent({
            eventName: 'deep_planning_chat_saved',
            userId,
            metadata: { 
                goalsCount: result.goals?.length || 0,
                habitCount: result.habits?.length || 0,
                messageCount: messages.length
            }
        });

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error('Deep Planning Save Error:', error);
        return NextResponse.json({ error: 'Failed to save deep plan.' }, { status: 500 });
    }
}
