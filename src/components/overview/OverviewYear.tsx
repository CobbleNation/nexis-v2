'use client';

import { Action, Goal, LifeArea } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Flag, TrendingUp, Shuffle, Anchor, CheckCircle2 } from 'lucide-react';
import { useData } from '@/lib/store';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OverviewYearProps {
    filteredActions: Action[];
    filteredGoals: Goal[];
    activeArea: LifeArea | undefined;
    activeColor: string;
}

export function OverviewYear({ filteredGoals, activeArea }: OverviewYearProps) {
    const { state } = useData();

    // --- 1. ANNUAL SUMMARY (Auto text) ---
    const summaryText = "Цей рік був про пошук балансу між роботою та особистим розвитком. Основний фокус змістився у сферу створення контенту та здоровʼя.";

    // --- 2. FOCUS DYNAMICS ---
    const focusType = 'Стабільний';

    // --- 3. SPHERE TRENDS (Direction) ---
    const sphereTrends = state.areas.slice(0, 3).map(a => ({
        ...a,
        trend: 'Зростання'
    }));

    // --- 4. MAJOR CHANGES (Milestones) ---
    const majorChanges = [
        { title: 'Запуск Zynorvia 2.0', desc: 'Персональна система', type: 'project', link: '/projects' },
        { title: 'Новий рівень фінансів', desc: 'Досягнуто цілі', type: 'goal', link: '/goals' },
        { title: 'Зміна режиму дня', desc: 'Ранні підйоми', type: 'habit', link: '/timeline' }
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-500">

            {/* 1. HERO BLOCK (Meaning) */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-10 md:p-16 text-center shadow-xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/noise.png')]"></div>
                <Compass className="h-12 w-12 text-orange-400 mx-auto mb-6 opacity-80" />

                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
                    {summaryText}
                </h2>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm font-medium hover:bg-white/20 transition-colors cursor-default">
                    <span className="text-slate-400">Динаміка фокусу:</span>
                    <span className="text-orange-400 uppercase tracking-widest text-xs font-bold">{focusType}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* 2. SPHERE DIRECTIONS */}
                <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200 uppercase tracking-widest text-sm">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Тренд Року
                    </h3>
                    <div className="space-y-4">
                        {sphereTrends.map(area => (
                            <Link key={area.id} href="/areas" className="block group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:border-blue-100 dark:hover:border-blue-900">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xl font-bold group-hover:text-blue-600 transition-colors">{area.title}</span>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110", area.color.replace('text-', 'bg-').replace('600', '100'))}>
                                        <TrendingUp className={cn("h-4 w-4", area.color)} />
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                    Напрямок: <span className="text-foreground font-bold">{area.trend}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* 3. MAJOR CHANGES */}
                <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200 uppercase tracking-widest text-sm">
                        <Flag className="h-5 w-5 text-red-500" />
                        Переломні Моменти
                    </h3>
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-8 py-2 space-y-10">
                        {majorChanges.map((change, i) => (
                            <div key={i} className="relative group">
                                <div className="absolute -left-[41px] top-1 h-6 w-6 rounded-full border-4 border-white dark:border-slate-950 bg-slate-400 group-hover:bg-red-500 transition-colors" />
                                <Link href={change.link || '#'} className="block hover:translate-x-1 transition-transform">
                                    <h4 className="text-lg font-bold group-hover:text-red-500 transition-colors">{change.title}</h4>
                                    <p className="text-slate-500 font-medium">{change.desc}</p>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
