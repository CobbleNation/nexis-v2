import { NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        const userPayments = await db
            .select()
            .from(payments)
            .where(eq(payments.userId, userId))
            .orderBy(desc(payments.createdAt));

        return NextResponse.json({ payments: userPayments });
    } catch (error: any) {
        console.error('Error fetching user payments:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}
