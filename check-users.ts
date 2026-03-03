import { db } from './src/db';
import { users } from './src/db/schema';

async function main() {
    const allUsers = await db.select({ email: users.email, role: users.role, sub: users.subscriptionTier }).from(users);
    console.log("Users in DB:");
    console.table(allUsers);
    process.exit(0);
}
main();
