import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: "libsql://zynorvia-prod-cobblenation.aws-ap-northeast-1.turso.io",
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEyNTcxMDIsImlkIjoiMGUzNmQ1OTItM2YyYy00MjUzLTgxMjgtZTMwOWEzYzk3NjQ4IiwicmlkIjoiYjg4MmFiZjMtNDFjNi00ZTg0LWI4NzAtZGIxMGZhOWY4N2MyIn0.0sc4Hz0D58EgcGkgIQJR-Ah3CrHFtfMm_MAeZU48TkAEtB6apDA-AZVH0Z1FRX5N7Z2V2KhX3lU8bQuOhY-_DA",
    } as any,
});
