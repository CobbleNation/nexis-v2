'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function PaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Initialize period from URL if present
    const initialPeriod = searchParams.get('period') || 'month';
    const [period, setPeriod] = useState<string>(initialPeriod);

    // Update period if URL changes (optional but good for consistency)
    useEffect(() => {
        const p = searchParams.get('period');
        if (p) {
            setPeriod(p);
        }
    }, [searchParams]);

    // Use price override if set by admin, otherwise use plan default
    const hasOverride = user?.currentPriceOverride !== null && user?.currentPriceOverride !== undefined;
    const currentAmount = hasOverride
        ? user!.currentPriceOverride! / 100
        : (period === 'year' ? 1990 : (period === 'month' ? 199 : 1)); // 1 UAH for other periods (testing)

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ period })
            });
            if (!res.ok) throw new Error('Checkout failed');

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Monobank
            } else {
                toast.error('Не вдалося отримати посилання на оплату');
                setIsLoading(false);
            }
        } catch (e) {
            console.error(e);
            toast.error('Помилка оплати. Спробуйте пізніше.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1121] text-slate-900 dark:text-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/pricing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Назад до планів
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Payment Form */}
                    <div className="lg:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="border-border/40 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-100/50 dark:bg-slate-900/50 border-b border-border/40 pb-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-2xl font-bold">Оформлення Підписки</CardTitle>
                                            <CardDescription className="mt-1">Оберіть спосіб оплати</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8">
                                    <div className="space-y-6">
                                        {!hasOverride && (
                                            <div className="flex flex-col gap-3">
                                                <Label className="text-sm font-semibold">Термін підписки</Label>
                                                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-fit">
                                                    <button
                                                        onClick={() => setPeriod('month')}
                                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${period === 'month' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-muted-foreground'}`}
                                                    >
                                                        Щомісячно
                                                    </button>
                                                    <button
                                                        onClick={() => setPeriod('year')}
                                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${period === 'year' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-muted-foreground'}`}
                                                    >
                                                        Щорічно
                                                        <span className="text-[10px] bg-green-100 dark:bg-green-900/50 text-green-600 px-1.5 py-0.5 rounded-full font-bold">-15%</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {hasOverride && (
                                            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                                                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-orange-800 dark:text-orange-400">Персональна пропозиція</p>
                                                    <p className="text-xs text-orange-700/70 dark:text-orange-300/60">Для вас встановлено спеціальну ціну на наступний платіж</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex gap-4 border-b border-border w-full">
                                                    <button className="pb-2 border-b-2 border-primary font-semibold text-sm">Рекомендуємо</button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div
                                                    className="group relative flex items-center justify-between p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 cursor-pointer transition-all hover:border-primary/40"
                                                    onClick={handlePayment}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-lg">Онлайн-оплата карткою</p>
                                                            <p className="text-xs text-muted-foreground">GooglePay, ApplePay</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Google_Pay_%28GPay%29_Logo.svg" alt="GPay" className="h-5 w-auto" />
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" alt="Apple Pay" className="h-5 w-auto" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-4 mt-8">
                                                    <Button
                                                        size="lg"
                                                        className="w-full h-14 text-lg font-bold bg-black hover:bg-zinc-900 text-white shadow-lg shadow-black/10 flex items-center justify-center gap-3 rounded-2xl"
                                                        onClick={handlePayment}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? (
                                                            'Обробка...'
                                                        ) : (
                                                            <>
                                                                Перейти до оплати {currentAmount} ₴
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 dark:bg-slate-900/30 px-8 py-6 border-t border-border/40 flex justify-center items-center">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Lock className="w-3 h-3" />
                                        Платежі захищені стандартом PCI DSS
                                    </p>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="sticky top-24"
                        >
                            <Card className="border-border/40 shadow-sm bg-card">
                                <CardHeader>
                                    <CardTitle>Ваше замовлення</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex justify-between items-start pb-6 border-b border-border/40">
                                        <div>
                                            <h4 className="font-bold text-lg">Zynorvia Pro</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {hasOverride ? 'Спеціальна пропозиція' : period === 'year' ? 'Річна підписка' : 'Щомісячна підписка'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-lg">{currentAmount} ₴</span>
                                            <p className="text-xs text-muted-foreground">
                                                / {hasOverride ? 'платіж' : period === 'year' ? 'рік' : 'місяць'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span>Необмежені цілі</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span>AI Інсайти</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span>Розширена аналітика</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border/40">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-muted-foreground">Підсумок</span>
                                            <span>{currentAmount} ₴</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-muted-foreground">Податки</span>
                                            <span>0 ₴</span>
                                        </div>
                                        <Separator className="my-4" />
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span>Всього до сплати</span>
                                            <span className="text-orange-600">{currentAmount} ₴</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>


                            <div className="mt-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-center">
                                <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">
                                    14-денна гарантія повернення коштів. Скасовуйте будь-коли.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-[#0B1121] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        }>
            <PaymentContent />
        </Suspense>
    );
}
