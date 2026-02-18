'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

const data = [
    { name: 'S', value: 30 },
    { name: 'M', value: 45 },
    { name: 'T', value: 35 },
    { name: 'W', value: 60 },
    { name: 'T', value: 40 },
    { name: 'F', value: 35 },
    { name: 'S', value: 40 },
];

const Pattern = ({ id }: { id: string }) => (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/20" />
    </pattern>
);

export function ProjectAnalytics() {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border">
            <h3 className="text-lg font-bold mb-6 text-foreground">Project Analytics</h3>
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
                        // Custom rendering logic ideally, or use CSS shapes
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
