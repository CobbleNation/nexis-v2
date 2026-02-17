'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, Crown } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function UpgradeModal({ open, onOpenChange, title, description }: UpgradeModalProps) {
    const features = [
        "Необмежена кількість цілей та задач",
        "AI-розкладання цілей на кроки",
        "Поглиблена аналітика та історія",
        "Тижневе та місячне планування",
        "Голосове керування (скоро)",
        "Розумні пріоритети та фільтри"
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] max-w-md p-0 overflow-hidden border-none shadow-2xl">
                {/* Header Background */}
                <div className="bg-zinc-900 dark:bg-zinc-950 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 transform rotate-12">
                        <Crown className="w-40 h-40 text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-12 w-12 bg-orange-500/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 ring-1 ring-orange-500/50">
                            <Crown className="w-6 h-6 text-orange-500" />
                        </div>
                        <DialogTitle className="text-xl font-bold mb-2 text-white">
                            {title || "Розблокуйте повний контроль"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 max-w-xs mx-auto text-sm leading-relaxed">
                            {description || "Ви досягли ліміту безкоштовної версії. Перейдіть на Pro, щоб масштабувати свої досягнення."}
                        </DialogDescription>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-white dark:bg-card space-y-6">
                    <div className="space-y-3">
                        {features.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm group">
                                <div className="h-5 w-5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                                <span className="text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{item}</span>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="flex-col gap-3 sm:gap-0 mt-2">
                        <Button className="w-full h-11 text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]" asChild>
                            <Link href="/pricing" onClick={() => onOpenChange(false)}>
                                Отримати Pro за $5/міс
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
                            Можливо, пізніше
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
