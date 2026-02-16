import { ZYNORVIA_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { AssistantResponse } from '@/lib/ai/types';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        // Validation
        if (!messages || !Array.isArray(messages)) {
            return new Response('Messages array is required', { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: ZYNORVIA_SYSTEM_PROMPT },
                { role: "system", content: `CURRENT DATE: ${new Date().toISOString()}` },
                ...messages
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        // Parse JSON output
        const result: AssistantResponse = JSON.parse(content);

        return Response.json(result);

    } catch (error: any) {
        console.error('Assistant API Error:', error);

        // Detailed error logging
        if (error.response) {
            console.error('OpenAI Response Data:', error.response.data);
            console.error('OpenAI Response Status:', error.response.status);
            console.error('OpenAI Response Headers:', error.response.headers);
        } else if (error.request) {
            console.error('OpenAI Request made but no response received:', error.request);
        } else {
            console.error('Error Message:', error.message);
        }

        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
