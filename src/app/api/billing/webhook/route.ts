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

            const action = payment.metadata?.action || 'subscription';
            const period = payment.metadata?.period || 'month';
            const now = new Date();

            let updateData: any = {
                updatedAt: now
            };

            if (action === 'attach_card') {
                // Card data is in walletData object per Monobank API docs
                const cardToken = body.walletData?.cardToken;
                const maskedPan = body.paymentInfo?.maskedPan;

                if (cardToken) {
                    updateData.autoRenew = true;
                    updateData.cardToken = cardToken;
                    if (maskedPan && maskedPan.length > 4) {
                        updateData.cardLast4 = maskedPan.replace(/\*/g, '').slice(-4);
                    }
                    console.log(`Attached card for user ${user.id}, token: ${cardToken}, last4: ${updateData.cardLast4}`);
                } else {
                    console.warn(`Attach card for user ${user.id} succeeded but NO walletData.cardToken was returned. Webhook body keys: ${Object.keys(body).join(', ')}`);
                    // Log walletData if it exists but has different structure
                    if (body.walletData) console.warn('walletData:', JSON.stringify(body.walletData));
                }

                if (Object.keys(updateData).length > 1) {
                    await db.update(users).set(updateData).where(eq(users.id, user.id));
                }
            } else {
                // Subscription extension logic
                const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : new Date();
                let baseDate = currentExpiry > now ? currentExpiry : now;

                // For test periods (like 1m, 1h), force baseDate to now so testing is immediate
                if (period !== 'month' && period !== 'year') {
                    baseDate = now;
                }

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

                updateData = {
                    ...updateData,
                    subscriptionTier: 'pro',
                    subscriptionStartedAt: user.subscriptionStartedAt || now,
                    subscriptionExpiresAt: newExpiresAt,
                    subscriptionPeriod: period,
                    currentPriceOverride: null, // Clear one-time override
                };

                // Save card info from walletData per Monobank API docs
                const cardToken = body.walletData?.cardToken;
                const maskedPan = body.paymentInfo?.maskedPan;

                if (cardToken) {
                    updateData.autoRenew = true;
                    updateData.cardToken = cardToken;
                    if (maskedPan && maskedPan.length > 4) {
                        updateData.cardLast4 = maskedPan.replace(/\*/g, '').slice(-4);
                    }
                    console.log(`Card saved during subscription for user ${user.id}, token: ${cardToken}`);
                } else if (!user.cardToken && user.autoRenew) {
                    updateData.autoRenew = false;
                }

                await db.update(users).set(updateData).where(eq(users.id, user.id));
                console.log(`Activated Pro (${period}) for user ${user.id} until ${newExpiresAt.toISOString()}`);
            }
        }


        return NextResponse.json({ message: 'OK' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
