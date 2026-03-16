// @ts-nocheck
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/db/schema';
import { adminEmailAccounts, adminEmails } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { v4 as uuid } from 'uuid';

// Load .env
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const envLocalPath = path.join(projectRoot, '.env.local');

console.log(`[Sync] Loading env from: ${envLocalPath} and ${envPath}`);
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

if (!process.env.TURSO_DATABASE_URL) {
    console.error('[Sync] CRITICAL: TURSO_DATABASE_URL is not defined!');
}

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});
const db = drizzle(client, { schema });

async function syncAccount(account: any) {
    if (!account.imapHost || !account.username || !account.password) {
        console.log(`[Sync] Skipping ${account.address}: Missing IMAP settings`);
        return;
    }

    console.log(`[Sync] Connecting to ${account.address}...`);

    const imap = new Imap({
        user: account.username,
        password: account.password,
        host: account.imapHost,
        port: account.imapPort || 993,
        tls: account.imapSecure !== false,
        tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise((resolve, reject) => {
        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err: any, box: any) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                // Fetch unseen messages or last 50 for safety
                const fetchRange = '1:*'; 
                const f = imap.fetch(fetchRange, {
                    bodies: '',
                    struct: true,
                    markSeen: false
                });

                f.on('message', (msg: any, seqno: number) => {
                    msg.on('body', (stream: any, info: any) => {
                        simpleParser(stream, async (err: any, parsed: any) => {
                            if (err) return;

                            const messageId = parsed.messageId || `imap-${seqno}-${account.id}`;
                            
                            // Check if already exists
                            const existing = await db.select().from(adminEmails).where(eq(adminEmails.messageId, messageId));
                            if (existing.length > 0) return;

                            console.log(`[Sync] Storing new email: ${parsed.subject}`);

                            await db.insert(adminEmails).values({
                                id: uuid(),
                                accountId: account.id,
                                folder: 'inbox',
                                fromAddress: parsed.from?.value[0]?.address || 'unknown',
                                fromName: parsed.from?.value[0]?.name || null,
                                toAddress: account.address,
                                subject: parsed.subject || '(No Subject)',
                                bodyHtml: parsed.html || null,
                                bodyText: parsed.text || null,
                                isRead: false,
                                messageId: messageId,
                                receivedAt: parsed.date || new Date(),
                                createdAt: new Date()
                            });
                        });
                    });
                });

                f.once('error', (err: any) => {
                    console.error('[Sync] Fetch error:', err);
                });

                f.once('end', () => {
                    console.log(`[Sync] Done fetching for ${account.address}`);
                    imap.end();
                });
            });
        });

        imap.once('error', (err: any) => {
            reject(err);
        });

        imap.once('end', () => {
            resolve(true);
        });

        imap.connect();
    });
}

async function runSync() {
    console.log('🚀 Starting Mail Sync...');
    const accounts = await db.select().from(adminEmailAccounts).where(eq(adminEmailAccounts.isActive, true));
    console.log(`[Sync] Found ${accounts.length} active accounts: ${accounts.map(a => a.address).join(', ')}`);
    
    // Run all in parallel and wait for all to finish/fail
    const results = await Promise.allSettled(accounts.map(account => syncAccount(account)));
    
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`💥 Sync failed for ${accounts[index].address}:`, result.reason);
        }
    });
}

// Simple loop
async function start() {
    while (true) {
        await runSync();
        console.log('😴 Sleeping for 1 minute...');
        await new Promise(r => setTimeout(r, 60000));
    }
}

start();
