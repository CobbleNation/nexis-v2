import { NextResponse } from 'next/server';
import { db } from '@/db';
import { aiMemories, users } from '@/db/schema';
import { eq, like, desc } from 'drizzle-orm';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        // Check admin role
        const [user] = await db.select().from(users).where(eq(users.id, payload.userId as string));
        if (!user || !['admin', 'manager'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all AI debug logs
        const logs = await db.select({
            id: aiMemories.id,
            userId: aiMemories.userId,
            content: aiMemories.content,
            createdAt: aiMemories.createdAt,
        })
        .from(aiMemories)
        .where(like(aiMemories.content, 'AI_DEBUG_LOG:%'))
        .orderBy(desc(aiMemories.createdAt))
        .limit(100);

        // Parse the logs for display
        const parsed = logs.map(log => {
            try {
                const jsonPart = log.content.split('\n').slice(1).join('\n');
                const data = JSON.parse(jsonPart);
                return {
                    id: log.id,
                    userId: log.userId,
                    createdAt: log.createdAt,
                    timestamp: data.timestamp,
                    userMessage: data.userMessage,
                    contextSent: data.contextSent,
                    systemPromptLength: data.systemPromptLength,
                };
            } catch {
                return {
                    id: log.id,
                    userId: log.userId,
                    createdAt: log.createdAt,
                    raw: log.content,
                };
            }
        });

        return NextResponse.json({ logs: parsed });
    } catch (e) {
        console.error('[Admin] AI Debug Logs Error:', e);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
