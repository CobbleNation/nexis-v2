'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useData } from '@/lib/store';
import { subDays, format, isSameDay, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

export function ProjectAnalytics() {
    const { state } = useData();
    const { actions } = state;

    // Calculate completed tasks for the last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        return d;
    });

    const data = last7Days.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Count completed actions on this date
        // Note: actions.date is usually YYYY-MM-DD for tasks, or check updatedAt for completion time if strict.
        // Assuming 'date' field is the scheduled date. If we want completion date, we might not have it strictly stored as 'completedAt'.
        // We'll use 'date' (scheduled) + 'completed' status as a proxy for "Tasks completed for that day".
        // Or if we have 'updatedAt', we could use that if status is completed.
        // Let's stick to 'date' (scheduled) for simplicity as it represents "Daily Plan Completion".

        const count = actions.filter(a => {
            if (!a.completed) return false;
            // Check if action date matches current day
            // action.date is string YYYY-MM-DD.
            return a.date === dateStr;
        }).length;

        // Day name in Ukrainian (e.g., Пн, Вт)
        // 'eee' gives short day name.
        const dayLabel = format(date, 'eee', { locale: uk });

        return {
            name: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
            value: count,
            fullDate: dateStr
        };
    });

    return (
        <div className="bg-card text-card-foreground p-6 rounded-[2rem] shadow-sm border border-border h-full flex flex-col">
            <h3 className="text-lg font-bold mb-6 text-foreground">Активність (Завершені Дії)</h3>
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        <defs>
                            <pattern id="stripe-pattern-analytics" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect width="4" height="8" transform="translate(0,0)" fill="hsl(var(--muted-foreground))" opacity="0.1" />
                            </pattern>
                        </defs>
                        <Bar
                            dataKey="value"
                            fill="hsl(var(--primary))"
                            radius={[6, 6, 6, 6]}
                            barSize={32}
                            activeBar={{ fill: 'hsl(var(--primary) / 0.8)' }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
