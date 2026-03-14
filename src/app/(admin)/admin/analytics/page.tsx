"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from "sonner";
import { Loader2, Users, TrendingUp, CheckCircle, Activity } from "lucide-react";

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

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [chartData, setChartData] = useState<TimeseriesData[]>([]);
    const [detailed, setDetailed] = useState<DetailedAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, chartRes, detailedRes] = await Promise.all([
                    fetch('/api/admin/analytics/overview'),
                    fetch('/api/admin/analytics/timeseries'),
                    fetch('/api/admin/analytics/detailed')
                ]);

                if (statsRes.ok && chartRes.ok && detailedRes.ok) {
                    const statsData = await statsRes.json();
                    const chartJson = await chartRes.json();
                    const detailedJson = await detailedRes.json();
                    setStats(statsData.stats);
                    setChartData(chartJson.data || []);
                    setDetailed(detailedJson);
                } else {
                    toast.error("Failed to fetch analytics data");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error loading analytics");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-slate-500 mt-2">Comprehensive overview of system activation, retention, and performance.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{stats?.totalUsers}</div>
                        <p className="text-xs text-slate-400">
                            +{stats?.newUsers} in last 30d
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Activation Rate</CardTitle>
                        <Activity className="h-4 w-4 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{detailed?.activationRate}%</div>
                        <p className="text-xs text-slate-400">
                            {detailed?.activationRate && detailed.activationRate < 20 ? "Problem in onboarding" : "Normal activation"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Daily Active Users</CardTitle>
                        <Users className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{detailed?.dau}</div>
                        <p className="text-xs text-slate-400">Unique users today</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Pro Conversion</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{stats?.conversionRate}%</div>
                        <p className="text-xs text-slate-400">Free to Pro Rate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Retention Chart */}
                <Card className="col-span-4 bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader>
                        <CardTitle className="text-slate-100">Retention</CardTitle>
                        <CardDescription className="text-slate-400">Percentage of users returning over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="text-sm text-slate-400 mb-1">Day 1</div>
                                <div className="text-2xl font-bold text-indigo-400">{detailed?.retention.day1}%</div>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="text-sm text-slate-400 mb-1">Day 7</div>
                                <div className="text-2xl font-bold text-emerald-400">{detailed?.retention.day7}%</div>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="text-sm text-slate-400 mb-1">Day 30</div>
                                <div className="text-2xl font-bold text-amber-400">{detailed?.retention.day30}%</div>
                            </div>
                        </div>
                        <div className="h-[200px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={[
                               { name: 'Day 1', value: detailed?.retention.day1 },
                               { name: 'Day 7', value: detailed?.retention.day7 },
                               { name: 'Day 30', value: detailed?.retention.day30 }
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
                        <CardTitle className="text-slate-100">Activation Funnel</CardTitle>
                        <CardDescription className="text-slate-400">User progression through key milestones</CardDescription>
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
                    <CardTitle className="text-slate-100">Detailed Activity</CardTitle>
                    <CardDescription className="text-slate-400">Daily tasks created vs completed</CardDescription>
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
                                <Line type="monotone" dataKey="tasks_created" stroke="#3b82f6" strokeWidth={2} dot={false} name="Tasks Created" />
                                <Line type="monotone" dataKey="tasks_completed" stroke="#22c55e" strokeWidth={2} dot={false} name="Tasks Completed" />
                                <Line type="monotone" dataKey="active_users" stroke="#6366f1" strokeWidth={2} dot={false} name="Active Users" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
