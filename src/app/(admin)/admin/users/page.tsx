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
    createdAt: string;
    lastActive: string | null; // Changed to string | null as it comes from SQL
    goalsCount: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchUsers(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700 w-full sm:w-64"
                    />
                    <Badge variant="outline" className="text-slate-400 whitespace-nowrap">
                        Total: {users.length}
                    </Badge>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                    <TableHead className="text-slate-400">User</TableHead>
                                    <TableHead className="text-slate-400">Role</TableHead>
                                    <TableHead className="text-slate-400">Plan</TableHead>
                                    <TableHead className="text-slate-400">Engagement</TableHead>
                                    <TableHead className="text-slate-400">Last Active</TableHead>
                                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {users.map((user) => (
                                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
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
                                        <TableCell className="text-slate-400 text-sm">
                                            {user.goalsCount} Goals
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-sm">
                                            {user.lastActive ? format(new Date(user.lastActive), 'MMM d, yyyy') : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline flex items-center justify-end gap-1"
                                            >
                                                View Details
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

        </div>
    );
}
