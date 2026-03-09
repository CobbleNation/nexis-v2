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
            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            const updateData: any = {
                subscriptionTier: 'pro',
                subscriptionStartedAt: now,
                subscriptionExpiresAt: expiresAt,
                autoRenew: true,
                updatedAt: now
            };

            // Save card info if present in webhook
            // Monobank often sends 'maskedPan' and 'walletId' in success callbacks
            if (body.maskedPan && body.maskedPan.length > 4) {
                updateData.cardLast4 = body.maskedPan.slice(-4);
            }
            if (body.walletId) {
                updateData.cardToken = body.walletId;
            }

            await db.update(users)
                .set(updateData)
                .where(eq(users.id, payment.userId));

            console.log(`Activated Pro Plan for user ${payment.userId} until ${expiresAt.toISOString()}`);
        }

        return NextResponse.json({ message: 'OK' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
