'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useData } from '@/lib/store';

export function ProjectAnalytics() {
    const { state } = useData();

    // Calculate weekly completion data (mock logic based on real actions for now, or just static structure if no historical data)
    // In a real app, this would come from an analytics endpoint. 
    // For now, we'll map day names to Ukrainian.
    const data = [
        { name: 'Нд', value: 30 },
        { name: 'Пн', value: 45 },
        { name: 'Вт', value: 35 },
        { name: 'Ср', value: 60 },
        { name: 'Чт', value: 40 },
        { name: 'Пт', value: 35 },
        { name: 'Сб', value: 40 },
    ];

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border">
            <h3 className="text-lg font-bold mb-6 text-foreground">Аналітика Проєктів</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        />
                        {/* SVG Definition for Stripes */}
                        <defs>
                            <pattern id="stripe-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect width="4" height="8" transform="translate(0,0)" fill="var(--muted-foreground)" opacity="0.1" />
                            </pattern>
                        </defs>
                        <Bar
                            dataKey="value"
                            fill="var(--primary)"
                            radius={[20, 20, 20, 20]}
                            barSize={32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
