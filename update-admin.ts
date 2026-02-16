
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        console.log('Updating admin user role...');
        await db.update(users)
            .set({ role: 'admin', subscriptionTier: 'pro' })
            .where(eq(users.email, 'admin@nexis.com'));

        console.log('User updated successfully.');

        const [user] = await db.select().from(users).where(eq(users.email, 'admin@nexis.com'));
        console.log('Updated user:', user);
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

main();
