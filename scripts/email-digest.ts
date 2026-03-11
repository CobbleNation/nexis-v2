import * as dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users, actions, goals, calendarEvents, projects } from '../src/db/schema';
import { eq, and, lte, gte, isNotNull } from 'drizzle-orm';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});
const db = drizzle(client);

const isLocal = process.env.EMAIL_HOST === '127.0.0.1' || process.env.EMAIL_HOST === 'localhost';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || (isLocal ? 25 : 465),
    secure: process.env.EMAIL_SECURE === 'true' || (!isLocal && (Number(process.env.EMAIL_PORT) === 465)),
    auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    } : undefined,
    tls: { rejectUnauthorized: false }
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zynorvia.com';
const BASE_URL = APP_URL.replace(/\/$/, '').includes('zynorvia.com') && !APP_URL.startsWith('https://')
    ? `https://${APP_URL.replace('http://', '').replace(/\/$/, '')}`
    : APP_URL.replace(/\/$/, '');

interface DigestItem {
    emoji: string;
    title: string;
    detail: string;
    link?: string;
}

function buildDigestHtml(userName: string, items: DigestItem[]): string {
    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <span style="font-size: 20px; line-height: 1.4;">${item.emoji}</span>
                    <div>
                        <div style="font-weight: 600; color: #0f172a; font-size: 14px;">${item.title}</div>
                        <div style="color: #64748b; font-size: 13px; margin-top: 2px;">${item.detail}</div>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');

    return `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; padding: 12px; background-color: rgba(234, 88, 12, 0.1); border-radius: 16px;">
                    <div style="width: 24px; height: 24px; background-color: #ea580c; border-radius: 4px; transform: rotate(45deg); margin: 6px;"></div>
                </div>
                <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-top: 16px;">Zynorvia</h1>
            </div>

            <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 8px;">Привіт, ${userName}! 👋</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                Ось що потребує вашої уваги сьогодні:
            </p>

            <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 16px; overflow: hidden;">
                ${itemsHtml}
            </table>

            <div style="text-align: center; margin: 32px 0;">
                <a href="${BASE_URL}" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">
                    Відкрити Zynorvia
                </a>
            </div>

            <div style="border-top: 1px solid #f1f5f9; margin-top: 32px; padding-top: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">© 2026 Zynorvia Inc. Всі права захищені.</p>
                <p style="color: #cbd5e1; font-size: 10px;">Щоб відключити ці листи, зайдіть в Налаштування → Сповіщення.</p>
            </div>
        </div>
    `;
}

async function runDigest() {
    console.log(`[${new Date().toISOString()}] 📧 Email digest check started...`);

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get all active users with email
    const allUsers = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        subscriptionExpiresAt: users.subscriptionExpiresAt,
        subscriptionTier: users.subscriptionTier,
        emailDigest: users.emailDigest,
    }).from(users);

    for (const user of allUsers) {
        try {
            if (!user.email || user.email.includes('@zynorvia.system')) continue;
            // Skip users who have daily digest disabled
            if (!user.emailDigest) continue;

            const digestItems: DigestItem[] = [];

            // 1. Tasks with approaching deadlines (within 24h)
            const urgentTasks = await db.select()
                .from(actions)
                .where(
                    and(
                        eq(actions.userId, user.id),
                        eq(actions.completed, false),
                        isNotNull(actions.dueDate),
                        lte(actions.dueDate, in24h),
                        gte(actions.dueDate, now)
                    )
                );

            for (const task of urgentTasks) {
                const due = new Date(task.dueDate!);
                const hoursLeft = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));
                digestItems.push({
                    emoji: '⏰',
                    title: task.title,
                    detail: hoursLeft <= 1 ? `Дедлайн менше ніж через 1 годину!` : `Дедлайн через ${hoursLeft} год.`,
                    link: `${BASE_URL}/actions`
                });
            }

            // 2. Overdue tasks (past deadline, not completed)
            const overdueTasks = await db.select()
                .from(actions)
                .where(
                    and(
                        eq(actions.userId, user.id),
                        eq(actions.completed, false),
                        isNotNull(actions.dueDate),
                        lte(actions.dueDate, now)
                    )
                );

            if (overdueTasks.length > 0) {
                digestItems.push({
                    emoji: '🔴',
                    title: `${overdueTasks.length} прострочених задач`,
                    detail: overdueTasks.slice(0, 3).map(t => t.title).join(', ') + (overdueTasks.length > 3 ? '...' : ''),
                    link: `${BASE_URL}/actions`
                });
            }

            // 3. Goals with approaching deadlines
            const urgentGoals = await db.select()
                .from(goals)
                .where(
                    and(
                        eq(goals.userId, user.id),
                        eq(goals.status, 'active'),
                        isNotNull(goals.deadline),
                        lte(goals.deadline, in24h),
                        gte(goals.deadline, now)
                    )
                );

            for (const goal of urgentGoals) {
                digestItems.push({
                    emoji: '🎯',
                    title: goal.title,
                    detail: `Дедлайн цілі наближається!`,
                    link: `${BASE_URL}/goals`
                });
            }

            // 4. Projects with approaching deadlines (within 24h)
            const urgentProjects = await db.select()
                .from(projects)
                .where(
                    and(
                        eq(projects.userId, user.id),
                        eq(projects.status, 'active'),
                        isNotNull(projects.deadline),
                        lte(projects.deadline, in24h),
                        gte(projects.deadline, now)
                    )
                );

            for (const project of urgentProjects) {
                digestItems.push({
                    emoji: '📁',
                    title: project.title,
                    detail: `Дедлайн проекту наближається!`,
                    link: `${BASE_URL}/projects`
                });
            }

            // 5. Subscription expiring soon
            if (user.subscriptionTier === 'pro' && user.subscriptionExpiresAt) {
                const expiresAt = new Date(user.subscriptionExpiresAt);
                if (expiresAt <= in24h && expiresAt > now) {
                    digestItems.push({
                        emoji: '💳',
                        title: 'Підписка Pro закінчується',
                        detail: `Ваша підписка закінчується скоро. Переконайтеся, що карта прив\'язана для автоподовження.`,
                        link: `${BASE_URL}/settings`
                    });
                }
            }

            // Only send if there are items to report
            if (digestItems.length === 0) {
                continue;
            }

            console.log(`📨 Sending digest to ${user.email} with ${digestItems.length} items`);

            const html = buildDigestHtml(user.name || 'Користувач', digestItems);

            await transporter.sendMail({
                from: `"Zynorvia" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `🔔 Zynorvia: ${digestItems.length} ${digestItems.length === 1 ? 'нагадування' : 'нагадувань'} на сьогодні`,
                html
            });

            console.log(`✅ Digest sent to ${user.email}`);
        } catch (error) {
            console.error(`💥 Error sending digest to ${user.email}:`, error);
        }
    }
}

async function startDaemon() {
    console.log('🚀 Zynorvia Email Digest Daemon started');

    let isRunning = true;
    const shutdown = () => {
        isRunning = false;
        console.log('\nStopping digest daemon gracefully...');
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Track last sent hour to avoid duplicate sends
    let lastSentHour = -1;

    while (isRunning) {
        try {
            // Get current hour in Kyiv timezone (UTC+2 / UTC+3 for DST)
            const kyivTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }));
            const currentHour = kyivTime.getHours();

            // Send at 8:00 AM and 6:00 PM Kyiv time
            if ((currentHour === 8 || currentHour === 18) && lastSentHour !== currentHour) {
                await runDigest();
                lastSentHour = currentHour;
            }
        } catch (error) {
            console.error('💥 Critical error in digest loop:', error);
        }

        if (!isRunning) break;

        // Check every 5 minutes
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }

    console.log('👋 Digest daemon stopped safely.');
    process.exit(0);
}

startDaemon().catch(err => {
    console.error('💀 Digest daemon failed to start:', err);
    process.exit(1);
});
