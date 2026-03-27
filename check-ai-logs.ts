// @ts-nocheck
import { db } from './src/db/index.ts';
import { aiMemories } from './src/db/schema.ts';
import { desc } from 'drizzle-orm';

async function checkLogs() {
    console.log('Fetching latest AI memory logs...');
    const logs = await db.select()
        .from(aiMemories)
        .orderBy(desc(aiMemories.createdAt))
        .limit(10);
    
    console.log('Latest logs:');
    logs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] ${log.content}`);
    });
}

checkLogs().catch(console.error);
