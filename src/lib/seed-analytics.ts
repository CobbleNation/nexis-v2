import { db } from '@/db';
import { trackEvent } from '@/lib/analytics-server';
import { v4 as uuidv4 } from 'uuid';
import { analyticsEvents, users } from '@/db/schema';

// This script generates fake analytics data for the last 30 days
async function seedAnalytics() {
    console.log('Seeding analytics data...');

    const today = new Date();
    const actions = ['task_created', 'task_completed', 'habit_checked', 'goal_created'];
    const plans = ['free', 'pro'];

    // Fetch a real user
    const [user] = await db.select().from(users).limit(1);
    const seedUserId = user?.id; // Use existing user or null if none (set null allowed in schema? check schema)

    // Schema says userId references users.id on delete set null, so it is nullable.
    // However, for realistic data we want a user.
    if (!seedUserId) {
        console.log("No users found to seed analytics for.");
        return;
    }

    // Generate ~500 events distributed over 30 days
    for (let i = 0; i < 500; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const eventDate = new Date();
        eventDate.setDate(today.getDate() - daysAgo);

        const eventName = actions[Math.floor(Math.random() * actions.length)] as any;
        const plan = plans[Math.floor(Math.random() * plans.length)] as any;

        // Directly inserting to override createdAt
        await db.insert(analyticsEvents).values({
            id: uuidv4(),
            userId: seedUserId,
            // sessionId: ... 
            eventName,
            // entityType ...
            plan,
            source: 'web',
            createdAt: eventDate
        });
    }

    console.log('Seeding complete!');
}

seedAnalytics().catch(console.error);
