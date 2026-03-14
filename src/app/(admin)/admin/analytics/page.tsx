"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from "sonner";
import { Loader2, Users, TrendingUp, CheckCircle, Activity, Zap, Search as SearchIcon, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnalyticsStats {
    totalUsers: number;
    newUsers: number;
    conversionRate: number;
    tasksCreated: number;
    tasksCompleted: number;
    completionRate: number;
    goalsCreated: number;
    habitCheckins: number;
}

interface TimeseriesData {
    date: string;
    tasks_created: number;
    tasks_completed: number;
    habits_completed: number;
    active_users: number;
}

interface DetailedAnalytics {
    activationRate: number;
    funnel: { stage: string; count: number }[];
    retention: { day1: number; day7: number; day30: number };
    dau: number;
}

interface AnalyticsEvent {
    id: string;
    eventName: string;
    createdAt: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    metadata: any;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [chartData, setChartData] = useState<TimeseriesData[]>([]);
    const [detailed, setDetailed] = useState<DetailedAnalytics | null>(null);
    const [liveEvents, setLiveEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveLoading, setLiveLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, chartRes, detailedRes, liveRes] = await Promise.all([
                    fetch('/api/admin/analytics/overview'),
                    fetch('/api/admin/analytics/timeseries'),
                    fetch('/api/admin/analytics/detailed'),
                    fetch('/api/admin/analytics/live')
                ]);

                if (statsRes.ok && chartRes.ok && detailedRes.ok && liveRes.ok) {
                    const statsData = await statsRes.json();
                    const chartJson = await chartRes.json();
                    const detailedJson = await detailedRes.json();
                    const liveJson = await liveRes.json();
                    setStats(statsData.stats);
                    setChartData(chartJson.data || []);
                    setDetailed(detailedJson);
                    setLiveEvents(liveJson);
                } else {
                    toast.error("Не вдалося завантажити дані аналітики");
                }
            } catch (error) {
                console.error(error);
                toast.error("Помилка завантаження аналітики");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const refreshLive = async () => {
        setLiveLoading(true);
        try {
            const res = await fetch('/api/admin/analytics/live');
            if (res.ok) {
                const data = await res.json();
                setLiveEvents(data);
                toast.success("Стрічку оновлено");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLiveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Аналітика</h1>
                    <p className="text-slate-500 mt-2">Комплексний огляд активації, утримання та ефективності системи.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshLive} disabled={liveLoading} className="gap-2 bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800">
                    <Zap className={cn("h-4 w-4 text-amber-400", liveLoading && "animate-pulse")} />
                    Оновити Live
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-900 border-slate-800">
                    <TabsTrigger value="overview">Огляд</TabsTrigger>
                    <TabsTrigger value="live">Активність у Реальному Часі</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-slate-900 border-slate-800 text-slate-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-100">Всього користувачів</CardTitle>
                                <Users className="h-4 w-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-100">{stats?.totalUsers}</div>
                                <p className="text-xs text-slate-400">
                                    +{stats?.newUsers} за останні 30д
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800 text-slate-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-100">Рівень Активації</CardTitle>
                                <Activity className="h-4 w-4 text-indigo-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-100">{detailed?.activationRate}%</div>
                                <p className="text-xs text-slate-400">
                                    {detailed?.activationRate && detailed.activationRate < 20 ? "Проблема в онбордингу" : "Нормальна активація"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800 text-slate-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-100">Активні Користувачі (DAU)</CardTitle>
                                <Users className="h-4 w-4 text-emerald-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-100">{detailed?.dau}</div>
                                <p className="text-xs text-slate-400">Унікальних юзерів сьогодні</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800 text-slate-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-100">Конверсія в Pro</CardTitle>
                                <TrendingUp className="h-4 w-4 text-amber-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-100">{stats?.conversionRate}%</div>
                                <p className="text-xs text-slate-400">З безкоштовних у Pro</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        {/* Retention Chart */}
                        <Card className="col-span-4 bg-slate-900 border-slate-800 text-slate-100">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Утримання (Retention)</CardTitle>
                                <CardDescription className="text-slate-400">Відсоток користувачів, які повернулися через деякий час</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <div className="text-sm text-slate-400 mb-1">День 1</div>
                                        <div className="text-2xl font-bold text-indigo-400">{detailed?.retention.day1}%</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <div className="text-sm text-slate-400 mb-1">День 7</div>
                                        <div className="text-2xl font-bold text-emerald-400">{detailed?.retention.day7}%</div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                        <div className="text-sm text-slate-400 mb-1">День 30</div>
                                        <div className="text-2xl font-bold text-amber-400">{detailed?.retention.day30}%</div>
                                    </div>
                                </div>
                                <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                    { name: 'День 1', value: detailed?.retention.day1 },
                                    { name: 'День 7', value: detailed?.retention.day7 },
                                    { name: 'День 30', value: detailed?.retention.day30 }
                                    ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Retention %" />
                                    </BarChart>
                                </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Conversion Funnel */}
                        <Card className="col-span-3 bg-slate-900 border-slate-800 text-slate-100">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Воронка Активації</CardTitle>
                                <CardDescription className="text-slate-400">Прогрес користувачів по ключових етапах</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={detailed?.funnel || []} margin={{ left: 40, right: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="stage" 
                                                type="category" 
                                                stroke="#94a3b8" 
                                                fontSize={12} 
                                                tickLine={false} 
                                                axisLine={false}
                                                width={100}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                            />
                                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Users" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity Over Time (Existing) */}
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle className="text-slate-100">Детальна Активність</CardTitle>
                            <CardDescription className="text-slate-400">Щоденна кількість створених та завершених завдань</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => format(new Date(val), 'MMM dd')}
                                        />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                            itemStyle={{ color: '#f8fafc' }}
                                        />
                                        <Line type="monotone" dataKey="tasks_created" stroke="#3b82f6" strokeWidth={2} dot={false} name="Завдань створено" />
                                        <Line type="monotone" dataKey="tasks_completed" stroke="#22c55e" strokeWidth={2} dot={false} name="Завдань виконано" />
                                        <Line type="monotone" dataKey="active_users" stroke="#6366f1" strokeWidth={2} dot={false} name="Активні юзери" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="live">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-slate-100">Стрічка Живої Активності</CardTitle>
                                <CardDescription className="text-slate-400">Останні 100 подій у системі в режимі реального часу.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
                                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">У прямому ефірі</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-800 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-800/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Подія</th>
                                            <th className="px-4 py-3">Користувач</th>
                                            <th className="px-4 py-3">Час</th>
                                            <th className="px-4 py-3">Деталі</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {liveEvents.length > 0 ? liveEvents.map((event) => (
                                            <tr key={event.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                        event.eventName.includes('verify') || event.eventName.includes('login') || event.eventName.includes('register') 
                                                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                                            : event.eventName.includes('created') 
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                                                    )}>
                                                        {event.eventName.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-200">{event.userName || 'Unknown'}</span>
                                                        <span className="text-[10px] text-slate-500">{event.userEmail || 'Guest'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">
                                                    {format(new Date(event.createdAt), 'HH:mm:ss')}
                                                    <div className="text-[10px]">{format(new Date(event.createdAt), 'MMM dd')}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <code className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded block max-w-[200px] truncate">
                                                        {event.metadata ? JSON.stringify(event.metadata) : '-'}
                                                    </code>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Поки що немає активності.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
