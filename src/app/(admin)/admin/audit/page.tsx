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
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: any;
    createdAt: string;
    adminName: string;
    adminEmail: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch('/api/admin/audit');
                if (!res.ok) throw new Error('Failed to fetch logs');
                const data = await res.json();
                setLogs(data.logs);
            } catch (err) {
                setError('Failed to load audit logs');
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading logs...</div>;
    if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Audit Logs</h1>

            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader>
                    <CardTitle>System Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                <TableHead className="text-slate-400">Admin</TableHead>
                                <TableHead className="text-slate-400">Action</TableHead>
                                <TableHead className="text-slate-400">Entity</TableHead>
                                <TableHead className="text-slate-400">Details</TableHead>
                                <TableHead className="text-right text-slate-400">Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        No activity recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{log.adminName}</span>
                                                <span className="text-xs text-slate-500">{log.adminEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {log.entityType} <span className="text-xs text-slate-500">({log.entityId.substring(0, 8)}...)</span>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-slate-400 max-w-[200px] truncate">
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400 text-sm">
                                            {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
