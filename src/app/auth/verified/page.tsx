'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function VerifiedPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] dark:bg-slate-950 px-4 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className={`absolute -top-24 -left-24 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`absolute -bottom-24 -right-24 w-96 h-96 bg-green-400/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            <div className={`max-w-md w-full relative z-10 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-10 text-center relative overflow-hidden">
                    {/* Top Progress Bar Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-green-500 to-orange-500 bg-[length:200%_auto] animate-[gradient_3s_ease_infinite]" />

                    <div className="mb-8 relative flex justify-center">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center relative animate-[bounce-subtle_4s_ease-in-out_infinite]">
                            <span className="text-green-600 dark:text-green-400 text-5xl font-bold">Z</span>

                            {/* Sparkles around the circle */}
                            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-orange-400 animate-pulse" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border-4 border-green-500/20 animate-ping" />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                        Електронну пошту <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">підтверджено!</span>
                    </h1>

                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                        Тепер ви можете користуватися всіма можливостями <span className="font-bold text-slate-900 dark:text-white">Zynorvia</span>. <br /> Ласкаво просимо до системи!
                    </p>

                    <div className="space-y-4">
                        <Link href="/login" className="block transform transition-transform hover:scale-[1.02] active:scale-[0.98]">
                            <Button className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg shadow-xl shadow-orange-500/30 group">
                                Увійти зараз
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>

                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium pt-4">
                            © 2026 Zynorvia Inc. Всі права захищені.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
