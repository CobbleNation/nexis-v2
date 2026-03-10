
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function repairUser() {
    console.log('🛠 Starting repair for denyspypko@gmail.com...');

    // 1. Fixing the crazy future dates (Reset to something sensible, e.g. 1 month from now)
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await db.update(users)
        .set({
            subscriptionStartedAt: now,
            subscriptionExpiresAt: expiresAt,
            emailVerified: now,
            // Clear the weird string values that got into integer/text columns
            currentPriceOverride: null,
            recurringPriceOverride: null,
            subscriptionPeriod: 'month',
            updatedAt: now
        })
        .where(eq(users.email, 'denyspypko@gmail.com'));

    console.log('✅ User repaired.');

    // Check again
    const user = await db.select().from(users).where(eq(users.email, 'denyspypko@gmail.com')).get();
    console.log('--- REPAIRED DATA ---');
    console.log(JSON.stringify(user, null, 2));
}

repairUser().catch(console.error);
