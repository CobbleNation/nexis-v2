
import { GOAL_BREAKDOWN_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { GoalBreakdownResponse } from '@/lib/ai/types';
import OpenAI from 'openai';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { goalTitle, goalDescription, area, requestedCount, feedback } = body;

        // 1. Auth & Pro Check
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return new Response(JSON.stringify({ error: 'Invalid Token' }), { status: 401 });

        const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

        if (!user || (user.subscriptionTier !== 'pro' && user.role !== 'admin')) {
            return new Response(JSON.stringify({ error: 'Pro subscription required' }), { status: 403 });
        }


        if (!goalTitle) {
            return new Response('Goal title is required', { status: 400 });
        }

        const countInstruction = requestedCount
            ? `IMPORTANT: You MUST generate EXACTLY ${requestedCount} sub-tasks. No more, no less.`
            : '';

        const userPrompt = `
Goal Title: ${goalTitle}
Description: ${goalDescription || 'No description provided'}
Area: ${area || 'General'}

${feedback ? `Previous feedback/comments from the user:\n${feedback}\nPlease adjust the sub-tasks accordingly. Be sure to regenerate the list considering these notes.` : 'Break this goal down into actionable sub-tasks following the system instructions.'}
${countInstruction}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: GOAL_BREAKDOWN_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        const result: GoalBreakdownResponse = JSON.parse(content);

        return Response.json(result);

    } catch (error: any) {
        console.error('AI Breakdown API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
