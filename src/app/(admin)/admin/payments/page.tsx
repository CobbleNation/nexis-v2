'use client';

import { useState, useEffect } from 'react';
import {
    CreditCard,
    Search,
    Filter,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    AlertCircle,
    ArrowUpDown,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';

interface Payment {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    status: 'success' | 'pending' | 'failure';
    provider: string;
    invoiceId: string | null;
    createdAt: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/payments');
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
            } else {
                toast.error('Failed to fetch payments');
            }
        } catch (error) {
            toast.error('Error loading payments');
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchesSearch =
            p.userName.toLowerCase().includes(search.toLowerCase()) ||
            p.userEmail.toLowerCase().includes(search.toLowerCase()) ||
            (p.invoiceId && p.invoiceId.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalRevenue: payments
            .filter(p => p.status === 'success')
            .reduce((sum, p) => sum + (p.amount / 100), 0),
        successCount: payments.filter(p => p.status === 'success').length,
        pendingCount: payments.filter(p => p.status === 'pending').length,
        failureCount: payments.filter(p => p.status === 'failure').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 italic">Платежі</h1>
                    <p className="text-slate-400">Управління транзакціями та фінансовий моніторинг</p>
                </div>
                <Button
                    onClick={fetchPayments}
                    variant="outline"
                    className="border-slate-800 hover:bg-slate-800 text-slate-300"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                    Оновити дані
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider">Загальна Виручка</CardDescription>
                        <CardTitle className="text-2xl font-bold text-emerald-500">
                            {stats.totalRevenue.toLocaleString()} ₴
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider">Успішні</CardDescription>
                        <CardTitle className="text-2xl font-bold text-slate-200">
                            {stats.successCount}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider">В Очікуванні</CardDescription>
                        <CardTitle className="text-2xl font-bold text-orange-500">
                            {stats.pendingCount}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider">Помилки</CardDescription>
                        <CardTitle className="text-2xl font-bold text-rose-500">
                            {stats.failureCount}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Пошук за користувачем або ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-slate-950 border-slate-800 text-slate-300 focus:ring-slate-700"
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-300">
                                <SelectValue placeholder="Всі статуси" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                                <SelectItem value="all">Всі статуси</SelectItem>
                                <SelectItem value="success">Успішно</SelectItem>
                                <SelectItem value="pending">Очікування</SelectItem>
                                <SelectItem value="failure">Помилка</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                            <p>Транзакцій не знайдено</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-medium">Користувач</th>
                                        <th className="px-6 py-4 text-left font-medium">Сума</th>
                                        <th className="px-6 py-4 text-left font-medium">Статус</th>
                                        <th className="px-6 py-4 text-left font-medium">Дата</th>
                                        <th className="px-6 py-4 text-left font-medium">Провайдер</th>
                                        <th className="px-6 py-4 text-right font-medium">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-200">{payment.userName}</span>
                                                    <span className="text-xs text-slate-500">{payment.userEmail}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-medium text-slate-200">
                                                {(payment.amount / 100).toFixed(2)} {payment.currency}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1 ${payment.status === 'success'
                                                        ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5'
                                                        : payment.status === 'failure'
                                                            ? 'border-rose-500/50 text-rose-500 bg-rose-500/5'
                                                            : 'border-orange-500/50 text-orange-500 bg-orange-500/5'
                                                        }`}
                                                >
                                                    {payment.status === 'success' && <CheckCircle2 className="h-3 w-3" />}
                                                    {payment.status === 'failure' && <XCircle className="h-3 w-3" />}
                                                    {payment.status === 'pending' && <Clock className="h-3 w-3" />}
                                                    {payment.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {format(new Date(payment.createdAt), 'dd.MM.yyyy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-none font-normal">
                                                    {payment.provider}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/admin/users/${payment.userId}`}>
                                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100 italic">
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        Профіль
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
