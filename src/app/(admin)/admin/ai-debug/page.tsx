'use client';

import { useState, useEffect } from 'react';
import { Brain, RefreshCw, ChevronDown, ChevronUp, User, Clock, FileText, Target, ListTodo, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AILogEntry {
    id: string;
    userId: string;
    createdAt: string;
    timestamp: string;
    userMessage: string;
    contextSent?: {
        profileFields: number;
        profileData: Record<string, string>;
        activeGoals: number;
        todayTasks: number;
        totalTasks: number;
        activeHabits: number;
        memories: number;
        lifeAreas: number;
    };
    systemPromptLength?: number;
    raw?: string;
}

export default function AdminAIDebugPage() {
    const [logs, setLogs] = useState<AILogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-debug');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (e) {
            console.error('Failed to fetch AI debug logs:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">AI Debug Console</h1>
                        <p className="text-sm text-slate-400">Контекст, що передається AI при кожному запиті користувача</p>
                    </div>
                </div>
                <Button onClick={fetchLogs} variant="outline" className="gap-2 text-slate-300 border-slate-700 hover:bg-slate-800">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Оновити
                </Button>
            </div>

            {logs.length === 0 && !loading && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-12 text-center text-slate-500">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Поки немає жодного AI запиту. Вони з'являться тут після першого повідомлення в чат.</p>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {logs.map(log => {
                    const isExpanded = expanded === log.id;
                    const ctx = log.contextSent;

                    return (
                        <Card key={log.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                            <button
                                onClick={() => setExpanded(isExpanded ? null : log.id)}
                                className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate max-w-md">
                                            {log.userMessage || '(порожнє повідомлення)'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString('uk-UA') : 'N/A'}
                                            </span>
                                            <span>User: {log.userId?.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {ctx && (
                                        <div className="hidden md:flex items-center gap-2 text-xs">
                                            <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md">{ctx.profileFields} полів</span>
                                            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md">{ctx.activeGoals} цілей</span>
                                            <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-md">{ctx.todayTasks} задач</span>
                                            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md">{ctx.memories} пам'ять</span>
                                        </div>
                                    )}
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </div>
                            </button>

                            {isExpanded && ctx && (
                                <div className="border-t border-slate-800 p-4 space-y-4">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Полів профілю</p>
                                            <p className="text-lg font-bold text-blue-400">{ctx.profileFields}</p>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Активних цілей</p>
                                            <p className="text-lg font-bold text-green-400">{ctx.activeGoals}</p>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><ListTodo className="w-3 h-3" /> Задач сьогодні</p>
                                            <p className="text-lg font-bold text-amber-400">{ctx.todayTasks}</p>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl">
                                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Звичок</p>
                                            <p className="text-lg font-bold text-purple-400">{ctx.activeHabits}</p>
                                        </div>
                                    </div>

                                    {/* Profile Data */}
                                    {Object.keys(ctx.profileData || {}).length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-300 mb-2">📋 Дані профілю, передані в AI:</h4>
                                            <div className="bg-slate-950 rounded-xl p-3 grid gap-2 md:grid-cols-2">
                                                {Object.entries(ctx.profileData).map(([key, value]) => (
                                                    <div key={key} className="flex gap-2 text-xs">
                                                        <span className="text-slate-500 font-mono shrink-0">{key}:</span>
                                                        <span className="text-slate-200">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Prompt Size */}
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <FileText className="w-3 h-3" />
                                        Розмір системного промпту: <span className="text-slate-300 font-bold">{log.systemPromptLength?.toLocaleString()} символів</span>
                                    </div>

                                    {/* Additional stats */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 bg-slate-800 rounded-md text-slate-400">Всього задач: {ctx.totalTasks}</span>
                                        <span className="px-2 py-1 bg-slate-800 rounded-md text-slate-400">Пам'ять фактів: {ctx.memories}</span>
                                        <span className="px-2 py-1 bg-slate-800 rounded-md text-slate-400">Сфер життя: {ctx.lifeAreas}</span>
                                    </div>
                                </div>
                            )}

                            {isExpanded && log.raw && (
                                <div className="border-t border-slate-800 p-4">
                                    <pre className="text-xs text-slate-400 whitespace-pre-wrap bg-slate-950 p-3 rounded-xl overflow-x-auto">
                                        {log.raw}
                                    </pre>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
