import { NextResponse } from 'next/server';
import { db } from '@/db'; // Assuming db is exported from '@/db' or '@/db/index'
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await db.select().from(users).where(eq(users.email, email)).get();

        if (!user) {
            // Do not reveal if user exists
            return NextResponse.json({ message: 'If email exists, reset link sent' });
        }

        // Generate Token
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await db.update(users)
            .set({
                resetToken: token,
                resetTokenExpiry: expires
            })
            .where(eq(users.id, user.id));

        // Send Reset Email
        try {
            await sendPasswordResetEmail(email, token);
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Reset link sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
