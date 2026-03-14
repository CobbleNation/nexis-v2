import { db } from './src/db';
import { users, lifeAreas, goals, actions, habits } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testGeneration() {
    try {
        console.log("Testing Generation DB Inserts...");
        const userId = "test-user-" + Date.now();
        console.log(`Using mock userId: ${userId}`);

        // 1. Create mock user to satisfy foreign keys
        await db.insert(users).values({
            id: userId,
            email: `test-${Date.now()}@example.com`,
            name: "Test User",
            passwordHash: "mock-hash",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const realAreaId = uuidv4();
        await db.insert(lifeAreas).values({
            id: realAreaId,
            userId,
            title: "Test Area",
            color: "#4F46E5",
            icon: "Layout",
            order: 0
        });

        const realGoalId = uuidv4();
        await db.insert(goals).values({
            id: realGoalId,
            userId,
            areaId: realAreaId,
            title: "Test Goal",
            description: "Test Desc",
            type: "strategic",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await db.insert(actions).values({
            id: uuidv4(),
            userId,
            areaId: realAreaId,
            linkedGoalId: realGoalId,
            title: "Test Task",
            type: "task",
            status: "pending",
            priority: "medium",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await db.insert(habits).values({
            id: uuidv4(),
            userId,
            title: "Test Habit",
            frequency: "daily",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log("All inserts succeeded!");
    } catch (err) {
        console.error("Insert failed:", err);
    }
}

testGeneration();
