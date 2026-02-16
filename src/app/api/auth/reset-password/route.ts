import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        // Find user with valid token and expiry in the future
        // Note: Drizzle dates are stored as timestamps (Date objects or numbers depending on driver).
        // Since sqlite dates are created with `checkTimestamp`, they come back as Dates.
        // We need to check if resetTokenExpiry > now.

        // Since we can't easily query > date in sqlite with some drivers directly in where clause without raw sql sometimes,
        // let's fetch by token first and validate in code for safety, or try standard gt()

        const user = await db.select().from(users).where(eq(users.resetToken, token)).get();

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
            return NextResponse.json({ error: 'Token expired' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await db.update(users)
            .set({
                passwordHash: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            })
            .where(eq(users.id, user.id));

        return NextResponse.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
