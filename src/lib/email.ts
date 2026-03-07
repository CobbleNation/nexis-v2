import nodemailer from 'nodemailer';

const isLocal = process.env.EMAIL_HOST === '127.0.0.1' || process.env.EMAIL_HOST === 'localhost';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || (isLocal ? 25 : 465),
    secure: process.env.EMAIL_SECURE === 'true' || (!isLocal && (Number(process.env.EMAIL_PORT) === 465)),
    auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    } : undefined,
    tls: {
        rejectUnauthorized: false
    }
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zynorvia.com';

export async function sendVerificationEmail(email: string, name: string, token: string) {
    const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}`;

    await transporter.sendMail({
        from: `"Zynorvia" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Підтвердження вашого акаунту Zynorvia',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #0f172a;">Вітаємо, ${name}!</h2>
                <p style="color: #475569; line-height: 1.5;">Дякуємо за реєстрацію в Zynorvia. Щоб почати користуватися вашим акаунтом, будь ласка, підтвердіть вашу електронну пошту.</p>
                <div style="margin: 30px 0;">
                    <a href="${verifyUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Підтвердити пошту</a>
                </div>
                <p style="color: #94a3b8; font-size: 12px;">Якщо ви не створювали акаунт у Zynorvia, просто ігноруйте цей лист.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 Zynorvia. Всі права захищені.</p>
            </div>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"Zynorvia" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Відновлення паролю Zynorvia',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #0f172a;">Відновлення паролю</h2>
                <p style="color: #475569; line-height: 1.5;">Ви отримали цей лист, тому що ми отримали запит на скидання паролю для вашого акаунту.</p>
                <div style="margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Змінити пароль</a>
                </div>
                <p style="color: #475569; line-height: 1.5;">Посилання для скидання паролю припинить дію через 1 годину.</p>
                <p style="color: #94a3b8; font-size: 12px;">Якщо ви не запитували зміну паролю, ніяких додаткових дій не потрібно.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 Zynorvia. Всі права захищені.</p>
            </div>
        `,
    });
}
