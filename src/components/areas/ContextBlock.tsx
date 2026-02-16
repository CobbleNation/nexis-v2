'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, Activity, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContextBlockProps {
    overallScore?: number; // 0-100 placeholder for "focus level" or similar
    message?: string;
}

export function ContextBlock({ overallScore = 78, message = "Загалом рух стабільний, але декілька сфер потребують уваги." }: ContextBlockProps) {
    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-gradient-to-r from-orange-50 to-white dark:from-card dark:to-card border border-orange-100 dark:border-orange-900/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
            >
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" />
                            Картина Зараз
                        </span>
                        <span className="text-muted-foreground/60 text-sm">
                            {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                        {message}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                            <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            Загальний стан
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger>
                                    <Info className="w-3.5 h-3.5 text-orange-400 hover:text-orange-600 transition-colors cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    align="start"
                                    className="max-w-xs bg-white/95 dark:bg-popover/95 backdrop-blur-md border-orange-100 dark:border-border text-foreground p-5 shadow-xl rounded-2xl"
                                >
                                    <p className="font-bold text-orange-800 dark:text-orange-400 mb-2">Як це працює?</p>
                                    <p className="mb-3 text-sm text-foreground/80 leading-relaxed">
                                        Це зважена оцінка всіх сфер життя (0-100%). Вона враховує вашу активність та динаміку метрик.
                                    </p>
                                    <div className="bg-orange-50 dark:bg-card p-3 rounded-xl border border-orange-100 dark:border-border">
                                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">
                                            Як покращити:
                                        </p>
                                        <p className="text-xs text-orange-600 dark:text-muted-foreground">
                                            Виконуйте дії регулярно та слідкуйте за позитивною динамікою показників.
                                        </p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                            :
                        </div>
                        <div className="w-32 h-2.5 bg-orange-100 dark:bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${overallScore}%` }} />
                        </div>
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{overallScore}%</span>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute left-10 bottom-0 w-32 h-32 bg-yellow-200/20 rounded-full blur-2xl translate-y-1/2" />
            </motion.div>
        </TooltipProvider>
    );
}
