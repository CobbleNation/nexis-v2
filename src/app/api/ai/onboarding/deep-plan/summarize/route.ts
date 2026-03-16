import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { DEFAULT_AREAS } from '@/lib/default-areas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 });
        }

        const body = await req.json();
        const { messages, selectedAreaIds } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
             return NextResponse.json({ error: 'No chat history provided' }, { status: 400 });
        }

        const transcript = messages.map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n\n');

        const areaDescriptions = selectedAreaIds.map((id: string) => {
            const area = DEFAULT_AREAS.find(a => a.iconName === id);
            return `- Area ID: "${id}" (Title: ${area?.title || 'Unknown'})`;
        }).join('\n');

        const systemPrompt = `You are an expert system architect parsing a completed deep life coaching conversation into database records.
IMPORTANT RULES:
1. YOU MUST RESPOND ONLY IN UKRAINIAN (УКРАЇНСЬКОЮ МОВОЮ).
2. You MUST NOT create new Life Areas. You must create Goals, Projects, Tasks, Metrics, and Habits and map them STRICTLY logically to one of these pre-existing Life Area IDs below based on the Area Title:
${areaDescriptions}

Conversation Transcript:
"""
${transcript}
"""

TASK:
Analyze the transcript above and extract absolutely EVERY concrete Goal, Project, Task, Metric, and Habit that was discussed and agreed upon. This is a Deep Planning session, meaning the breakdown must be exhaustive. Match financial goals ONLY to the Financial area, health to health, etc.

Output JSON format:
{
  "goals": [
    {
      "areaId": "<Area ID from list above>",
      "title": "Goal Title",
      "description": "Short description based on chat context",
      "type": "strategic", // "vision", "strategic", or "tactical"
      "metric": {
        "name": "What to measure (e.g., Дохід) - ONLY if a specific number was given",
        "unit": "Unit (e.g., $)",
        "target": 1000,
        "frequency": "weekly" // "daily", "weekly", or "monthly"
      },
      "tasks": [
        { "title": "Specific actionable task for this goal" }
      ]
    }
  ],
  "projects": [
     {
       "areaId": "<Area ID from list above>",
       "title": "Project Title",
       "description": "Description",
       "tasks": [
           { "title": "Actionable task for this project" }
       ]
     }
  ],
  "habits": [
    { "title": "Habit Title", "frequency": "daily" }
  ]
}`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are an expert data parser. Output ONLY valid JSON matching the requested structure. ALWAYS answer in Ukrainian." },
                { role: "user", content: systemPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2, // Low temp for reliable formatting
        });

        let content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const plan = JSON.parse(content);

        return NextResponse.json({ success: true, plan });

    } catch (e: any) {
        console.error("Failed to summarize deep plan:", e);
        return NextResponse.json({ error: 'Summarize failed' }, { status: 500 });
    }
}
