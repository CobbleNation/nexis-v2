import { NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, users } from '@/db/schema';
import { monobank } from '@/lib/monobank';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const userId = payload.userId as string;
        const user = await db.select().from(users).where(eq(users.id, userId)).get();

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // 0. Parse Request Body
        const body = await req.json().catch(() => ({}));
        // Allow any period string for testing (e.g., '1m'), default to 'month'
        const requestedPeriod = body.period || 'month';
        const action = body.action || 'subscription'; // 'subscription' | 'attach_card'

        // 1. Calculate Amount (Priority: Override > Default)
        // Default prices: monthly = 199.00 UAH, yearly = 1990.00 UAH
        let amount = requestedPeriod === 'year' ? 199000 : 19900;
        let description = requestedPeriod === 'year' ? 'Zynorvia Pro Subscription (1 Year)' : 'Zynorvia Pro Subscription (1 Month)';
        let basketName = requestedPeriod === 'year' ? 'Zynorvia Pro - Yearly' : 'Zynorvia Pro - Monthly';

        if (action === 'attach_card') {
            amount = 100; // 1.00 UAH for saving card
            description = 'Прив\'язка картки (1 UAH буде повернуто/зараховано)';
            basketName = 'Прив\'язка картки';
        } else if (user.currentPriceOverride !== null && user.currentPriceOverride !== undefined) {
            amount = user.currentPriceOverride;
            console.log(`[Checkout] Applying price override: ${amount} units for user ${userId}`);
        }

        const REFERENCE = uuidv4();
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 2. Create Invoice in Monobank
        const invoice = await monobank.createInvoice({
            amount: amount,
            merchantPaymInfo: {
                reference: REFERENCE,
                destination: description,
                basketOrder: [
                    {
                        name: basketName,
                        qty: 1,
                        sum: amount,
                        unit: action === 'attach_card' ? 'шт' : requestedPeriod
                    }
                ]
            },
            redirectUrl: `${BASE_URL}/payment/success`, // Redirect user here after payment
            webHookUrl: `${BASE_URL}/api/billing/webhook`, // Monobank notifies here
            saveCard: true
        });

        // 3. Record Pending Payment in DB
        await db.insert(payments).values({
            id: REFERENCE,
            userId: userId,
            amount: amount,
            status: 'pending',
            invoiceId: invoice.invoiceId,
            metadata: {
                pageUrl: invoice.pageUrl,
                period: requestedPeriod, // Crucial for webhook to know how much to extend
                action: action // 'attach_card' or 'subscription'
            }
        });

        return NextResponse.json({ url: invoice.pageUrl });


    } catch (error) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
    }
}
