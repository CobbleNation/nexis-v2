
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { METRIC_SUGGESTION_SYSTEM_PROMPT } from '../src/lib/ai/prompts';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
    console.log("Testing OpenAI API...");
    console.log("API Key (first 5 chars):", process.env.OPENAI_API_KEY?.substring(0, 5));

    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY is missing!");
        process.exit(1);
    }

    try {
        const goalTitle = "Run a marathon";
        const area = "Health";

        const userPrompt = `
Goal Title: ${goalTitle}
Area: ${area}

Suggest 3 relevant metrics for this goal following the system instructions.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: METRIC_SUGGESTION_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        console.log("✅ API Response:", content);

        if (content) {
            const parsed = JSON.parse(content);
            console.log("✅ JSON Parsed Successfully:", parsed);
        }

    } catch (error: any) {
        console.error("❌ Open AI Error:", error);
    }
}

testOpenAI();
