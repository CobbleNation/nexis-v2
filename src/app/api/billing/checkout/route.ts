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

        // Configuration
        const AMOUNT = 19900; // 199.00 UAH
        const REFERENCE = uuidv4();
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 1. Create Invoice in Monobank
        const invoice = await monobank.createInvoice({
            amount: AMOUNT,
            merchantPaymInfo: {
                reference: REFERENCE,
                destination: 'Nexis Pro Subscription (1 Month)',
                basketOrder: [
                    {
                        name: 'Nexis Pro - Monthly',
                        qty: 1,
                        sum: AMOUNT,
                        unit: 'month'
                    }
                ]
            },
            redirectUrl: `${BASE_URL}/payment/success`, // Redirect user here after payment
            webHookUrl: `${BASE_URL}/api/billing/webhook` // Monobank notifies here
        });

        // 2. Record Pending Payment in DB
        await db.insert(payments).values({
            id: REFERENCE,
            userId: userId,
            amount: AMOUNT,
            status: 'pending',
            invoiceId: invoice.invoiceId,
            metadata: { pageUrl: invoice.pageUrl }
        });

        return NextResponse.json({ url: invoice.pageUrl });

    } catch (error) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
    }
}
