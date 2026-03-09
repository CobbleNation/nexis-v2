
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, payments } from '../src/db/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { monobank } from '../src/lib/monobank';
import { v4 as uuidv4 } from 'uuid';

const dbPath = 'sqlite.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function runAutoBilling() {
    console.log('💳 Auto-billing process started...');

    const now = new Date();
    // Find users whose subscription expires in less than 24 hours and have autoRenew enabled
    const bufferTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const usersToCharge = await db.select()
        .from(users)
        .where(
            and(
                eq(users.subscriptionTier, 'pro'),
                eq(users.autoRenew, true),
                isNotNull(users.cardToken),
                lt(users.subscriptionExpiresAt, bufferTime)
            )
        );

    console.log(`Found ${usersToCharge.length} users to charge.`);

    for (const user of usersToCharge) {
        try {
            console.log(`Processing user: ${user.email} (${user.id})`);

            const AMOUNT = 19900; // 199.00 UAH
            const REFERENCE = uuidv4();

            // 1. Attempt charge via Monobank
            const chargeResult = await monobank.createRecurringPayment({
                amount: AMOUNT,
                cardToken: user.cardToken!,
                description: 'Zynorvia Pro Subscription Renewal',
                reference: REFERENCE
            });

            console.log(`Charge result for ${user.email}:`, chargeResult);

            if (chargeResult.status === 'success') {
                // 2. Update subscription dates
                const newExpiry = new Date(user.subscriptionExpiresAt!);
                newExpiry.setMonth(newExpiry.getMonth() + 1);

                await db.update(users)
                    .set({
                        subscriptionExpiresAt: newExpiry,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, user.id));

                // 3. Record payment
                await db.insert(payments).values({
                    id: REFERENCE,
                    userId: user.id,
                    amount: AMOUNT,
                    status: 'success',
                    metadata: chargeResult,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                console.log(`✅ Successfully renewed subscription for ${user.email} until ${newExpiry.toISOString()}`);
            } else {
                console.error(`❌ Charge failed for ${user.email}: status is ${chargeResult.status}`);
                // Potential logic: disable auto-renew or notify user
            }

        } catch (error) {
            console.error(`💥 Error processing auto-billing for ${user.email}:`, error);
        }
    }

    // Also, downgrade users whose subscription has expired and autoRenew is false
    const expiredUsers = await db.select()
        .from(users)
        .where(
            and(
                eq(users.subscriptionTier, 'pro'),
                eq(users.autoRenew, false),
                lt(users.subscriptionExpiresAt, now)
            )
        );

    for (const user of expiredUsers) {
        console.log(`📉 Downgrading expired user: ${user.email}`);
        await db.update(users)
            .set({
                subscriptionTier: 'free',
                updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
    }

    console.log('🏁 Auto-billing process finished.');
}

runAutoBilling().catch(console.error);
