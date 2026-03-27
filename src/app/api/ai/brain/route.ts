import { openai } from '@ai-sdk/openai';
import { streamText, jsonSchema } from 'ai';
import { db } from '@/db';
import { actions, aiMemories, goals, habits, habitLogs, lifeAreas, userProfiles, users } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { PROFILE_FIELDS } from '@/lib/ai/profileFields';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MEMORY_PREFIX = 'USER CONTEXT & IDENTITY:';

function getTokenFromRequest(req: Request, cookieStore: any): string | undefined {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    return cookieStore.get('access_token')?.value;
}

// Build a rich, structured system prompt from ALL available user data
function buildEnrichedSystemPrompt(opts: {
    profileData: Record<string, string>;
    memories: string[];
    activeGoals: any[];
    todayTasks: any[];
    allTasks: any[];
    activeHabits: any[];
    recentHabitLogs: any[];
    lifeAreas: any[];
    userName: string;
}) {
    const { profileData, memories, activeGoals, todayTasks, allTasks, activeHabits, recentHabitLogs, lifeAreas: areas, userName } = opts;

    const profileLines = PROFILE_FIELDS
        .filter(f => profileData[f.key])
        .map(f => `  - ${f.label}: ${profileData[f.key]}`);

    const profileBlock = profileLines.length > 0
        ? profileLines.join('\n')
        : '  (Користувач ще не заповнив профіль)';

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'][new Date().getDay()];

    const goalsBlock = activeGoals.length > 0
        ? activeGoals.map(g => `  - [${g.type || 'goal'}] ${g.title} (статус: ${g.status})`).join('\n')
        : '  (Немає активних цілей)';

    const todayTasksBlock = todayTasks.length > 0
        ? todayTasks.map(t => `  - [${t.status}] ${t.title}${t.duration ? ` (~${t.duration}хв)` : ''}`).join('\n')
        : '  (На сьогодні завдань немає)';

    const habitsBlock = activeHabits.length > 0
        ? activeHabits.map(h => `  - ${h.title} (частота: ${h.frequency})`).join('\n')
        : '  (Немає активних звичок)';

    return `Ти — Nexis AI, персональний асистент користувача на ім'я ${userName}.
Твоє завдання — допомагати користувачу досягати цілей, планувати день та аналізувати продуктивність.

ПОТОЧНИЙ КОНТЕКСТ КОРИСТУВАЧА (${today}, ${dayOfWeek}):

1. ПРОФІЛЬ ТА ФІЗИЧНІ ДАНІ:
${profileBlock}

2. ДОВГОТРИВАЛА ПАМ'ЯТЬ (важливі факти):
${memories.length > 0 ? memories.map(m => `  - ${m}`).join('\n') : '  (Пам\'ять порожня)'}

3. ПОТОЧНІ ЦІЛІ:
${goalsBlock}

4. ЗАВДАННЯ НА СЬОГОДНІ:
${todayTasksBlock}

5. ЗВИЧКИ:
${habitsBlock}

ІНСТРУКЦІЇ:
- Спілкуйся українською мовою.
- Будь лаконічним, але змістовним.
- Використовуй наданий контекст, щоб відповіді були максимально персоналізованими.
- Якщо користувач повідомляє щось важливе, використовуй інструмент 'log_memory'.
- Допомагай створювати цілі ('create_goal') або планувати завдання ('schedule_task') за потреби.
- Якщо користувач питає "Як мене звати?", відповідай "${userName}".`;
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = getTokenFromRequest(req, cookieStore);

        if (!token) return new Response('Unauthorized', { status: 401 });

        const decoded = await verifyJWT(token);
        if (!decoded || !decoded.userId) return new Response('Unauthorized', { status: 401 });

        const userId = decoded.userId;
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) return new Response('Bad Request', { status: 400 });

        // ── Fetch Context Data ──
        const [userResult] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const [
            memoriesResult,
            activeGoals,
            todayTasks,
            allActionsResult,
            activeHabitsResult,
            recentHabitLogsResult,
            areasResult,
            allProfiles
        ] = await Promise.all([
            db.select().from(aiMemories).where(eq(aiMemories.userId, userId)).orderBy(desc(aiMemories.createdAt)).limit(10),
            db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, 'active'))),
            db.select().from(actions).where(and(eq(actions.userId, userId), eq(actions.type, 'task'), eq(actions.date, new Date().toISOString().split('T')[0]))),
            db.select().from(actions).where(eq(actions.userId, userId)).orderBy(desc(actions.createdAt)).limit(5),
            db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.status, 'active'))),
            db.select().from(habitLogs).where(eq(habitLogs.userId, userId)).orderBy(desc(habitLogs.completedAt)).limit(10),
            db.select().from(lifeAreas).where(eq(lifeAreas.userId, userId)),
            db.select().from(userProfiles).where(eq(userProfiles.userId, userId))
        ]);

        const profileData: Record<string, string> = {};
        allProfiles.forEach(p => { if (p.fieldKey) profileData[p.fieldKey] = p.fieldValue || ''; });

        const systemPrompt = buildEnrichedSystemPrompt({
            profileData,
            memories: memoriesResult.map(m => m.content).filter(Boolean) as string[],
            activeGoals,
            todayTasks,
            allTasks: allActionsResult as any[],
            activeHabits: activeHabitsResult as any[],
            recentHabitLogs: recentHabitLogsResult as any[],
            lifeAreas: areasResult as any[],
            userName: userResult?.name || 'User',
        });

        // ── Invoke the AI with jsonSchema wrapper ──
        const result = streamText({
            model: openai('gpt-4o'),
            system: systemPrompt,
            messages,
            tools: {
                create_goal: {
                    description: 'Creates a new goal or project for the user.',
                    parameters: jsonSchema({
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            goalType: { type: 'string', enum: ['vision', 'strategic', 'tactical'] },
                            areaId: { type: 'string' },
                            reason: { type: 'string' },
                        },
                        required: ['title', 'goalType', 'areaId', 'reason'],
                    }),
                    execute: async ({ title, goalType, areaId, reason }: any) => {
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
                        });
                        return { success: true, goalId: newGoalId };
                    },
                },
                schedule_task: {
                    description: 'Schedules a new task for today or a specific date.',
                    parameters: jsonSchema({
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            duration: { type: 'number' },
                            date: { type: 'string', description: 'YYYY-MM-DD' },
                        },
                        required: ['title', 'duration', 'date'],
                    }),
                    execute: async ({ title, duration, date }: any) => {
                        const id = uuidv4();
                        await db.insert(actions).values({
                            id, userId, title, type: 'task', status: 'pending', duration, date: date || new Date().toISOString().split('T')[0], createdAt: new Date(), updatedAt: new Date(),
                        });
                        return { success: true, actionId: id };
                    },
                },
                log_memory: {
                    description: 'Saves important facts about the user.',
                    parameters: jsonSchema({
                        type: 'object',
                        properties: {
                            fact: { type: 'string' },
                            importance: { type: 'number' },
                        },
                        required: ['fact', 'importance'],
                    }),
                    execute: async ({ fact, importance }: any) => {
                        await db.insert(aiMemories).values({
                            id: uuidv4(),
                            userId,
                            content: fact,
                            importanceWeight: importance,
                            createdAt: new Date(),
                            lastAccessed: new Date(),
                        });
                        return { success: true };
                    },
                },
            },
        });

        return result.toTextStreamResponse({
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            }
        });

    } catch (error: any) {
        console.error('[AI] Brain Error:', error);
        return new Response(`[AI Error] ${error?.message || 'Internal Server Error'}`, { status: 200 });
    }
}
