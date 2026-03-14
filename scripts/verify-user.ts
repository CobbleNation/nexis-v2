import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifyUser() {
    const email = 'denyspypko@gmail.com';
    console.log(`Verifying user: ${email}...`);
    
    try {
        const result = await db.update(users)
            .set({ emailVerified: new Date() })
            .where(eq(users.email, email));
            
        console.log('User verified successfully!');
    } catch (err) {
        console.error('Failed to verify user:', err);
    }
}

verifyUser();
