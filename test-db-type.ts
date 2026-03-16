// @ts-nocheck
import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function test() {
    const id = '372145cc-c891-4729-84c7-f7032a5129d3';
    const [user] = await db.select().from(users).where(eq(users.id, id));
    console.log('User emailVerified:', user.emailVerified);
    console.log('Type of emailVerified:', typeof user.emailVerified);
}

test().catch(console.error);
