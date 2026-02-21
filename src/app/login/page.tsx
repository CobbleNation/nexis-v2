'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Assuming a label component exists or standard label
import { Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user, isLoading } = useAuth();
    const router = useRouter();

    // If user is already authenticated, redirect to app
    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/overview');
        }
    }, [isLoading, user, router]);

    // Show loading while checking auth state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    // If user is already logged in, show brief state before redirect
    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login({ email, password });
            toast.success('З поверненням!');
        } catch (err: any) {
            let message = "Виникла помилка при вході. Спробуйте ще раз.";
            if (err.message === 'Invalid credentials') {
                message = "Невірна пошта або пароль. Перевірте дані та спробуйте ще раз.";
            } else if (err.message === 'Internal Server Error') {
                message = "Сталася помилка сервера. Будь ласка, спробуйте пізніше.";
            }
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-3xl shadow-xl p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mx-auto mb-6">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">З поверненням</h1>
                    <p className="text-muted-foreground">Увійдіть, щоб продовжити роботу з Zynorvia.</p>
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
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-bold text-muted-foreground">Пароль</label>
                            <Link href="/forgot-password" className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400">Забули пароль?</Link>
                        </div>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all font-medium placeholder:text-gray-400/50"
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl text-base font-bold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-white">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Увійти'}
                    </Button>
                </form>

                <div className="text-center text-sm font-medium text-muted-foreground">
                    Немає акаунту? <Link href="/register" className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 font-bold transition-colors">Створити</Link>
                </div>
            </div>
        </div>
    );
}
