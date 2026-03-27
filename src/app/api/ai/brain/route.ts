import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { db } from '@/db';
import { aiMemories } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log('[AI] Diagnostic Pong handler firing');
        
        // Try to authenticate just to see if it works
        try {
            const cookieStore = await cookies();
            const authHeader = req.headers.get('authorization');
            const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieStore.get('access_token')?.value;
            
            if (token) {
                console.log('[AI] Auth token detected');
            }
        } catch (e) {
            console.warn('[AI] Auth check failed (expected if no cookies):', e);
        }

        return new Response('Pong - Nexis Brain is Reachable', { 
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    } catch (error) {
        console.error('[AI] Pong Error:', error);
        return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, { status: 500 });
    }
}
