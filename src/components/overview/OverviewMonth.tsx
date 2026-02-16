'use client';

import { Action, Goal, LifeArea, Habit } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, TrendingUp, Layers, Activity } from 'lucide-react';
import { useData } from '@/lib/store';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface OverviewMonthProps {
    filteredActions: Action[];
    filteredGoals: Goal[];
    activeArea: LifeArea | undefined;
    activeColor: string;
}

export function OverviewMonth({ filteredActions, filteredGoals, activeArea, activeColor }: OverviewMonthProps) {
    const { state } = useData();

    // --- 1. MONTH MAP (Mock Visual) ---
    const monthMapData = Array.from({ length: 15 }).map((_, i) => ({
        day: i,
        value: 20 + Math.random() * 30 + (i > 5 && i < 10 ? 40 : 0)
    }));

    // --- 2. METRIC CHANGES (Core) ---
    const metrics = [
        { label: 'Продуктивність', trend: 'up' },
        { label: 'Рівень стресу', trend: 'down' },
        { label: 'Якість сну', trend: 'stable' }
    ];

    // --- 3. GOAL PROGRESS (Qualitative) ---
    const activeGoals = filteredGoals.filter(g => g.status !== 'completed').slice(0, 3);
    const getGoalStatus = (progress: number) => {
        if (progress > 50) return { label: 'Активний рух', color: 'text-green-500' };
        if (progress > 20) return { label: 'Стабільний', color: 'text-amber-500' };
        return { label: 'Повільний', color: 'text-slate-400' };
    };

    // --- 4. HABIT STABILITY ---
    const habits = state.habits.slice(0, 4);
    const getHabitGroup = (streak: number) => {
        if (streak > 20) return 'Регулярні';
        if (streak > 0) return 'Нестабільні';
        return 'На паузі';
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500">

            {/* 1. MONTH MAP header */}
            <Link href="/insights" className="block group">
                <div className="relative h-48 w-full bg-slate-50 dark:bg-slate-900/30 rounded-3xl overflow-hidden mb-8 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-800 transition-all">
                    <div className="absolute top-6 left-6 z-10">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors">Карта Місяця</h3>
                        <p className="text-xl font-bold text-foreground">Динаміка і Піки</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30 group-hover:opacity-40 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthMapData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#f97316" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 2. METRIC CHANGES */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Зміни Метрик
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                        {metrics.map((m, i) => (
                            <Link key={i} href="/insights" className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 flex transition-all group">
                                <span className="font-medium group-hover:text-blue-600 transition-colors">{m.label}</span>
                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                                    {m.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-500" />}
                                    {m.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-500" />}
                                    {m.trend === 'stable' && <Minus className="h-4 w-4 text-slate-400" />}
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                {/* 3. GOAL PROGRESS */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                            Прогрес Цілей
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                        {activeGoals.map(goal => {
                            const status = getGoalStatus(goal.progress);
                            return (
                                <Link key={goal.id} href="/goals" className="block p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group">
                                    <div className="font-bold mb-1 truncate group-hover:text-orange-500 transition-colors">{goal.title}</div>
                                    <div className={`text-sm font-medium ${status.color}`}>
                                        {status.label}
                                    </div>
                                </Link>
                            );
                        })}
                        {activeGoals.length === 0 && <p className="text-muted-foreground italic">Немає стратегічних цілей.</p>}
                    </CardContent>
                </Card>

                {/* 4. HABIT STABILITY */}
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Layers className="h-5 w-5 text-purple-500" />
                            Стабільність
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-4">
                        <div className="space-y-2">
                            {habits.map(h => (
                                <Link key={h.id} href="/goals" className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">{h.title}</span>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">
                                        {getHabitGroup(h.streak)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
