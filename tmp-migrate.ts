import { createClient } from '@libsql/client';

async function migrate() {
    const client = createClient({
        url: "libsql://nexis-prod-cobblenation.aws-ap-northeast-1.turso.io",
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEyNTcxMDIsImlkIjoiMGUzNmQ1OTItM2YyYy00MjUzLTgxMjgtZTMwOWEzYzk3NjQ4IiwicmlkIjoiYjg4MmFiZjMtNDFjNi00ZTg0LWI4NzAtZGIxMGZhOWY4N2MyIn0.0sc4Hz0D58EgcGkgIQJR-Ah3CrHFtfMm_MAeZU48TkAEtB6apDA-AZVH0Z1FRX5N7Z2V2KhX3lU8bQuOhY-_DA"
    });

    try {
        console.log('Adding subscription_expires_at column...');
        await client.execute('ALTER TABLE users ADD COLUMN subscription_expires_at INTEGER;');
        console.log('Successfully added column.');
    } catch (err) {
        if ((err as any).message?.includes('duplicate column name')) {
            console.log('Column already exists.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        client.close();
    }
}

migrate();
