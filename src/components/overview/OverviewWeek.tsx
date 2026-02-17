'use client';

import { motion } from 'framer-motion';
import { Action, Goal, LifeArea } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowUpRight, ArrowRight, ArrowDownRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useData } from '@/lib/store';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OverviewWeekProps {
    filteredActions: Action[];
    filteredGoals: Goal[];
    activeArea: LifeArea | undefined;
    activeColor: string;
}

export function OverviewWeek({ filteredActions, filteredGoals, activeArea, activeColor }: OverviewWeekProps) {
    const { state } = useData();

    // --- 1. RHYTHM (7 Days Activity) ---
    const rhythmData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];

        const tasks = state.actions.filter(a => a.completed && (a.date || '').startsWith(dateStr)).length;
        const habitLogs = state.habitLogs.filter(h => h.date === dateStr && h.completed).length;

        const rawScore = tasks + (habitLogs * 0.5);
        const intensity = Math.min(10, Math.max(1, rawScore));

        return {
            day: d.toLocaleDateString('uk-UA', { weekday: 'short' }),
            intensity: intensity === 1 && rawScore === 0 ? 0.5 : intensity,
            isToday: i === 6,
            date: dateStr
        };
    });

    // --- 2. SPHERES (Trends) ---
    const areaActivity: Record<string, number> = {};
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    state.actions.forEach(a => {
        if (a.completed && a.areaId && new Date(a.date || a.createdAt) > weekAgo) {
            areaActivity[a.areaId] = (areaActivity[a.areaId] || 0) + 1;
        }
    });

    const activeSpheres = state.areas
        .map(area => ({
            ...area,
            score: areaActivity[area.id] || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    const sphereTrends = activeSpheres.map(area => {
        let status: 'up' | 'stable' | 'down' = 'stable';
        let comment = 'Стабільний прогрес';

        if (area.score > 5) {
            status = 'up';
            comment = 'Активний розвиток';
        } else if (area.score < 2) {
            status = 'down';
            comment = 'Потребує уваги';
        }

        return { ...area, status, comment };
    });

    // --- 3. KEY EVENTS ---
    const keyEvents = [
        ...filteredGoals.slice(0, 2).map(g => ({ type: 'goal', text: `Рух по цілі "${g.title}"`, link: '/goals' })),
        ...state.projects.filter(p => p.status === 'completed').slice(0, 1).map(p => ({ type: 'project', text: `Завершено проект "${p.title}"`, link: '/goals' })), // Projects usually under goals/projects
        // Fallback
        { type: 'insight', text: 'Стабільний ритм виконання звичок', link: '/timeline' }
    ].slice(0, 3);

    // --- 4. SOFT SUMMARY ---
    const mostActiveArea = activeSpheres[0];
    const leastActiveArea = state.areas.find(a => !activeSpheres.includes(a as any));

    const summaryText = `Цього тижня ти був найактивніший у сфері "${mostActiveArea?.title || 'Загальне'}". ${leastActiveArea ? `Трохи менше уваги отримала сфера "${leastActiveArea.title}".` : ''}`;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. RHYTHM (Central Block) */}
            <div className="text-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Ритм Тижня</h3>
                <p className="text-2xl font-bold text-foreground">Як розподілялась енергія</p>
            </div>

            <div className="h-56 flex items-end justify-center gap-2 md:gap-4 px-4">
                {rhythmData.map((d, i) => (
                    <Link
                        key={i}
                        href="/timeline" // Ideally filter by date if supported
                        className="flex flex-col items-center gap-2 group relative w-9 sm:w-12 md:w-16 transition-all hover:-translate-y-1 block"
                    >
                        <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-end overflow-hidden h-40">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${d.intensity * 10}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                                className={cn(
                                    "w-full opacity-80 group-hover:opacity-100 transition-all",
                                    d.isToday ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-600"
                                )}
                            />
                        </div>
                        <span className={cn(
                            "text-xs font-bold uppercase transition-colors",
                            d.isToday ? "text-orange-500" : "text-slate-400 group-hover:text-foreground"
                        )}>
                            {d.day}
                        </span>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {/* 2. SPHERES OF THE WEEK */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-slate-400" />
                            Сфери Тижня
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                        {sphereTrends.map(area => (
                            <Link
                                key={area.id}
                                href="/areas" // Or specific area route if exists
                                className="flex items-center justify-between group p-3 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-colors bg-opacity-20", area.color.replace('text-', 'bg-').replace('600', '100'))}>
                                        {area.status === 'up' && <ArrowUpRight className={cn("h-5 w-5", area.color)} />}
                                        {area.status === 'stable' && <ArrowRight className={cn("h-5 w-5", area.color)} />}
                                        {area.status === 'down' && <ArrowDownRight className={cn("h-5 w-5", area.color)} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{area.title}</div>
                                        <div className="text-sm text-slate-500">{area.comment}</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                {/* 3. KEY EVENTS */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-400" />
                            Ключові Події
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                        {keyEvents.map((event, i) => (
                            <Link
                                key={i}
                                href={event.link}
                                className="flex gap-4 p-3 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group"
                            >
                                <div className="h-6 w-6 rounded-full border-2 border-slate-200 dark:border-slate-800 group-hover:border-amber-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                                    <CheckCircle2 className="h-3 w-3 text-slate-400 group-hover:text-amber-500 transition-colors" />
                                </div>
                                <p className="text-sm font-medium leading-relaxed group-hover:text-foreground/80 transition-colors">{event.text}</p>
                            </Link>
                        ))}
                        {keyEvents.length === 0 && (
                            <p className="text-muted-foreground italic pl-3">Спокійний тиждень без значних подій.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 4. SOFT SUMMARY */}
            <div className="mt-8 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl text-center border border-slate-100 dark:border-slate-800">
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
                    {summaryText}
                </p>
            </div>
        </div>
    );
}
