'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            toast.error('Token invalid or missing');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Паролі не співпадають');
            return;
        }

        if (password.length < 6) {
            toast.error('Пароль повинен бути не менше 6 символів');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to reset password');

            setIsSuccess(true);
            toast.success('Пароль успішно змінено');
            setTimeout(() => router.push('/login'), 3000);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold">Пароль змінено!</h2>
                <p className="text-muted-foreground">
                    Ваш пароль успішно оновлено. Зараз ви будете перенаправлені на сторінку входу.
                </p>
                <Link href="/login">
                    <Button className="w-full rounded-xl mt-4">
                        Увійти зараз
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400">
                    <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Новий пароль</h1>
                <p className="text-muted-foreground">Введіть новий пароль для вашого акаунту.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Новий пароль</label>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-slate-50 dark:bg-secondary/50 border-transparent focus:bg-white dark:focus:bg-secondary transition-all font-medium placeholder:text-gray-400/50"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground ml-1">Підтвердіть пароль</label>
                    <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-12 rounded-xl bg-slate-50 dark:bg-secondary/50 border-transparent focus:bg-white dark:focus:bg-secondary transition-all font-medium placeholder:text-gray-400/50"
                    />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl text-base font-bold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-white">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Змінити пароль'}
                </Button>
            </form>

            <div className="text-center">
                <Link href="/login" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Повернутися до входу
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-border rounded-3xl shadow-xl p-8 md:p-12">
                <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
