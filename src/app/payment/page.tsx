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
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/billing/checkout', { method: 'POST' });
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

                                <CardContent className="p-8 space-y-6">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-blue-900 dark:text-blue-200">Безпечний платіж через Monobank</p>
                                            <p className="text-blue-700/80 dark:text-blue-400/80 mt-1">
                                                Ми перенаправимо вас на захищену сторінку оплати Monobank. Ваші платіжні дані не зберігаються на наших серверах.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <Button
                                            size="lg"
                                            className="w-full h-14 text-lg font-bold bg-black hover:bg-zinc-800 text-white shadow-lg shadow-black/10 flex items-center justify-center gap-3"
                                            onClick={handlePayment}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                'Обробка...'
                                            ) : (
                                                <>
                                                    <CreditCard className="w-5 h-5" />
                                                    Оплатити через Monobank
                                                </>
                                            )}
                                        </Button>
                                        <div className="text-center text-xs text-muted-foreground">
                                            Apple Pay / Google Pay / Картка
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
                                            <h4 className="font-bold text-lg">Nexis Pro</h4>
                                            <p className="text-sm text-muted-foreground">Щомісячна підписка</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-lg">199 ₴</span>
                                            <p className="text-xs text-muted-foreground">/ місяць</p>
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
                                            <span>199 ₴</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-muted-foreground">Податки</span>
                                            <span>0 ₴</span>
                                        </div>
                                        <Separator className="my-4" />
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span>Всього до сплати</span>
                                            <span className="text-orange-600">199 ₴</span>
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
