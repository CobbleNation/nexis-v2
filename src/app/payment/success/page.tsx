'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Optional: verify payment status via API call here if needed
        const timer = setTimeout(() => {
            router.push('/overview');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1121] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-md border-border/40 shadow-lg text-center overflow-hidden">
                    <div className="h-2 bg-green-500 w-full" />
                    <CardHeader className="pt-10 pb-2">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">Оплата Успішна!</CardTitle>
                        <CardDescription>
                            Дякуємо за підписку на Nexis Pro.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6">
                        <p className="text-muted-foreground">
                            Ваш аккаунт було успішно оновлено. Ви будете автоматично перенаправлені на головну сторінку через декілька секунд.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-8">
                        <Button
                            onClick={() => router.push('/overview')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Перейти до Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
