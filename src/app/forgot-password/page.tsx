'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error('Failed to send reset email');

            setIsSent(true);
            toast.success('Інструкції надіслано на вашу пошту');
        } catch (error) {
            toast.error('Сталася помилка. Спробуйте пізніше.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950 px-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-border rounded-3xl shadow-xl p-8 md:p-12 space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Перевірте пошту</h2>
                    <p className="text-muted-foreground">
                        Ми надіслали інструкції для відновлення паролю на <strong>{email}</strong>
                    </p>
                    <div className="pt-4">
                        <Link href="/login">
                            <Button variant="outline" className="w-full rounded-xl">
                                Повернутися до входу
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-border rounded-3xl shadow-xl p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Забули пароль?</h1>
                    <p className="text-muted-foreground">Введіть емейл, щоб отримати посилання для скидання.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Електронна пошта</label>
                        <Input
                            type="email"
                            placeholder="alex@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-50 dark:bg-secondary/50 border-transparent focus:bg-white dark:focus:bg-secondary transition-all font-medium placeholder:text-gray-400/50"
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl text-base font-bold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-white">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Надіслати посилання'}
                    </Button>
                </form>

                <div className="text-center">
                    <Link href="/login" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Повернутися до входу
                    </Link>
                </div>
            </div>
        </div>
    );
}
