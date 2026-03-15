import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

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
        const { selectedAreaIds, goalsText } = body;

        if (!selectedAreaIds || !Array.isArray(selectedAreaIds) || selectedAreaIds.length === 0) {
            return NextResponse.json({ missingAreas: [] });
        }

        // If user wrote absolutely nothing, then all areas are technically "missing" context
        if (!goalsText || goalsText.trim().length === 0) {
            return NextResponse.json({ missingAreas: selectedAreaIds });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const systemPrompt = `You are a strict data analyzer.
The user has selected the following life areas: ${selectedAreaIds.join(', ')}.
The user wrote the following text describing their goals:
"${goalsText}"

TASK:
Analyze the text. Determine which of the selected life areas DO NOT have any goals or mentions in the text.
Return a JSON object with a single key "missingAreas" containing an array of strings representing the exact area IDs from the provided list that are missing.
If ALL selected areas are addressed in the text, return an empty array.

Output exactly this JSON format:
{
  "missingAreas": ["Area1", "Area2"]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const result = JSON.parse(content);

        return NextResponse.json({ missingAreas: result.missingAreas || [] });

    } catch (error: any) {
        console.error('Area Validation Error:', error);
        return NextResponse.json({ error: 'Failed to validate areas' }, { status: 500 });
    }
}
