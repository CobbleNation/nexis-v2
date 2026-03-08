import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { DAILY_REVIEW_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        // 1. Auth & Pro Check
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string)).limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.subscriptionTier !== 'pro' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
        }

        // 2. Parse Input
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
