
import { GOAL_CREATOR_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { GoalCreatorResponse } from '@/lib/ai/types';
import OpenAI from 'openai';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.error('AI Goal Creator Error: OPENAI_API_KEY is not configured');
            return new Response(JSON.stringify({ error: 'AI сервіс не налаштовано. Зверніться до адміністратора.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const body = await req.json();
        const { userInput, areas } = body;

        // 1. Auth & Pro Check
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return new Response(JSON.stringify({ error: 'Invalid Token' }), { status: 401 });

        const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

        if (!user || (user.subscriptionTier !== 'pro' && user.role !== 'admin')) {
            return new Response(JSON.stringify({ error: 'Потрібна Pro підписка' }), { status: 403 });
        }

        if (!userInput || !userInput.trim()) {
            return new Response(JSON.stringify({ error: 'Опишіть, чого ви хочете досягти' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const areasList = areas && areas.length > 0
            ? areas.map((a: string) => `- ${a}`).join('\n')
            : '- Загальне';

        const userPrompt = `
User's description of what they want to achieve:
"${userInput.trim()}"

Available life areas in their system:
${areasList}

Generate 2-3 well-structured goal variants based on this description following the system instructions.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: GOAL_CREATOR_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        const result: GoalCreatorResponse = JSON.parse(content);

        return Response.json(result);

    } catch (error: any) {
        console.error('AI Goal Creator Error:', error?.message || error, error?.stack);

        let errorMessage = 'Внутрішня помилка сервера';
        if (error?.code === 'invalid_api_key' || error?.status === 401) {
            errorMessage = 'Невірний API ключ OpenAI. Зверніться до адміністратора.';
        } else if (error?.code === 'insufficient_quota' || error?.status === 429) {
            errorMessage = 'Ліміт AI запитів вичерпано. Спробуйте пізніше.';
        } else if (error?.message?.includes('JSON')) {
            errorMessage = 'Помилка обробки відповіді AI. Спробуйте ще раз.';
        }

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
