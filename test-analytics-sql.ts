
import { db } from './src/db';
import { users, actions, analyticsEvents } from './src/db/schema';
import { sql, count } from 'drizzle-orm';

async function main() {
    try {
        console.log('--- Testing Overview Query ---');
        const [totalUsersRes] = await db.select({ count: count() }).from(users);
        console.log('Total Users:', totalUsersRes?.count);

        console.log('--- Testing Timeseries Query ---');
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 30);

        const dailyStats = await db.select({
            date: sql<string>`strftime('%Y-%m-%d', datetime(${analyticsEvents.createdAt} / 1000, 'unixepoch'))`,
            tasks_created: sql<number>`sum(case when ${analyticsEvents.eventName} = 'task_created' then 1 else 0 end)`,
            active_users: sql<number>`count(distinct ${analyticsEvents.userId})`
        })
            .from(analyticsEvents)
            .where(sql`${analyticsEvents.createdAt} >= ${from} AND ${analyticsEvents.createdAt} <= ${to}`)
            .groupBy(sql`strftime('%Y-%m-%d', datetime(${analyticsEvents.createdAt} / 1000, 'unixepoch'))`)
            .limit(5);

        console.log('Timeseries Data:', dailyStats);

    } catch (error) {
        console.error('SQL Error:', error);
    }
}

main();
