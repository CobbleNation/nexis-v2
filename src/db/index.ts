import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Only throw in production runtime, not during build
if (process.env.NODE_ENV === 'production' && !url && !process.env.NEXT_PHASE) {
    console.warn('Warning: TURSO_DATABASE_URL is missing in production environment');
}

const client = createClient({
    url: url || 'file:sqlite.db',
    authToken,
});

export const db = drizzle(client, { schema });
