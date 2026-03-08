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
// Force https for production domain
const BASE_URL = APP_URL.includes('zynorvia.com') ? APP_URL.replace('http://', 'https://') : APP_URL;

export async function sendVerificationEmail(email: string, name: string, token: string) {
    const verifyUrl = `${BASE_URL}/api/auth/verify?token=${token}`;

    await transporter.sendMail({
        from: `"Zynorvia" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Підтвердження вашого акаунту Zynorvia',
        html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; padding: 12px; background-color: #ea580c; border-radius: 16px;">
                        <span style="color: white; font-weight: 800; font-size: 24px;">Z</span>
                    </div>
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-top: 16px;">Zynorvia</h1>
                </div>
                
                <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Вітаємо, ${name}!</h2>
                
                <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                    Дякуємо за реєстрацію в Zynorvia. Ми раді, що ви з нами! Щоб почати користуватися вашою персональною екосистемою, просто підтвердіть свою пошту.
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${verifyUrl}" style="background-color: #ea580c; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">
                        Підтвердити пошту
                    </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 14px; margin-top: 32px; text-align: center;">
                    Якщо ви не створювали акаунт у Zynorvia, просто ігноруйте цей лист.
                </p>
                
                <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 24px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">© 2026 Zynorvia Inc. Всі права захищені.</p>
                    <p style="color: #cbd5e1; font-size: 10px;">Це автоматичне повідомлення, на нього не потрібно відповідати.</p>
                </div>
            </div>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"Zynorvia" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Відновлення паролю Zynorvia',
        html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; padding: 12px; background-color: #ea580c; border-radius: 16px;">
                        <span style="color: white; font-weight: 800; font-size: 24px;">Z</span>
                    </div>
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-top: 16px;">Zynorvia</h1>
                </div>
                
                <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Відновлення паролю</h2>
                
                <p style="color: #475569; line-height: 1.6; font-size: 16px; margin-bottom: 24px;">
                    Ми отримали запит на скидання паролю для вашого акаунту Zynorvia. Якщо ви не робили цього запиту, просто проігноруйте цей лист.
                </p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);">
                        Змінити пароль
                    </a>
                </div>
                
                <p style="color: #ea580c; font-size: 14px; font-weight: 600; text-align: center; margin-bottom: 32px;">
                    Важливо: посилання дійсне протягом 1 години.
                </p>
                
                <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; padding-top: 24px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">© 2026 Zynorvia Inc. Всі права захищені.</p>
                </div>
            </div>
        `,
    });
}
