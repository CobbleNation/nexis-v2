'use client';

import { TrendingUp, Activity, Zap, Brain, ArrowUpRight, Scale, Info, CheckCircle2, AlertCircle, Heart, HelpCircle, Calendar, Clock, BarChart3, Grid } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/lib/store';
import { getDailyDataRange, analyzeCorrelation, CorrelationResult, getTrendData, getWeeklyStats, getHeatmapData } from '@/lib/analytics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { AnalyticsLockState } from '@/components/analytics/AnalyticsLockState';
import { useSubscription } from '@/hooks/useSubscription';
import { LIMITS, SUBSCRIPTION_PLAN } from '@/lib/limits';

function InfoBadge({ text }: { text: string }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors ml-1.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-900 border-slate-800 text-slate-100 text-xs p-3 leading-relaxed">
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default function AnalyticsPage() {
    const { state } = useData();
    const { isPro } = useSubscription();
    const dailyData = useMemo(() => getDailyDataRange(state, 60), [state]); // 60 days
    const trendData = useMemo(() => getTrendData(dailyData.slice(0, 14)), [dailyData]);
    const weeklyStats = useMemo(() => getWeeklyStats(dailyData), [dailyData]);
    const heatmapData = useMemo(() => getHeatmapData(dailyData), [dailyData]);

    const [selectedMetricId, setSelectedMetricId] = useState<string>('all');

    // Filter Trend Data for Metric Explorer
    const metricExplorerData = useMemo(() => {
        return dailyData.slice(0, 30).slice().reverse().map(d => ({
            date: d.date.slice(5), // MM-DD
            value: selectedMetricId !== 'all' ? (d.metrics[selectedMetricId] || 0) : 0
        }));
    }, [dailyData, selectedMetricId]);

    // Drivers Logic (Same as before)
    const moodDrivers = useMemo(() => {
        const results: CorrelationResult[] = [];
        state.routines.forEach(r => {
            const res = analyzeCorrelation(dailyData, 'routine', r.id, 1, 'mood', 'mood', r.title, 'Настрій');
            if (res) results.push(res);
        });
        state.metricDefinitions.forEach(m => {
            const res = analyzeCorrelation(dailyData, 'metric', m.id, 1, 'mood', 'mood', m.name, 'Настрій');
            if (res) results.push(res);
        });
        return results.sort((a, b) => Math.abs(b.impactPercent) - Math.abs(a.impactPercent)).slice(0, 3);
    }, [dailyData, state.routines, state.metricDefinitions]);

    const productivityDrivers = useMemo(() => {
        const results: CorrelationResult[] = [];
        state.routines.forEach(r => {
            const res = analyzeCorrelation(dailyData, 'routine', r.id, 1, 'task_count', 'count', r.title, 'Продуктивність');
            if (res) results.push(res);
        });
        return results.sort((a, b) => Math.abs(b.impactPercent) - Math.abs(a.impactPercent)).slice(0, 3);
    }, [dailyData, state.routines]);


    // Real Stats Calculations
    const stats = useMemo(() => {
        const validMoods = dailyData.filter(d => d.mood !== null).map(d => d.mood!);
        const avgMood = validMoods.length ? (validMoods.reduce((a, b) => a + b, 0) / validMoods.length).toFixed(1) : '—';

        const totalTasks = dailyData.reduce((a, b) => a + b.tasksCompleted, 0);
        const avgTasks = dailyData.length ? Math.round(totalTasks / dailyData.length) : 0;

        const totalMinutes = dailyData.reduce((a, b) => a + b.focusMinutes, 0);
        const totalHours = Math.round(totalMinutes / 60);

        return { avgMood, avgTasks, totalHours };
    }, [dailyData]);

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20" id="analytics-container">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Аналітика</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                    Ваш особистий Data Center. Повний огляд продуктивності, звичок та самопочуття.
                </p>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"><Activity className="w-5 h-5" /></div>
                        <div>
                            <div className="flex items-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Сер. Настрій</p>
                                <InfoBadge text="Середнє значення з журналу за 60 днів." />
                            </div>
                            <p className="text-xl font-bold text-foreground">{stats.avgMood}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
                        <div>
                            <div className="flex items-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Продуктивність</p>
                                <InfoBadge text="Середня кількість завдань на день." />
                            </div>
                            <p className="text-xl font-bold text-foreground">{stats.avgTasks} <span className="text-xs font-medium text-muted-foreground/70">задач</span></p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"><Clock className="w-5 h-5" /></div>
                        <div>
                            <div className="flex items-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Час у Фокусі</p>
                                <InfoBadge text="Сумарна тривалість усіх виконаних завдань за 60 днів." />
                            </div>
                            <p className="text-xl font-bold text-foreground">{stats.totalHours} <span className="text-xs font-medium text-muted-foreground/70">год</span></p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-card">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><Calendar className="w-5 h-5" /></div>
                        <div>
                            <div className="flex items-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Даних Зібрано</p>
                            </div>
                            <p className="text-xl font-bold text-foreground">60 <span className="text-xs font-medium text-muted-foreground/70">днів</span></p>
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Paywall Check */}
            {
                (!isPro && !LIMITS[SUBSCRIPTION_PLAN.FREE].HAS_HISTORY_ANALYTICS) ? (
                    <AnalyticsLockState />
                ) : (
                    <>
                        {/* Row 2: Rhythm & Heatmap */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Weekly Rhythm */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    <h3 className="text-lg font-bold text-foreground">Тижневий Ритм</h3>
                                    <InfoBadge text="Середня продуктивність по днях тижня. Допомагає планувати найважчі завдання." />
                                </div>
                                <Card className="border-none shadow-sm bg-card h-[300px]">
                                    <CardContent className="h-full pt-6">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={weeklyStats}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                                                <YAxis hide />
                                                <RechartsTooltip
                                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Bar dataKey="avgTasks" fill="#6366f1" radius={[4, 4, 4, 4]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Consistency Heatmap */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Grid className="w-5 h-5 text-emerald-500" />
                                    <h3 className="text-lg font-bold text-foreground">Мапа Дисципліни</h3>
                                    <InfoBadge text="Історія виконання звичок. Темніший колір = більший відсоток виконаних звичок у цей день." />
                                </div>
                                <Card className="border-none shadow-sm bg-card h-[300px] flex items-center justify-center p-6">
                                    <div className="grid grid-rows-7 grid-flow-col gap-1 w-full h-full max-w-2xl">
                                        {heatmapData.map((d, i) => (
                                            <TooltipProvider key={i}>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div
                                                            className={`w-full h-full rounded-sm transition-all hover:ring-2 ring-emerald-400/50 ${d.intensity === 0 ? 'bg-muted dark:bg-secondary/50' :
                                                                d.intensity < 0.3 ? 'bg-emerald-200 dark:bg-emerald-900/40' :
                                                                    d.intensity < 0.6 ? 'bg-emerald-300 dark:bg-emerald-700/60' :
                                                                        d.intensity < 0.9 ? 'bg-emerald-400 dark:bg-emerald-600/80' : 'bg-emerald-500 dark:bg-emerald-500'
                                                                }`}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p>{d.date}: {d.count} Habits</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Row 3: Metric Explorer */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-cyan-500" />
                                    <h3 className="text-lg font-bold text-foreground">Дослідник Метрик</h3>
                                    <InfoBadge text="Динаміка будь-якого показника за останні 30 днів." />
                                </div>
                                <Select value={selectedMetricId} onValueChange={setSelectedMetricId}>
                                    <SelectTrigger className="w-[180px] h-9 text-xs bg-card border-border">
                                        <SelectValue placeholder="Оберіть метрику" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Оберіть метрику...</SelectItem>
                                        {state.metricDefinitions.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Card className="border-none shadow-sm bg-card h-[350px]">
                                <CardContent className="h-full pt-6">
                                    {selectedMetricId !== 'all' ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={metricExplorerData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                                <RechartsTooltip
                                                    cursor={{ stroke: 'hsl(var(--border))' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-4">
                                            <Scale className="w-12 h-12 opacity-20" />
                                            <p className="text-sm font-medium">Оберіть метрику зі списку зверху, щоб побачити графік</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Influencing Habits for Selected Metric */}
                            {selectedMetricId !== 'all' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="w-4 h-4 text-indigo-500" />
                                        <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">
                                            Впливові Звички
                                            <span className="ml-2 text-xs font-normal opacity-70">(задекларований зв'язок)</span>
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {state.habits.filter(h => h.relatedMetricIds?.includes(selectedMetricId)).length > 0 ? (
                                            state.habits
                                                .filter(h => h.relatedMetricIds?.includes(selectedMetricId))
                                                .map(h => (
                                                    <div key={h.id} className="flex items-center gap-2 bg-white dark:bg-card px-3 py-1.5 rounded-lg border border-indigo-200/50 dark:border-indigo-500/30 shadow-sm">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${h.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{h.title}</span>
                                                    </div>
                                                ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">Немає звичок, що впливають на цю метрику.</p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Drivers Grid (Existing) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Life Quality - Mood */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Heart className="w-5 h-5 text-rose-500 fill-current" />
                                    <h3 className="text-lg font-bold text-foreground">Якість Життя</h3>
                                </div>
                                {moodDrivers.length > 0 ? (
                                    <div className="space-y-3">
                                        {moodDrivers.map((item, idx) => (
                                            <Card key={idx} className="border-none shadow-sm bg-card hover:shadow-md transition-all group overflow-hidden">
                                                <div className={`h-1 w-full ${item.impactPercent > 0 ? 'bg-rose-400' : 'bg-slate-300 dark:bg-slate-700'}`} />
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-foreground text-sm flex items-center gap-2">
                                                                {item.variableX}
                                                                <InfoBadge text={item.explanation} />
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.impactPercent > 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                            {item.impactPercent > 0 ? '+' : ''}{item.impactPercent}%
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl border-2 border-dashed border-border text-center text-muted-foreground text-sm">
                                        Немає достатньо даних для аналізу настрою.
                                    </div>
                                )}
                            </div>

                            {/* Productivity */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-5 h-5 text-amber-500 fill-current" />
                                    <h3 className="text-lg font-bold text-foreground">Драйвери Продуктивності</h3>
                                </div>
                                {productivityDrivers.length > 0 ? (
                                    <div className="space-y-3">
                                        {productivityDrivers.map((item, idx) => (
                                            <Card key={idx} className="border-none shadow-sm bg-card hover:shadow-md transition-all group overflow-hidden">
                                                <div className={`h-1 w-full ${item.impactPercent > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-foreground text-sm flex items-center gap-2">
                                                                {item.variableX}
                                                                <InfoBadge text={item.explanation} />
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.impactPercent > 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                                                            }`}>
                                                            {item.impactPercent > 0 ? '+' : ''}{item.impactPercent}%
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl border-2 border-dashed border-border text-center text-muted-foreground text-sm">
                                        Немає достатньо даних для аналізу продуктивності.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )
            }
        </div >
    );
}
