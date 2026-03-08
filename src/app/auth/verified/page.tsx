'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifiedPage() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [countdown, setCountdown] = useState(2);
    const router = useRouter();

    useEffect(() => {
        setIsLoaded(true);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/overview');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950 px-4 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className={`absolute -top-24 -left-24 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`absolute -bottom-24 -right-24 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            <div className={`max-w-md w-full relative z-10 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-10 text-center relative overflow-hidden">
                    {/* Top Progress Bar Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 bg-[length:200%_auto] animate-[gradient_3s_ease_infinite]" />

                    <div className="mb-8 relative flex justify-center">
                        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-3xl flex items-center justify-center relative animate-[bounce-subtle_4s_ease-in-out_infinite]">
                            {/* Diagram Logo (Rotated Square) */}
                            <div className="w-10 h-10 bg-orange-600 rounded-lg rotate-45 shadow-lg shadow-orange-600/20" />

                            {/* Sparkles around the box */}
                            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-orange-400 animate-pulse" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-3xl border-4 border-orange-500/20 animate-ping" />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                        Електронну пошту <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">підтверджено!</span>
                    </h1>

                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed font-medium">
                        Тепер ви можете користуватися всіма можливостями <span className="font-bold text-slate-900 dark:text-white">Zynorvia</span>. <br /> Ласкаво просимо до системи!
                    </p>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-2">
                            <Link href="/overview" className="w-full transform transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                <Button className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-xl shadow-orange-500/30 group">
                                    Перейти в продукт
                                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Ви будете перенаправлені автоматично через <span className="text-orange-600 font-bold">{countdown}</span> сек.
                            </p>
                        </div>

                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium pt-2">
                            © 2026 Zynorvia Inc. Всі права захищені.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
