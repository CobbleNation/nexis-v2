import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users, payments } from '../src/db/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { monobank } from '../src/lib/monobank';
import { v4 as uuidv4 } from 'uuid';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});
const db = drizzle(client);


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

            // Use recurringPriceOverride if set, otherwise use plan default based on period
            const period = user.subscriptionPeriod || 'month';
            const defaultAmount = period === 'year' ? 199000 : 19900;
            const amount = user.recurringPriceOverride ?? defaultAmount;

            const REFERENCE = uuidv4();

            // 1. Attempt charge via Monobank
            const chargeResult = await monobank.createRecurringPayment({
                amount: amount,
                cardToken: user.cardToken!,
                description: `Zynorvia Pro Subscription Renewal (${period === 'year' ? 'Yearly' : 'Monthly'})`,
                reference: REFERENCE
            });

            console.log(`Charge result for ${user.email}:`, chargeResult);

            if (chargeResult.status === 'success' || chargeResult.status === 'processing') {
                // 2. Update subscription dates
                const newExpiry = new Date(user.subscriptionExpiresAt!);
                if (period === 'year') {
                    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
                } else {
                    newExpiry.setMonth(newExpiry.getMonth() + 1);
                }

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
                    amount: amount,
                    status: 'success', // We consider success/processing as successful renewal attempt
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
