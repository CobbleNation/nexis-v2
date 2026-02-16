'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FocusMetrics } from '@/lib/metrics';
import { Lock } from 'lucide-react';
import { UpgradeModal } from '../common/UpgradeModal';
import { FocusInfluencersModal } from './FocusInfluencersModal';
import { DailyReviewDialog } from '@/components/features/DailyReviewDialog';
import { useSubscription } from '@/hooks/useSubscription';
import { useData } from '@/lib/store';
import { getDailyDataRange, analyzeCorrelation, CorrelationResult } from '@/lib/analytics';
import { useMemo, useState } from 'react';

interface ContextStateProps {
    score: number;
    metrics?: FocusMetrics;
    period: string;
    areaName?: string;
    activeColor?: string;
}

export function ContextState({ score, metrics, period, areaName, activeColor }: ContextStateProps) {
    const { isPro } = useSubscription();
    const { state } = useData();
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showInfluencers, setShowInfluencers] = useState(false);

    // Calculate Drivers (Only if Pro)
    const drivers = useMemo(() => {
        if (!isPro) return [];

        const dailyData = getDailyDataRange(state, 30);
        const results: CorrelationResult[] = [];

        // Correlate Routines with Focus Minutes (or Mood if Focus is missing)
        // We use 'focusMinutes' as the target metric for "Focus Level" context
        state.routines.forEach(r => {
            // Try correlating with Focus Minutes
            let res = analyzeCorrelation(dailyData, 'routine', r.id, 1, 'focusMinutes', 'minutes', r.title, 'Фокус');
            if (res) results.push(res);

            // Also try correlating with Mood as a proxy for "State"
            res = analyzeCorrelation(dailyData, 'routine', r.id, 1, 'mood', 'mood', r.title, 'Настрій');
            if (res) results.push(res);
        });

        // Filter out duplicates (same routine might correlate with both) and pick top 3
        const uniqueParams = new Set();
        return results.filter(r => {
            const key = r.variableX;
            if (uniqueParams.has(key)) return false;
            uniqueParams.add(key);
            return true;
        }).sort((a, b) => Math.abs(b.impactPercent) - Math.abs(a.impactPercent)).slice(0, 5);

    }, [isPro, state]);

    const handleInfluenceClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPro) {
            setShowInfluencers(true);
        } else {
            setShowUpgrade(true);
        }
    };

    const getScoreColor = (s: number) => {
        if (s >= 85) return "text-orange-600"; // User wanted orange for high score
        if (s >= 50) return "text-emerald-500";
        return "text-red-500"; // Low score warning
    };

    // Translate period to Ukrainian
    const periodMap: Record<string, string> = {
        'day': 'День',
        'week': 'Тиждень',
        'month': 'Місяць',
        'year': 'Рік'
    };

    const translatedPeriod = periodMap[period.toLowerCase()] || period;

    // Default mock details if no metrics provided
    const details = metrics ? metrics.details : {
        focus: "Дані відсутні",
        goals: "Дані відсутні",
        spheres: "Дані відсутні",
        time: "Дані відсутні"
    };

    const breakdown = metrics ? metrics.breakdown : { focus: 0, goals: 0, spheres: 0, time: 0 };

    return (
        <div className="flex items-center justify-between w-full mt-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className={cn("w-2 h-2 rounded-full animate-pulse", activeColor || "bg-slate-400")} />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        {translatedPeriod} · {areaName || "Система"}
                    </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {areaName ? `Фокус: ${areaName}` : "Огляд Системи"}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <DailyReviewDialog />
                <TooltipProvider delayDuration={0} skipDelayDuration={500}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-end cursor-help group relative" id="focus-level-card">
                                <div className="flex items-center gap-3">
                                    {/* Locked Explanation Trigger */}
                                    <button
                                        onClick={handleInfluenceClick}
                                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-xs font-medium text-zinc-500 dark:text-zinc-400"
                                    >
                                        {!isPro && <Lock className="w-3 h-3" />}
                                        <Activity className="w-3 h-3" />
                                        <span>Що вплинуло?</span>
                                    </button>

                                    <div className="flex items-center gap-2" id="onboarding-context-score">
                                        <span className={cn("text-5xl font-extrabold tabular-nums transition-colors duration-300", getScoreColor(score))}>
                                            {score}
                                        </span>
                                        <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-card border border-slate-100 dark:border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors shadow-sm">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 mt-1">Рівень Фокусу</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="p-0 border border-orange-100 dark:border-orange-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-popover text-zinc-900 dark:text-foreground max-w-sm overflow-hidden rounded-2xl" align="start" sideOffset={15}>
                            <div className="flex flex-col">
                                {/* Narrative Header */}
                                <div className="p-5 bg-gradient-to-br from-orange-50/80 to-white/50 dark:from-orange-950/20 dark:to-background border-b border-orange-100/50 dark:border-orange-900/20">
                                    <h4 className={cn("text-lg font-bold mb-2 tracking-tight flex items-center gap-2 text-orange-950 dark:text-orange-100")}>
                                        {metrics?.state?.title || "Аналіз стану"}
                                    </h4>
                                    <p className="text-sm text-zinc-600 dark:text-muted-foreground leading-relaxed font-normal">
                                        {metrics?.state?.description || "Система аналізує твої показники..."}
                                    </p>
                                </div>

                                {/* Breakdown */}
                                <div className="p-5 bg-white dark:bg-card space-y-4">
                                    <div className="flex justify-between items-center text-sm group">
                                        <span className="text-zinc-500 dark:text-muted-foreground font-medium group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Фокус (35%)</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-20 bg-orange-50 dark:bg-secondary rounded-full overflow-hidden border border-orange-100/50 dark:border-border">
                                                <div className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" style={{ width: `${breakdown.focus}%` }} />
                                            </div>
                                            <span className="font-mono text-xs text-zinc-400 font-bold w-6 text-right">{breakdown.focus}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm group">
                                        <span className="text-zinc-500 dark:text-muted-foreground font-medium group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Цілі (30%)</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-20 bg-orange-50 dark:bg-secondary rounded-full overflow-hidden border border-orange-100/50 dark:border-border">
                                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${breakdown.goals}%` }} />
                                            </div>
                                            <span className="font-mono text-xs text-zinc-400 font-bold w-6 text-right">{breakdown.goals}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm group">
                                        <span className="text-zinc-500 dark:text-muted-foreground font-medium group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Сфери (20%)</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-20 bg-orange-50 dark:bg-secondary rounded-full overflow-hidden border border-orange-100/50 dark:border-border">
                                                <div className="h-full bg-orange-300 rounded-full" style={{ width: `${breakdown.spheres}%` }} />
                                            </div>
                                            <span className="font-mono text-xs text-zinc-400 font-bold w-6 text-right">{breakdown.spheres}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm group">
                                        <span className="text-zinc-500 dark:text-muted-foreground font-medium group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Час (15%)</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-20 bg-orange-50 dark:bg-secondary rounded-full overflow-hidden border border-orange-100/50 dark:border-border">
                                                <div className="h-full bg-orange-200 rounded-full" style={{ width: `${breakdown.time}%` }} />
                                            </div>
                                            <span className="font-mono text-xs text-zinc-400 font-bold w-6 text-right">{breakdown.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title="Аналіз факторів (Pro)"
                description="Ти бачиш результат, але не причину. Pro показує, що саме тягне твій день вниз і як це виправити."
            />

            <FocusInfluencersModal
                open={showInfluencers}
                onOpenChange={setShowInfluencers}
                drivers={drivers}
            />
        </div>
    );
}
