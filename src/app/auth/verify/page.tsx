'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function VerifyContent() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const handleVerify = async () => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Токен відсутній або недійсний.');
            return;
        }

        setStatus('loading');
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Помилка верифікації');
            }

            setStatus('success');
            toast.success('Акаунт успішно підтверджено!');

            // Redirect after a short delay
            setTimeout(() => {
                router.push('/auth/verified');
            }, 2000);
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Сталась помилка під час підтвердження.');
            toast.error(error.message);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto">
            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center space-y-6"
                    >
                        <div className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-950/30 rounded-3xl flex items-center justify-center mb-8">
                            <ShieldCheck className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Підтвердження
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                Натисніть кнопку нижче, щоб активувати ваш акаунт у Zynorvia.
                            </p>
                        </div>

                        <Button
                            onClick={handleVerify}
                            className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Підтвердити Пошту
                        </Button>
                    </motion.div>
                )}

                {status === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 space-y-4"
                    >
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-orange-600" />
                        <p className="text-slate-500 font-medium animate-pulse">Перевірка токена...</p>
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Готово!</h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Акаунт активовано. Зараз ви будете перенаправлені...
                            </p>
                        </div>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-6"
                    >
                        <div className="mx-auto w-20 h-20 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Помилка</h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                {errorMessage}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/login')}
                            className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800"
                        >
                            Повернутися до входу
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] dark:bg-slate-950 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.05),transparent)] pointer-events-none" />

            <div className="relative w-full max-w-[440px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-12 overflow-hidden">
                {/* Visual accents */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 opacity-20" />

                <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>}>
                    <VerifyContent />
                </Suspense>
            </div>
        </div>
    );
}
