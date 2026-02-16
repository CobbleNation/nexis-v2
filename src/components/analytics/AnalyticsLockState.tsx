'use client';

import { motion } from 'framer-motion';
import { Lock, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { UpgradeModal } from '@/components/common/UpgradeModal';

export function AnalyticsLockState() {
    const [showUpgrade, setShowUpgrade] = useState(false);

    const BENEFITS = [
        { icon: TrendingUp, text: "Тренди та Історія за весь час" },
        { icon: Zap, text: "Аналіз кореляцій та драйверів" },
        { icon: BarChart3, text: "Теплові мапи продуктивності" }
    ];

    return (
        <div className="relative rounded-3xl border border-slate-200 dark:border-border overflow-hidden bg-slate-50/50 dark:bg-card/20 min-h-[400px] flex flex-col items-center justify-center text-center p-8 mt-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}
            />

            <div className="relative z-10 max-w-md mx-auto space-y-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center shadow-inner">
                    <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">Розблокуйте Глибинний Аналіз</h3>
                    <p className="text-muted-foreground">
                        Отримайте доступ до історичних даних, трендів та персональних рекомендацій з Pro підпискою.
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    {BENEFITS.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-card/50 p-2 rounded-lg border border-slate-100 dark:border-border/50">
                            <b.icon className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>{b.text}</span>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={() => setShowUpgrade(true)}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Перейти на Pro
                </Button>
            </div>

            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title="Станьте Майстром Свого Часу"
                description="Аналітика — це ваш компас. Не блукайте наосліп, використовуйте дані для зростання."
            />
        </div>
    );
}
