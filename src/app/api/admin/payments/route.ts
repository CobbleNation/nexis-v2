import { NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
    try {
        const allPayments = await db
            .select({
                id: payments.id,
                userId: payments.userId,
                userName: users.name,
                userEmail: users.email,
                amount: payments.amount,
                currency: payments.currency,
                status: payments.status,
                invoiceId: payments.invoiceId,
                createdAt: payments.createdAt,
                updatedAt: payments.updatedAt,
            })
            .from(payments)
            .leftJoin(users, eq(payments.userId, users.id))
            .orderBy(desc(payments.createdAt));

        return NextResponse.json({ payments: allPayments });
    } catch (error: any) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
