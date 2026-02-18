'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useData } from '@/lib/store';

export function ProjectProgress() {
    const { state } = useData();

    const active = state.projects?.filter((p: any) => p.status === 'active').length || 0;
    const completed = state.projects?.filter((p: any) => p.status === 'completed').length || 0;
    const pending = state.projects?.filter((p: any) => p.status === 'pending').length || 0;
    const total = (state.projects?.length || 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const data = [
        { name: 'Завершено', value: completed || 1, color: '#0F5132' }, // Dark Green (Primary)
        { name: 'В процесі', value: active || 1, color: '#10B981' }, // Medium
        { name: 'В очікуванні', value: pending || 1, color: '#A7F3D0' }, // Light
    ];

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-foreground">Прогрес Проєктів</h3>

            <div className="relative flex-1 min-h-[160px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={90}
                            cornerRadius={6}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-x-0 bottom-4 text-center">
                    <div className="text-4xl font-bold tracking-tight text-foreground">{completionRate}%</div>
                    <div className="text-xs text-muted-foreground">Завершено</div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-2">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] text-muted-foreground font-medium">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
