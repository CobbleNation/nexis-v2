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

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [chartData, setChartData] = useState<TimeseriesData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, chartRes] = await Promise.all([
                    fetch('/api/admin/analytics/overview'),
                    fetch('/api/admin/analytics/timeseries')
                ]);

                if (statsRes.ok && chartRes.ok) {
                    const statsData = await statsRes.json();
                    const chartJson = await chartRes.json();
                    setStats(statsData.stats);
                    setChartData(chartJson.data || []);
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-slate-500 mt-2">Overview of platform usage and performance.</p>
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
                            +{stats?.newUsers} new in last 30d
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Task Completion</CardTitle>
                        <CheckCircle className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{stats?.completionRate}%</div>
                        <p className="text-xs text-slate-400">
                            {stats?.tasksCompleted} / {stats?.tasksCreated} tasks
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Pro Conversion</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{stats?.conversionRate}%</div>
                        <p className="text-xs text-slate-400">Free to Pro Rate</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-100">Habit Check-ins</CardTitle>
                        <Activity className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{stats?.habitCheckins}</div>
                        <p className="text-xs text-slate-400">Total check-ins</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader>
                        <CardTitle className="text-slate-100">Activity Over Time</CardTitle>
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
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Line type="monotone" dataKey="tasks_created" stroke="#3b82f6" strokeWidth={2} dot={false} name="Tasks Created" />
                                    <Line type="monotone" dataKey="tasks_completed" stroke="#22c55e" strokeWidth={2} dot={false} name="Tasks Completed" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader>
                        <CardTitle className="text-slate-100">Daily Active Users</CardTitle>
                        <CardDescription className="text-slate-400">Unique users performing actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => format(new Date(val), 'dd')}
                                    />
                                    <Bar dataKey="active_users" fill="#6366f1" radius={[4, 4, 0, 0]} name="Active Users" />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
