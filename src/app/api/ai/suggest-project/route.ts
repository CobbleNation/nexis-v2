
import { PROJECT_SUGGESTION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { ProjectSuggestionResponse } from '@/lib/ai/types';
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
        const { title, description, areaName } = body;

        // 1. Auth & Pro Check
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return new Response(JSON.stringify({ error: 'Invalid Token' }), { status: 401 });

        const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

        if (!user || (user.subscriptionTier !== 'pro' && user.role !== 'admin')) {
            // For now, let's allow basic suggestions even for free users or handle it on frontend
            // Or return 403. Let's return 403 conform to other AI routes.
            return new Response(JSON.stringify({ error: 'Pro subscription required' }), { status: 403 });
        }

        if (!title) {
            return new Response('Project title is required', { status: 400 });
        }

        const userPrompt = `
Project Title: ${title}
Description: ${description || 'N/A'}
Area: ${areaName || 'General'}

Suggest relevant metrics and tasks for this project.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: PROJECT_SUGGESTION_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        const result: ProjectSuggestionResponse = JSON.parse(content);

        return Response.json(result);

    } catch (error: any) {
        console.error('AI Project API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
