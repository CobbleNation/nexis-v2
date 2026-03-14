'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    subscriptionTier: string;
    emailVerified: string | null;
    createdAt: string;
    lastActive: string | null; // Changed to string | null as it comes from SQL
    goalsCount: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [performingBulk, setPerformingBulk] = useState(false);

    async function fetchUsers(query = '') {
        try {
            const url = query
                ? `/api/admin/users?search=${encodeURIComponent(query)}`
                : '/api/admin/users';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (err) {
            toast.error('Не вдалося завантажити користувачів');
        } finally {
            setLoading(false);
        }
    }

    const toggleUser = (id: string) => {
        const next = new Set(selectedUsers);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedUsers(next);
    };

    const toggleAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u.id)));
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedUsers.size === 0) return;
        if (action === 'delete' && !confirm(`Ви впевнені, що хочете видалити ${selectedUsers.size} користувачів?`)) return;

        setPerformingBulk(true);
        try {
            const res = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: Array.from(selectedUsers),
                    action
                })
            });

            if (res.ok) {
                toast.success('Групова дія виконана успішно');
                setSelectedUsers(new Set());
                fetchUsers(search);
            } else {
                toast.error('Помилка при виконанні групової дії');
            }
        } catch (err) {
            toast.error('Критична помилка при виконанні дії');
        } finally {
            setPerformingBulk(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchUsers(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">Управління Користувачами</h1>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Пошук користувачів..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700 w-full sm:w-64"
                    />
                    <Badge variant="outline" className="text-slate-400 whitespace-nowrap">
                        Всього: {users.length}
                    </Badge>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader>
                    <CardTitle>Всі Користувачі</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                    <TableHead className="w-[50px]">
                                        <input
                                            type="checkbox"
                                            checked={users.length > 0 && selectedUsers.size === users.length}
                                            onChange={toggleAll}
                                            className="rounded border-slate-800 bg-slate-950 text-orange-600 focus:ring-orange-500"
                                        />
                                    </TableHead>
                                    <TableHead className="text-slate-400">Користувач</TableHead>
                                    <TableHead className="text-slate-400">Роль</TableHead>
                                    <TableHead className="text-slate-400">План</TableHead>
                                    <TableHead className="text-slate-400">Верифікація</TableHead>
                                    <TableHead className="text-slate-400">Активність</TableHead>
                                    <TableHead className="text-slate-400">Остання активність</TableHead>
                                    <TableHead className="text-right text-slate-400">Дії</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                                            Завантаження...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                                            Користувачів не знайдено.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {users.map((user) => (
                                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(user.id)}
                                                onChange={() => toggleUser(user.id)}
                                                className="rounded border-slate-800 bg-slate-950 text-orange-600 focus:ring-orange-500"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{user.name}</span>
                                                    <span className="text-xs text-slate-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                                                className="capitalize"
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                user.subscriptionTier === 'pro'
                                                    ? 'border-orange-500 text-orange-500'
                                                    : 'text-slate-400'
                                            }>
                                                {user.subscriptionTier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                !!user.emailVerified
                                                    ? 'border-emerald-500 text-emerald-500'
                                                    : 'border-rose-500 text-rose-500'
                                            }>
                                                {!!user.emailVerified ? 'Підтверджено' : 'Непідтверджено'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-sm">
                                            {user.goalsCount} Цілей
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-sm">
                                            {user.lastActive ? format(new Date(user.lastActive), 'MMM d, yyyy') : 'Ніколи'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline flex items-center justify-end gap-1"
                                            >
                                                Деталі
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Action Bar */}
            {selectedUsers.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50 rounded-2xl p-4 flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-sm font-medium">
                        Обрано: <span className="text-orange-500">{selectedUsers.size}</span>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                            onClick={() => handleBulkAction('verify')}
                            disabled={performingBulk}
                        >
                            Верифікувати
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-orange-500 border-orange-500/30"
                            onClick={() => handleBulkAction('resend_verification')}
                            disabled={performingBulk}
                        >
                            Надіслати підтвердження
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                            onClick={() => handleBulkAction('set_pro')}
                            disabled={performingBulk}
                        >
                            Надати Pro
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                            onClick={() => handleBulkAction('set_free')}
                            disabled={performingBulk}
                        >
                            Надати Free
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBulkAction('delete')}
                            disabled={performingBulk}
                        >
                            Видалити
                        </Button>
                    </div>
                    <div className="h-6 w-px bg-slate-800" />
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}>
                        Скасувати
                    </Button>
                </div>
            )}

        </div>
    );
}
