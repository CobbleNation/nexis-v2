'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useData } from '@/lib/store';

export function ProjectProgress() {
    const { state } = useData();

    const active = state.projects?.filter((p) => p.status === 'active').length || 0;
    const completed = state.projects?.filter((p) => p.status === 'completed').length || 0;
    const paused = state.projects?.filter((p) => p.status === 'paused').length || 0;
    const total = state.projects?.length || 0;

    const data = [
        { name: 'Завершено', value: completed, color: 'hsl(var(--primary))' },
        { name: 'Активні', value: active, color: 'hsl(var(--primary) / 0.6)' },
        { name: 'Інше', value: paused, color: 'hsl(var(--muted))' },
    ];

    // Don't show chart if no projects
    if (total === 0) {
        return (
            <div className="bg-card text-card-foreground p-6 rounded-[2rem] shadow-sm border border-border h-full flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold mb-2">Статус Проєктів</h3>
                <p className="text-muted-foreground">Немає активних проєктів</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card text-card-foreground p-6 rounded-[2rem] shadow-sm border border-border/50 dark:border-border h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4">Статус Проєктів</h3>

            <div className="relative flex-1 min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-foreground">{total}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Всього</span>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
                {data.map((entry, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-muted-foreground">{entry.name}</span>
                        </div>
                        <span className="font-bold text-sm">{entry.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
