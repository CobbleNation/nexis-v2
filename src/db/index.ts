import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (process.env.NODE_ENV === 'production' && !url) {
    throw new Error('TURSO_DATABASE_URL is required in production');
}

const client = createClient({
    url: url || 'file:sqlite.db',
    authToken,
});

export const db = drizzle(client, { schema });
