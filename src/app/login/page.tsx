'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function LoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const verified = searchParams.get('verified');
        const error = searchParams.get('error');

        console.log('Login Page Params:', { verified, error });

        if (verified === '1') {
            toast.success('Пошту успішно підтверджено! Тепер ви можете увійти.');
            // Clean up URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        } else if (error === 'invalid_token') {
            toast.error('Недійсний або прострочений токен підтвердження.');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [searchParams]);

    // If user is already authenticated, redirect to app
    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/overview');
        }
    }, [isLoading, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login({ email, password });
            toast.success('З поверненням!');
        } catch (err: any) {
            let message = "Виникла помилка при вході. Спробуйте ще раз.";
            if (err.message === 'Email not verified') {
                message = "Будь ласка, підтвердіть свою електронну пошту перед входом. Ми надіслали вам лист із посиланням.";
            } else if (err.message === 'Invalid credentials') {
                message = "Невірна пошта або пароль. Перевірте дані та спробуйте ще раз.";
            } else if (err.message === 'Internal Server Error') {
                message = "Сталася помилка сервера. Будь ласка, спробуйте пізніше.";
            }
            toast.error(message, {
                duration: err.message === 'Email not verified' ? 6000 : 4000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading spinner while checking auth state
    if (isLoading || user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl p-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-600/20">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">З поверненням</h1>
                    <p className="text-muted-foreground">Увійти, щоб продовжити роботу з Zynorvia.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Електронна пошта</label>
                        <Input
                            type="email"
                            placeholder="alex@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-sm font-medium text-foreground">Пароль</label>
                            <Link href="/forgot-password" size="sm" className="text-xs text-orange-600 hover:text-orange-500 font-medium">Забули пароль?</Link>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Увійти'}
                    </Button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Немає акаунту?{' '}
                        <Link href="/register" className="text-orange-600 hover:text-orange-500 font-bold">
                            Створити
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
