'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Completed', value: 41, color: '#0F5132' }, // Dark Green
    { name: 'In Progress', value: 30, color: '#10B981' }, // Medium
    { name: 'Pending', value: 29, color: '#A7F3D0' }, // Light
];

export function ProjectProgress() {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-foreground">Project Progress</h3>

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
                    <div className="text-4xl font-bold tracking-tight text-foreground">41%</div>
                    <div className="text-xs text-muted-foreground">Project Ended</div>
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
