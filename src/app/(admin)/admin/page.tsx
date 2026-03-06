'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ totalUsers: 0, activeSubscriptions: 0, systemDefaults: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Failed to load stats');
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Панель Адміністратора</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Всього Користувачів</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Активні Підписки</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.activeSubscriptions}</div>
                        <p className="text-xs text-slate-500 mt-1">Користувачі Pro</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Системні Налаштування</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.systemDefaults}</div>
                        <p className="text-xs text-slate-500 mt-1">Глобальний Контент</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
