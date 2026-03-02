import { db } from './src/db/index';
import { actions } from './src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function run() {
    try {
        const myTask = await db.select().from(actions).where(eq(actions.id, 'test-task-api-1234'));
        console.log('Found mock task?', myTask.length > 0);
        if (myTask.length > 0) {
            console.log('Task Details:', myTask[0]);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
