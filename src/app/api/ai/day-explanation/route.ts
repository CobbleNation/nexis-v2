import { DAY_EXPLANATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { DayExplanationResponse } from '@/lib/ai/types';
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
        // 1. Auth & Pro Check
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) {
            return new Response(JSON.stringify({ error: 'Invalid Token' }), { status: 401 });
        }

        const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        if (user.subscriptionTier !== 'pro') {
            return new Response(JSON.stringify({ error: 'Pro subscription required' }), { status: 403 });
        }

        // 2. Parse Input
        const body = await req.json();
        const { date, mood, focus, activities, notes } = body;

        const userPrompt = `
Date: ${date}
Mood: ${mood}/10
Focus Areas: ${Array.isArray(focus) ? focus.join(', ') : focus}
Activities: ${Array.isArray(activities) ? activities.join(', ') : activities}
Journal Notes: ${notes || 'None'}

Analyze this day mostly based on the mood and notes.
`;

        // 3. AI Generation
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: DAY_EXPLANATION_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        const result: DayExplanationResponse = JSON.parse(content);

        return Response.json(result);

    } catch (error: any) {
        console.error('Day Explanation API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
