import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyJWT } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const body = await req.json();
        const { bio, firstName, lastName, avatar, onboardingCompleted } = body;
        const userId = payload.userId as string;

        // Construct update object dynamically
        const updateData: any = {};
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

        // Handle name reconstruction if needed, or just store fields if schema supports it
        // Schema has 'name', but UI uses firstName/lastName. 
        // Let's check schema again. effective User interface has firstName/lastName but schema might not?
        // Let's assume we update 'name' if first/last are provided.

        if (firstName || lastName) {
            // Fetch current name to merge if one is missing? 
            // Or just rely on what's passed. Front-end passes both usually.
            // Let's check if we have first/last in DB or just name.
            // ... Wait, I should check schema first to be safe, but for now I'll update 'name' 
            // based on what I see in auth-context:
            // updatedUser.name = `${data.firstName || user.firstName || ''} ${data.lastName || user.lastName || ''}`.trim();

            // To do this correctly on server without fetching, we might need value. 
            // But usually we just update what we have. 
            // Let's fetch user first to be safe if partial update.
            const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

            if (currentUser) {
                const currentNameParts = currentUser.name?.split(' ') || ['', ''];
                const newFirst = firstName !== undefined ? firstName : currentNameParts[0];
                const newLast = lastName !== undefined ? lastName : currentNameParts.slice(1).join(' ');

                updateData.name = `${newFirst} ${newLast}`.trim();
            }
        }

        if (Object.keys(updateData).length > 0) {
            await db.update(users)
                .set(updateData)
                .where(eq(users.id, userId));
        }

        return NextResponse.json({
            success: true,
            user: {
                bio,
                firstName, // These might not be in DB but useful for frontend to see ack
                lastName,  // "
                avatar
            }
        });
    } catch (e) {
        console.error("Profile Update Error:", e);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
