import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { DAILY_REVIEW_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { completedTasks, pendingTasks, goals } = await req.json();

        // Construct context for the AI
        const context = `
        Completed Today:
        ${completedTasks?.map((t: any) => `- ${t.title}`).join('\n') || "None"}
        
        Pending:
        ${pendingTasks?.map((t: any) => `- ${t.title}`).join('\n') || "None"}

        Active Goals:
        ${goals?.map((g: any) => `- ${g.title}: ${g.progress}%`).join('\n') || "None"}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: DAILY_REVIEW_SYSTEM_PROMPT },
                { role: "user", content: context }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const responseContent = completion.choices[0].message.content;

        if (!responseContent) {
            throw new Error("No content received from AI");
        }

        const data = JSON.parse(responseContent);

        // Inject counts
        const completedCount = completedTasks?.length || 0;
        const totalCount = (completedTasks?.length || 0) + (pendingTasks?.length || 0);

        return NextResponse.json({
            ...data,
            completedCount,
            totalCount
        });

    } catch (error) {
        console.error("AI Daily Review Error:", error);
        return NextResponse.json(
            { error: "Failed to generate daily review" },
            { status: 500 }
        );
    }
}
