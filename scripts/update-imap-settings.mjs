import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken,
});

async function updateImapSettings() {
    try {
        console.log("Updating IMAP settings for support and team accounts...");
        // Ensure all accounts use port 993 and secure mode for IMAP
        const rs = await client.execute("UPDATE admin_email_accounts SET imap_host = 'mail.zynorvia.com', imap_port = 993, imap_secure = 1 WHERE address IN ('support@zynorvia.com', 'team@zynorvia.com')");
        console.log("Update successful. Rows affected:", rs.rowsAffected);
    } catch (e) {
        console.error("Update failed:", e);
    }
}

updateImapSettings();
