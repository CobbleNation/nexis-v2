import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, payments } from '@/db/schema';
import { monobank } from '@/lib/monobank';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Find users with active Pro subscriptions that are about to expire or already expired
        // and have auto-renewal enabled with a card token.
        const now = new Date();

        const expiringUsers = await db.select()
            .from(users)
            .where(
                and(
                    eq(users.subscriptionTier, 'pro'),
                    eq(users.autoRenew, true),
                    isNotNull(users.cardToken),
                    lt(users.subscriptionExpiresAt, now) // Expired or expiring exactly now
                )
            );

        console.log(`[Cron] Found ${expiringUsers.length} users for subscription renewal.`);

        const results = [];

        for (const user of expiringUsers) {
            try {
                // Determine the amount to charge
                let amount = user.subscriptionPeriod === 'year' ? 199000 : 19900;
                if (user.recurringPriceOverride) {
                    amount = user.recurringPriceOverride;
                }

                const REFERENCE = uuidv4();
                const description = `Renewal: Zynorvia Pro (${user.subscriptionPeriod || 'month'})`;

                console.log(`[Cron] Attempting renewal for user ${user.id} (${user.email}), amount: ${amount}`);

                // Try to charge the card
                const chargeResult = await monobank.createRecurringPayment({
                    amount,
                    cardToken: user.cardToken!,
                    description,
                    reference: REFERENCE
                });

                // Record the payment
                await db.insert(payments).values({
                    id: REFERENCE,
                    userId: user.id,
                    amount,
                    status: 'success',
                    invoiceId: chargeResult.invoiceId || null,
                    metadata: {
                        cron: true,
                        recurring: true,
                        period: user.subscriptionPeriod
                    }
                });

                // Extend the subscription
                const period = user.subscriptionPeriod || 'month';
                const currentExpiry = new Date(user.subscriptionExpiresAt!);

                const extendExpiry = (base: Date, p: string): Date => {
                    const next = new Date(base);
                    if (p === 'year') {
                        next.setFullYear(next.getFullYear() + 1);
                    } else if (p === 'month') {
                        next.setMonth(next.getMonth() + 1);
                    } else if (p.endsWith('m')) {
                        const mins = parseInt(p.replace('m', ''));
                        if (!isNaN(mins)) next.setMinutes(next.getMinutes() + mins);
                    } else if (p.endsWith('h')) {
                        const hours = parseInt(p.replace('h', ''));
                        if (!isNaN(hours)) next.setHours(next.getHours() + hours);
                    } else if (p.endsWith('d')) {
                        const days = parseInt(p.replace('d', ''));
                        if (!isNaN(days)) next.setDate(next.getDate() + days);
                    } else {
                        next.setMonth(next.getMonth() + 1);
                    }
                    return next;
                };

                const newExpiresAt = extendExpiry(currentExpiry > now ? currentExpiry : now, period);

                await db.update(users)
                    .set({
                        subscriptionExpiresAt: newExpiresAt,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, user.id));

                results.push({ userId: user.id, status: 'renewed', newExpiresAt });
                console.log(`[Cron] Successfully renewed subscription for user ${user.id} until ${newExpiresAt.toISOString()}`);

            } catch (error: any) {
                console.error(`[Cron] Failed to renew user ${user.id}:`, error.message);

                // Record failed payment
                await db.insert(payments).values({
                    id: uuidv4(),
                    userId: user.id,
                    amount: user.subscriptionPeriod === 'year' ? 199000 : 19900,
                    status: 'failure',
                    metadata: {
                        cron: true,
                        error: error.message
                    }
                });

                // Revoke subscription on payment failure
                await db.update(users)
                    .set({
                        subscriptionTier: 'free',
                        autoRenew: false,
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, user.id));

                results.push({ userId: user.id, status: 'revoked', error: error.message });
            }
        }

        return NextResponse.json({
            processed: expiringUsers.length,
            results,
            timestamp: now.toISOString()
        });

    } catch (error) {
        console.error('[Cron] Universal Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
