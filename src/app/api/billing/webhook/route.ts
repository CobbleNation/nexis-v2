import { NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Monobank Webhook:', JSON.stringify(body, null, 2));

        if (!body.invoiceId) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // ──────────────────────────────────────────────────────────
        // PHASE 1: Handle card tokenization webhook separately.
        // Monobank sends a SECOND webhook with walletData.cardToken
        // AFTER the payment succeeds. We must always process this.
        // ──────────────────────────────────────────────────────────
        if (body.walletData?.cardToken) {
            const cardToken = body.walletData.cardToken;
            const maskedPan = body.paymentInfo?.maskedPan || '';
            const cardLast4 = maskedPan.replace(/\*/g, '').slice(-4) || null;

            console.log(`[Webhook] Card tokenization received: token=${cardToken}, last4=${cardLast4}`);

            // Find the payment to get the userId
            const payment = await db.select().from(payments).where(eq(payments.invoiceId, body.invoiceId)).get();
            if (payment) {
                const updateData: any = {
                    cardToken: cardToken,
                    autoRenew: true,
                    updatedAt: new Date()
                };
                if (cardLast4) updateData.cardLast4 = cardLast4;

                await db.update(users).set(updateData).where(eq(users.id, payment.userId));
                console.log(`[Webhook] Saved card token for user ${payment.userId}: token=${cardToken}, last4=${cardLast4}`);
            } else {
                // Try finding by reference
                const refPayment = body.reference ? await db.select().from(payments).where(eq(payments.id, body.reference)).get() : null;
                if (refPayment) {
                    const updateData: any = {
                        cardToken: cardToken,
                        autoRenew: true,
                        updatedAt: new Date()
                    };
                    if (cardLast4) updateData.cardLast4 = cardLast4;

                    await db.update(users).set(updateData).where(eq(users.id, refPayment.userId));
                    console.log(`[Webhook] Saved card token for user ${refPayment.userId} (via reference): token=${cardToken}, last4=${cardLast4}`);
                } else {
                    console.warn(`[Webhook] Could not find payment for tokenization webhook. invoiceId: ${body.invoiceId}, reference: ${body.reference}`);
                }
            }
        }

        // ──────────────────────────────────────────────────────────
        // PHASE 2: Handle payment status change (success/failure)
        // ──────────────────────────────────────────────────────────
        const payment = await db.select().from(payments).where(eq(payments.invoiceId, body.invoiceId)).get();

        if (!payment) {
            // Also try by reference (payment.id === body.reference)
            if (body.reference) {
                const refPayment = await db.select().from(payments).where(eq(payments.id, body.reference)).get();
                if (refPayment) {
                    // Update the invoiceId so future webhooks can find it
                    await db.update(payments).set({ invoiceId: body.invoiceId, updatedAt: new Date() }).where(eq(payments.id, refPayment.id));
                    console.log(`[Webhook] Linked invoiceId ${body.invoiceId} to payment ${refPayment.id}`);
                    // Re-process with the found payment
                    return await processPaymentWebhook(body, refPayment);
                }
            }
            console.warn('[Webhook] Payment not found for invoice:', body.invoiceId, 'reference:', body.reference);
            return NextResponse.json({ message: 'OK' }, { status: 200 });
        }

        return await processPaymentWebhook(body, payment);

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function processPaymentWebhook(body: any, payment: any) {
    // Only process status changes we care about
    if (body.status !== 'success' && body.status !== 'failure') {
        // Update payment status for tracking
        await db.update(payments).set({ status: body.status, updatedAt: new Date() }).where(eq(payments.id, payment.id));
        return NextResponse.json({ message: 'OK' });
    }

    const newStatus = body.status as 'success' | 'failure';

    // Update payment status
    await db.update(payments).set({ status: newStatus, updatedAt: new Date() }).where(eq(payments.id, payment.id));

    // Skip if already processed as success (idempotency for the subscription part)
    if (payment.status === 'success' && newStatus === 'success') {
        console.log(`[Webhook] Payment ${payment.id} already processed as success, skipping subscription logic.`);
        return NextResponse.json({ message: 'OK' });
    }

    if (newStatus !== 'success') {
        return NextResponse.json({ message: 'OK' });
    }

    // ── SUCCESS: Process subscription / attach_card ──
    const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
    if (!user) {
        console.error('[Webhook] User not found:', payment.userId);
        return NextResponse.json({ message: 'User not found' }, { status: 200 });
    }

    const action = payment.metadata?.action || 'subscription';
    const period = payment.metadata?.period || 'month';
    const now = new Date();

    if (action === 'attach_card') {
        // For attach_card, card saving is handled in PHASE 1 above
        // Just log and return
        console.log(`[Webhook] attach_card payment successful for user ${user.id}`);
        return NextResponse.json({ message: 'OK' });
    }

    // ── Subscription extension ──
    const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : new Date();
    let baseDate = currentExpiry > now ? currentExpiry : now;

    // For test periods (like 1m, 1h), force baseDate to now
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

    const updateData: any = {
        subscriptionTier: 'pro',
        subscriptionStartedAt: user.subscriptionStartedAt || now,
        subscriptionExpiresAt: newExpiresAt,
        subscriptionPeriod: period,
        currentPriceOverride: null,
        updatedAt: now
    };

    await db.update(users).set(updateData).where(eq(users.id, user.id));
    console.log(`[Webhook] Activated Pro (${period}) for user ${user.id} until ${newExpiresAt.toISOString()}`);

    // Track Subscription Started
    const { trackEvent } = await import('@/lib/analytics-server');
    await trackEvent({
        eventName: 'subscription_started',
        userId: user.id,
        plan: 'pro',
        source: 'web',
        metadata: { period, amount: payment.amount, currency: payment.currency }
    });

    return NextResponse.json({ message: 'OK' });
}
