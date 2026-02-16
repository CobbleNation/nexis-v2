
import { GOAL_BREAKDOWN_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { GoalBreakdownResponse } from '@/lib/ai/types';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { goalTitle, goalDescription, area } = body;

        if (!goalTitle) {
            return new Response('Goal title is required', { status: 400 });
        }

        const userPrompt = `
Goal Title: ${goalTitle}
Description: ${goalDescription || 'No description provided'}
Area: ${area || 'General'}

Break this goal down into actionable sub-tasks following the system instructions.
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
