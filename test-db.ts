import { db } from './src/db';
import { actions, users } from './src/db/schema';

async function run() {
  try {
    const user = await db.select().from(users).limit(1);
    const userId = user[0]?.id || 'fake';

    const actionData = {
      id: 'test-id-123456',
      title: 'Test Task',
      type: 'task',
      status: 'pending',
      completed: false,
      date: '2026-03-02',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: "extra",
      expectedResult: "extra2"
    };

    // @ts-ignore
    await db.insert(actions).values({ ...actionData, userId }).onConflictDoUpdate({ target: actions.id, set: actionData });
    console.log("Success with real user!");
  } catch (e: any) {
    console.error("Cause:", e.cause);
    console.error("Raw:", e.message);
  }
}
run();
