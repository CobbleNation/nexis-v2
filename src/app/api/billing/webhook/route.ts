import { NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Monobank webhook payload: { invoiceId, status, modifiedDate, amount, ccy, reference, ... }
        console.log('Monobank Webhook:', body);

        if (!body.invoiceId) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Find payment by Invoice ID (or reference if mapped)
        const payment = await db.select().from(payments).where(eq(payments.invoiceId, body.invoiceId)).get();

        if (!payment) {
            console.error('Payment not found for invoice:', body.invoiceId);
            return NextResponse.json({ message: 'Payment not found' }, { status: 200 }); // Return 200 to acknowledge
        }

        // Update Payment Status
        let newStatus = payment.status;
        if (body.status === 'success') newStatus = 'success';
        if (body.status === 'failure') newStatus = 'failure';

        await db.update(payments)
            .set({
                status: newStatus,
                updatedAt: new Date()
            })
            .where(eq(payments.id, payment.id));

        // If success, Activate Pro Plan & Save Card
        if (newStatus === 'success' && payment.status !== 'success') {
            const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
            if (!user) {
                console.error('User not found:', payment.userId);
                return NextResponse.json({ message: 'User not found' }, { status: 200 });
            }

            const period = payment.metadata?.period || 'month';
            const now = new Date();

            // Extension logic: if still active, add to expiry. If expired, add to now.
            const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : new Date();
            const baseDate = currentExpiry > now ? currentExpiry : now;

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

            const newExpiresAt = extendExpiry(baseDate, period);

            const updateData: any = {
                subscriptionTier: 'pro',
                subscriptionStartedAt: user.subscriptionStartedAt || now,
                subscriptionExpiresAt: newExpiresAt,
                subscriptionPeriod: period,
                currentPriceOverride: null, // Clear one-time override
                autoRenew: true,
                updatedAt: now
            };

            // Save card info if present in webhook
            if (body.maskedPan && body.maskedPan.length > 4) {
                updateData.cardLast4 = body.maskedPan.slice(-4);
            }
            if (body.cardToken) {
                updateData.cardToken = body.cardToken;
            }

            await db.update(users)
                .set(updateData)
                .where(eq(users.id, user.id));

            console.log(`Activated Pro (${period}) for user ${user.id} until ${newExpiresAt.toISOString()}`);
        }


        return NextResponse.json({ message: 'OK' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
