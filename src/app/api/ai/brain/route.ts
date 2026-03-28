import OpenAI from 'openai';
import { db } from '@/db';
import { actions, aiMemories, goals, habits, habitLogs, lifeAreas, userProfiles, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function buildEnrichedSystemPrompt(opts: {
    profile: any;
    memories: string[];
    activeGoals: any[];
    todayTasks: any[];
    userName: string;
}) {
    const { profile, memories, activeGoals, todayTasks, userName } = opts;

    let profileBlock = '(Користувач ще не заповнив розширений профіль)';
    if (profile) {
        const lines = [];
        if (profile.health?.chronotype) lines.push(`  - Хронотип: ${profile.health.chronotype}`);
        if (profile.identity?.current?.length) lines.push(`  - Ідентичність: ${profile.identity.current.join(', ')}`);
        if (profile.focusConstraints?.maxActiveGoals) lines.push(`  - Ліміт цілей: ${profile.focusConstraints.maxActiveGoals}`);
        if (lines.length > 0) profileBlock = lines.join('\n');
    }

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'][new Date().getDay()];

    const goalsBlock = activeGoals.length > 0
        ? activeGoals.map(g => `  - [${g.type || 'goal'}] ${g.title} (ID: ${g.id}, статус: ${g.status})`).join('\n')
        : '  (Немає активних цілей)';

    const tasksBlock = todayTasks.length > 0
        ? todayTasks.map(t => `  - ${t.title} (${t.status})`).join('\n')
        : '  (На сьогодні завдань немає)';

    return `Ти — Nexis AI, персональний Life OS асистент користувача на ім'я ${userName}.
Твоє завдання — допомагати користувачу в управлінні життям, фокусом та енергією.

ПОТОЧНИЙ КОНТЕКСТ КОРИСТУВАЧА (${today}, ${dayOfWeek}):

1. ПРОФІЛЬ:
${profileBlock}

2. ДОВГОТРИВАЛА ПАМ'ЯТЬ:
${memories.length > 0 ? memories.map(m => `  - ${m}`).join('\n') : '  (Пам\'ять порожня)'}

3. АКТИВНІ ЦІЛІ:
${goalsBlock}

4. ЗАВДАННЯ НА СЬОГОДНІ:
${tasksBlock}

ІНСТРУКЦІЇ:
- Спілкуйся українською мовою.
- Будь професійним, але дружнім ("ти").
- Твої відповіді мають бути індивідуальними, базуючись на контексті вище.
- Якщо користувач просить створити ціль або задачу, використовуй відповідні інструменти.
- ПІСЛЯ використання інструменту обов'язково підтвердь дію у текстовій відповіді.`;
}

export async function POST(req: Request) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const cookieStore = await cookies();
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieStore.get('access_token')?.value;

        if (!token) return new Response('Unauthorized', { status: 401 });

        const decoded = await verifyJWT(token);
        if (!decoded || !decoded.userId) return new Response('Unauthorized', { status: 401 });

        const userId = decoded.userId as string;
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) return new Response('Bad Request', { status: 400 });

        // Fetch user context
        const [userResult] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const [
            memoriesResult,
            activeGoals,
            todayTasks,
            profileResult
        ] = await Promise.all([
            db.select().from(aiMemories).where(eq(aiMemories.userId, userId)).orderBy(desc(aiMemories.createdAt)).limit(5),
            db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, 'active'))),
            db.select().from(actions).where(and(eq(actions.userId, userId), eq(actions.type, 'task'), eq(actions.date, new Date().toISOString().split('T')[0]))),
            db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
        ]);

        const systemPrompt = buildEnrichedSystemPrompt({
            profile: profileResult[0],
            memories: memoriesResult.map(m => m.content).filter(Boolean) as string[],
            activeGoals,
            todayTasks,
            userName: userResult?.name || 'User',
        });

        // Use standard OpenAI Streaming instead of Vercel AI SDK to avoid schema bugs
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "create_goal",
                        description: "Creates a new goal in the system.",
                        parameters: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "The title of the goal" },
                                goalType: { type: "string", enum: ["vision", "strategic", "tactical"] },
                                areaId: { type: "string", description: "Life area ID" },
                            },
                            required: ["title", "goalType"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "schedule_task",
                        description: "Schedules a task for specific date.",
                        parameters: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                duration: { type: "number", description: "Duration in minutes" },
                                date: { type: "string", description: "YYYY-MM-DD" },
                            },
                            required: ["title", "duration"]
                        }
                    }
                }
            ],
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                let toolCalls: any[] = [];

                try {
                    for await (const chunk of response) {
                        const delta = chunk.choices[0]?.delta;
                        
                        if (delta?.content) {
                            controller.enqueue(encoder.encode(delta.content));
                        }

                        if (delta?.tool_calls) {
                            for (const toolCall of delta.tool_calls) {
                                if (!toolCalls[toolCall.index]) {
                                    toolCalls[toolCall.index] = { 
                                        index: toolCall.index,
                                        id: toolCall.id,
                                        function: { name: '', arguments: '' } 
                                    };
                                }
                                if (toolCall.id) toolCalls[toolCall.index].id = toolCall.id;
                                if (toolCall.function?.name) toolCalls[toolCall.index].function.name += toolCall.function.name;
                                if (toolCall.function?.arguments) toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
                            }
                        }
                    }

                    // Execute tools if any
                    for (const tc of toolCalls) {
                        if (tc.function.name === 'create_goal') {
                            try {
                                const { title, goalType, areaId } = JSON.parse(tc.function.arguments);
                                const newGoalId = uuidv4();
                                await db.insert(goals).values({
                                    id: newGoalId, userId, title, type: goalType, areaId: areaId || undefined, status: 'active', createdAt: new Date(), updatedAt: new Date(),
                                } as any);
                            } catch (e) {
                                console.error('Tool exec error:', e);
                            }
                        } else if (tc.function.name === 'schedule_task') {
                            try {
                                const { title, duration, date } = JSON.parse(tc.function.arguments);
                                const id = uuidv4();
                                await db.insert(actions).values({
                                    id, userId, title, type: 'task', status: 'pending', duration, date: date || new Date().toISOString().split('T')[0], createdAt: new Date(), updatedAt: new Date(),
                                } as any);
                            } catch (e) {
                                console.error('Tool exec error:', e);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Stream processing error:', e);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

    } catch (error: any) {
        console.error('[AI] Brain Error:', error);
        return new Response(`[AI Error] ${error?.message || 'Error'}`, { status: 500 });
    }
}
