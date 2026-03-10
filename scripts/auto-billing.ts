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


function extendExpiry(currentExpiry: Date, period: string): Date {
    const date = new Date(currentExpiry);
    const match = period.match(/^(\d+)([myhd])$/);

    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'm': date.setMinutes(date.getMinutes() + value); break;
            case 'h': date.setHours(date.getHours() + value); break;
            case 'd': date.setDate(date.getDate() + value); break;
        }
        return date;
    }

    if (period === 'year') {
        date.setFullYear(date.getFullYear() + 1);
    } else {
        date.setMonth(date.getMonth() + 1);
    }
    return date;
}

async function runAutoBilling() {
    console.log('💳 Auto-billing process started...');

    const now = new Date();
    // Find users whose subscription expires in less than 5 minutes (for precise test billing)
    // or standard 24 hour buffer for normal cycles
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);

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

    console.log(`Found ${usersToCharge.length} users to potentially charge.`);

    for (const user of usersToCharge) {
        try {
            console.log(`Processing user: ${user.email} (${user.id})`);

            const period = user.subscriptionPeriod || 'month';
            const defaultAmount = period === 'year' ? 199000 : 19900;
            const amount = user.recurringPriceOverride ?? defaultAmount;

            const REFERENCE = uuidv4();

            // 1. Attempt charge via Monobank
            const chargeResult = await monobank.createRecurringPayment({
                amount: amount,
                cardToken: user.cardToken!,
                description: `Zynorvia Pro Subscription Renewal (${period})`,
                reference: REFERENCE
            });

            console.log(`Charge result for ${user.email}:`, chargeResult);

            if (chargeResult.status === 'success' || chargeResult.status === 'processing') {
                // 2. Update subscription dates
                const newExpiry = extendExpiry(new Date(user.subscriptionExpiresAt!), period);

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
                    status: 'success',
                    metadata: chargeResult,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                console.log(`✅ Successfully renewed subscription for ${user.email} until ${newExpiry.toISOString()}`);
            } else {
                console.error(`❌ Charge failed for ${user.email}: status is ${chargeResult.status}`);
            }

        } catch (error) {
            console.error(`💥 Error processing auto-billing for ${user.email}:`, error);
        }
    }

    // Downgrade users whose subscription has expired and autoRenew is false
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

console.log('🏁 Auto-billing process finished.');
}

runAutoBilling().catch(console.error);
