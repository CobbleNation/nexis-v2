'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, user, isLoading } = useAuth();
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
            await register({ name, email, password });
            toast.success('Акаунт успішно створено!');
        } catch (err: any) {
            let message = "Виникла помилка при реєстрації. Спробуйте ще раз.";
            if (err.message === 'User already exists') {
                message = "Користувач з такою електронною поштою вже існує.";
            } else if (err.message.includes('Invalid data') || err.message === 'Invalid data') {
                message = "Некоректні дані. Перевірте правильність вводу.";
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Створити акаунт</h1>
                    <p className="text-muted-foreground">Почніть організовувати своє життя з Zynorvia.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Повне ім'я</label>
                        <Input
                            type="text"
                            placeholder="Alex Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all font-medium placeholder:text-gray-400/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Електронна пошта</label>
                        <Input
                            type="email"
                            placeholder="alex@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all font-medium placeholder:text-gray-400/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Пароль</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all font-medium placeholder:text-gray-400/50"
                        />
                        <p className="text-xs text-muted-foreground ml-1">Мінімум 8 символів.</p>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl text-base font-bold bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] text-white">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Зареєструватися'}
                    </Button>
                </form>

                <div className="text-center text-sm font-medium text-muted-foreground">
                    Вже маєте акаунт? <Link href="/login" className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 font-bold transition-colors">Увійти</Link>
                </div>
            </div>
        </div>
    );
}
