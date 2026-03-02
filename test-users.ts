import { db } from './src/db';
import { users } from './src/db/schema';

async function run() {
    try {
        const allUsers = await db.select().from(users);
        console.log("Users in DB:", allUsers.length);
        if (allUsers.length > 0) {
            console.log("First user:", allUsers[0].id, allUsers[0].email);
        }
    } catch (e: any) {
        console.error(e);
    }
}
run();
