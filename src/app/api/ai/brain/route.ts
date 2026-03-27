import { openai } from '@ai-sdk/openai';
import { streamText, jsonSchema } from 'ai';
import { db } from '@/db';
import { actions, aiMemories, goals, habits, habitLogs, lifeAreas, userProfiles, users } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Build a rich, structured system prompt from ALL available user data
function buildEnrichedSystemPrompt(opts: {
    profile: any;
    memories: string[];
    activeGoals: any[];
    todayTasks: any[];
    allTasks: any[];
    activeHabits: any[];
    recentHabitLogs: any[];
    lifeAreas: any[];
    userName: string;
}) {
    const { profile, memories, activeGoals, todayTasks, allTasks, activeHabits, recentHabitLogs, lifeAreas: areas, userName } = opts;

    // Process structured profile into text
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
        ? activeGoals.map(g => `  - [${g.type || 'goal'}] ${g.title} (статус: ${g.status})`).join('\n')
        : '  (Немає активних цілей)';

    return `Ти — Nexis AI, персональний асистент користувача на ім'я ${userName}.
Твоє завдання — допомагати користувачу досягати цілей та планувати день.

ПОТОЧНИЙ КОНТЕКСТ КОРИСТУВАЧА (${today}, ${dayOfWeek}):

1. ПРОФІЛЬ:
${profileBlock}

2. ДОВГОТРИВАЛА ПАМ'ЯТЬ:
${memories.length > 0 ? memories.map(m => `  - ${m}`).join('\n') : '  (Пам\'ять порожня)'}

3. ЦІЛІ:
${goalsBlock}

ІНСТРУКЦІЇ:
- Спілкуйся українською мовою.
- Будь лаконічним.
- Допомагай створювати цілі ('create_goal') або планувати завдання ('schedule_task') за потреби.`;
}

export async function POST(req: Request) {
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

        // ── Fetch Data ──
        const [userResult] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const [
            memoriesResult,
            activeGoals,
            todayTasks,
            activeHabitsResult,
            recentHabitLogsResult,
            areasResult,
            profileResult
        ] = await Promise.all([
            db.select().from(aiMemories).where(eq(aiMemories.userId, userId)).orderBy(desc(aiMemories.createdAt)).limit(5),
            db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, 'active'))),
            db.select().from(actions).where(and(eq(actions.userId, userId), eq(actions.type, 'task'), eq(actions.date, new Date().toISOString().split('T')[0]))),
            db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.status, 'active'))),
            db.select().from(habitLogs).where(eq(habitLogs.userId, userId)).orderBy(desc(habitLogs.id)).limit(10), // Use ID if completedAt missing
            db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId)),
            db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
        ]);

        const systemPrompt = buildEnrichedSystemPrompt({
            profile: profileResult[0],
            memories: memoriesResult.map(m => m.content).filter(Boolean) as string[],
            activeGoals,
            todayTasks,
            allTasks: [],
            activeHabits: activeHabitsResult as any[],
            recentHabitLogs: recentHabitLogsResult as any[],
            lifeAreas: areasResult as any[],
            userName: userResult?.name || 'User',
        });

        // ── Invoke AI ──
        const result = streamText({
            model: openai('gpt-4o'),
            system: systemPrompt,
            messages,
            tools: {
                create_goal: {
                    description: 'Creates a new goal.',
                    parameters: jsonSchema({
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            goalType: { type: 'string', enum: ['vision', 'strategic', 'tactical'] },
                            areaId: { type: 'string' },
                        },
                        required: ['title', 'goalType'],
                    }),
                    execute: async ({ title, goalType, areaId }: any) => {
                        const newGoalId = uuidv4();
                        await db.insert(goals).values({
                            id: newGoalId,
                            userId,
                            title,
                            type: goalType as any,
                            areaId: areaId || undefined,
                            status: 'active',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        } as any);
                        return { success: true, goalId: newGoalId };
                    },
                },
                schedule_task: {
                    description: 'Schedules a task.',
                    parameters: jsonSchema({
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            duration: { type: 'number' },
                            date: { type: 'string' },
                        },
                        required: ['title', 'duration'],
                    }),
                    execute: async ({ title, duration, date }: any) => {
                        const id = uuidv4();
                        await db.insert(actions).values({
                            id, userId, title, type: 'task', status: 'pending', duration, date: date || new Date().toISOString().split('T')[0], createdAt: new Date(), updatedAt: new Date(),
                        } as any);
                        return { success: true, actionId: id };
                    },
                },
            },
        });

        return result.toTextStreamResponse({
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });

    } catch (error: any) {
        console.error('[AI] Brain Error:', error);
        return new Response(`[AI Error] ${error?.message || 'Error'}`, { status: 200 });
    }
}
