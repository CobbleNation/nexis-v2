
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkUser() {
    const user = await db.select().from(users).where(eq(users.email, 'denyspypko@gmail.com')).get();
    console.log('--- USER DATA ---');
    console.log(JSON.stringify(user, null, 2));
    if (user?.subscriptionExpiresAt) {
        const d = new Date(user.subscriptionExpiresAt);
        console.log('Parsed Date:', d.toISOString());
        console.log('Raw Value Type:', typeof user.subscriptionExpiresAt);
        console.log('Raw Value:', user.subscriptionExpiresAt);
    }
}

checkUser().catch(console.error);
