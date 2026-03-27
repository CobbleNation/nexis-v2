import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { actions, aiMemories, goals, habits, habitLogs, lifeAreas, userProfiles } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { PROFILE_FIELDS } from '@/lib/ai/profileFields';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    // Structured profile fields into readable text
    const profileLines = PROFILE_FIELDS
        .filter(f => profileData[f.key])
        .map(f => `  - ${f.label}: ${profileData[f.key]}`);

    const profileBlock = profileLines.length > 0
        ? profileLines.join('\n')
        : '  (Користувач ще не заповнив профіль)';

    // Communication style preference
    const commStyle = profileData.communicationStyle || 'Дружньо та мотивуюче';
    
    // Today's date
    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'][new Date().getDay()];

    // Goals summary
    const goalsBlock = activeGoals.length > 0
        ? activeGoals.map(g => `  - [${g.type || 'goal'}] ${g.title} (статус: ${g.status})`).join('\n')
        : '  (Немає активних цілей)';

    // Today's tasks summary
    const todayTasksBlock = todayTasks.length > 0
        ? todayTasks.map(t => `  - [${t.status}] ${t.title}${t.duration ? ` (~${t.duration}хв)` : ''}`).join('\n')
        : '  (Немає задач на сьогодні)';

    // Total task stats
    const pendingCount = allTasks.filter(t => t.status === 'pending').length;
    const completedToday = todayTasks.filter(t => t.status === 'completed').length;
    const totalToday = todayTasks.length;

    // Active habits summary
    const habitsBlock = activeHabits.length > 0
        ? activeHabits.map(h => {
            const todayLog = recentHabitLogs.find(l => l.habitId === h.id && l.date === today);
            return `  - ${h.title} (серія: ${h.streak || 0} днів) ${todayLog?.completed ? '✅' : '⬜'}`;
        }).join('\n')
        : '  (Немає активних звичок)';

    // Life areas
    const areasBlock = areas.length > 0
        ? areas.map(a => `  - ${a.name}: пріоритет ${a.priority || 'нормальний'}`).join('\n')
        : '  (Не визначені)';

    // Memories
    const memoriesBlock = memories.length > 0
        ? memories.map(m => `  - ${m}`).join('\n')
        : '  (Порожньо)';

    const prompt = `You are Nexis, персональна AI Life Operating System для ${userName || 'користувача'}.
Ти — НЕ звичайний чат-бот. Ти — стратегічний рушій рішень, який максимізує реальні результати в житті користувача, захищаючи від вигорання.

# ДАТА ТА ЧАС
- Сьогодні: ${today} (${dayOfWeek})
- Часовий пояс: Київ (UTC+2/+3)

# ПРОФІЛЬ КОРИСТУВАЧА (заповнені дані)
${profileBlock}

# СТИЛЬ СПІЛКУВАННЯ
Спілкуйся з користувачем: ${commStyle}

# АКТИВНІ ЦІЛІ (${activeGoals.length})
${goalsBlock}

# ЗАДАЧІ НА СЬОГОДНІ (${completedToday}/${totalToday} виконано)
${todayTasksBlock}

# ЗАГАЛЬНА СТАТИСТИКА ЗАДАЧ
- Всього незавершених: ${pendingCount}

# АКТИВНІ ЗВИЧКИ
${habitsBlock}

# СФЕРИ ЖИТТЯ
${areasBlock}

# ПАМ'ЯТЬ ТА ФАКТИ ПРО КОРИСТУВАЧА
${memoriesBlock}

# ТВОЇ ОСНОВНІ ДИРЕКТИВИ:
1. OUTCOME ENGINE: Безжалісно прибирай малоефективну роботу. Якщо задача тривіальна — постав під сумнів. Якщо задач забагато — запропонуй видалити найменш важливі.
2. FOCUS LIMITER: Суворо дотримуйся лімітів фокусу користувача. Не дозволяй перевантаження.
3. FRICTION REDUCTION: Якщо відчуваєш, що користувач вигорає — спрости його задачі, перенеси на завтра.
4. ПЕРСОНАЛІЗАЦІЯ: Використовуй ВСЮ інформацію з профілю для індивідуальних рекомендацій. Враховуй вагу, графік сну, робочий графік, рівень стресу.
5. НІЯКОГО GENERIC: Ніколи не давай загальні поради. Все — конкретно під цього користувача.
6. МОВА: Спілкуйся переважно українською, якщо користувач пише українською.

# ПРАВИЛА ДЛЯ ІНСТРУМЕНТІВ
Використовуй свої інструменти для виконання дій. Якщо Focus Limiter відхиляє — НЕ створюй, а попередь користувача.
Перед використанням інструменту — поясни свою логіку.`;

    return prompt;
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = getTokenFromRequest(req, cookieStore);

        if (!token) return new Response('Unauthorized', { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return new Response('Invalid Token', { status: 401 });

        const userId = payload.userId as string;

        // Extract messages from client
        const { messages } = await req.json();

        const today = new Date().toISOString().split('T')[0];

        // ── Fetch ALL context in parallel ──
        const [
            profileMemoryResult,
            otherMemoriesResult,
            activeGoalsResult,
            allActionsResult,
            activeHabitsResult,
            recentHabitLogsResult,
            areasResult,
            userResult,
        ] = await Promise.all([
            // 1. User profile data (structured JSON in aiMemories)
            db.query.aiMemories.findFirst({
                where: (aiMemories, { eq: eq2, and: and2, like }) => and2(
                    eq2(aiMemories.userId, userId),
                    like(aiMemories.content, `${MEMORY_PREFIX}%`)
                )
            }).catch(() => null),
            // 2. Other AI memories (not profile)
            db.select().from(aiMemories)
                .where(eq(aiMemories.userId, userId))
                .orderBy(desc(aiMemories.createdAt))
                .limit(20)
                .catch(() => []),
            // 3. Active goals
            db.select().from(goals)
                .where(eq(goals.userId, userId))
                .catch(() => []),
            // 4. All tasks/actions
            db.select().from(actions)
                .where(eq(actions.userId, userId))
                .orderBy(desc(actions.createdAt))
                .limit(50)
                .catch(() => []),
            // 5. Active habits
            db.select().from(habits)
                .where(and(eq(habits.userId, userId), eq(habits.status, 'active')))
                .catch(() => []),
            // 6. Recent habit logs (last 7 days)
            db.select().from(habitLogs)
                .where(eq(habitLogs.userId, userId))
                .orderBy(desc(habitLogs.date))
                .limit(50)
                .catch(() => []),
            // 7. Life areas
            db.select().from(lifeAreas)
                .where(eq(lifeAreas.userId, userId))
                .catch(() => []),
            // 8. User name
            db.query.users.findFirst({
                where: (users, { eq: eq2 }) => eq2(users.id, userId),
                columns: { name: true }
            }).catch(() => null),
        ]);

        // Parse structured profile from memory
        let profileData: Record<string, string> = {};
        if (profileMemoryResult) {
            const rawContent = profileMemoryResult.content.replace(`${MEMORY_PREFIX}\n`, '');
            try { profileData = JSON.parse(rawContent); } catch {}
        }

        // Filter memories (exclude profile entry)
        const memoryStrings = (otherMemoriesResult as any[])
            .filter(m => !m.content?.startsWith(MEMORY_PREFIX))
            .map(m => m.content)
            .slice(0, 10);

        // Filter today's tasks
        const todayTasks = (allActionsResult as any[]).filter(a => a.date === today);
        const activeGoals = (activeGoalsResult as any[]).filter(g => g.status === 'active');

        // Build system prompt
        const systemPrompt = buildEnrichedSystemPrompt({
            profileData,
            memories: memoryStrings,
            activeGoals,
            todayTasks,
            allTasks: allActionsResult as any[],
            activeHabits: activeHabitsResult as any[],
            recentHabitLogs: recentHabitLogsResult as any[],
            lifeAreas: areasResult as any[],
            userName: (userResult as any)?.name || '',
        });

        // ── Log the context for admin debug ──
        try {
            await db.insert(aiMemories).values({
                id: uuidv4(),
                userId,
                content: `AI_DEBUG_LOG:${today}:${new Date().toISOString()}\n${JSON.stringify({
                    timestamp: new Date().toISOString(),
                    userMessage: messages?.[messages.length - 1]?.content || '',
                    contextSent: {
                        profileFields: Object.keys(profileData).length,
                        profileData,
                        activeGoals: activeGoals.length,
                        todayTasks: todayTasks.length,
                        totalTasks: (allActionsResult as any[]).length,
                        activeHabits: (activeHabitsResult as any[]).length,
                        memories: memoryStrings.length,
                        lifeAreas: (areasResult as any[]).length,
                    },
                    systemPromptLength: systemPrompt.length,
                }, null, 2)}`,
                importanceWeight: 0.1,
                decayFactor: 1.0, // high decay = auto-cleanup
                lastAccessed: new Date(),
            });
        } catch (e) {
            console.warn('[AI] Failed to log debug context:', e);
        }

        // ── Invoke the AI ──
        let aiText = '';
        try {
            const result = await generateText({
                model: openai('gpt-4o'),
                system: systemPrompt,
                messages,
                tools: {
                    create_goal: tool({
                        description: 'Creates a new goal or project for the user.',
                        parameters: z.object({
                            title: z.string(),
                            goalType: z.string().describe('Must be EXACTLY one of: vision, strategic, tactical'),
                            areaId: z.string().describe('Optional ID of the life area this goal belongs to. Leave empty string if none.'),
                            reason: z.string().describe('Why is this goal important?'),
                        }),
                        // @ts-ignore
                        execute: async ({ title, goalType, areaId, reason }: { title: string, goalType: 'vision'|'strategic'|'tactical', areaId: string, reason: string }) => {
                            const newGoalId = uuidv4();
                            await db.insert(goals).values({
                                id: newGoalId,
                                userId,
                                title,
                                type: (goalType === 'vision' || goalType === 'strategic' || goalType === 'tactical') ? goalType : 'tactical',
                                areaId: areaId || undefined,
                                status: 'active',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                            return { success: true, goalId: newGoalId, message: 'Goal created successfully.' };
                        },
                    }),

                    schedule_task: tool({
                        description: 'Schedules a new task for today or a specific date.',
                        parameters: z.object({
                            title: z.string(),
                            duration: z.number().describe('Estimated duration in minutes'),
                            date: z.string().describe('YYYY-MM-DD format. Use empty string for today.'),
                        }),
                        // @ts-ignore
                        execute: async ({ title, duration, date }: { title: string, duration: number, date: string }) => {
                            const newActionId = uuidv4();
                            await db.insert(actions).values({
                                id: newActionId,
                                userId,
                                title,
                                type: 'task',
                                status: 'pending',
                                date: date || new Date().toISOString().split('T')[0],
                                duration,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });
                            return { success: true, actionId: newActionId, message: 'Task scheduled.' };
                        },
                    }),

                    log_memory: tool({
                        description: 'Saves important facts about the user to long-term memory.',
                        parameters: z.object({
                            fact: z.string().describe('The fact to remember'),
                            importance: z.number().min(0).max(1),
                        }),
                        // @ts-ignore
                        execute: async ({ fact, importance }: { fact: string, importance: number }) => {
                            await db.insert(aiMemories).values({
                                id: uuidv4(),
                                userId,
                                content: fact,
                                importanceWeight: importance,
                                createdAt: new Date(),
                                lastAccessed: new Date(),
                            });
                            return { success: true, message: 'Fact remembered.' };
                        },
                    }),
                },
            });

            aiText = result.text || '';
        } catch (aiError: any) {
            console.error('[AI] OpenAI/generateText error:', aiError);
            // Return the actual error message to the client for debugging
            const errMsg = aiError?.message || 'Unknown AI error';
            return new Response(
                `[AI Error] ${errMsg}`,
                { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        if (!aiText.trim()) {
            aiText = 'Я обробив ваш запит, але не маю текстової відповіді. Можливо, я виконав дію за допомогою інструментів.';
        }

        return new Response(aiText, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        console.error('[AI] Brain Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
