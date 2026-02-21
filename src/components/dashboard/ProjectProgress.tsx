'use client';

import { useData } from '@/lib/store';
import { Flame, CheckCircle2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectProgress() {
    const { state } = useData();
    const allActions = state.actions || [];

    // Today string
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Today's stats
    const todayTasks = allActions.filter(a => a.date === todayStr && a.type === 'task');
    const completedToday = todayTasks.filter(a => a.completed).length;
    const plannedToday = todayTasks.length;

    // Streak calculation: consecutive days (looking back) with at least 1 completed task
    let streak = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        const hasCompleted = allActions.some(a => a.date === dateStr && a.completed);
        if (hasCompleted) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // If it's today and nothing completed yet, don't break streak from yesterday
            if (i === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }

    // Weekly heatmap: last 7 days
    const weekDays: { label: string; count: number; dateStr: string }[] = [];
    const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count = allActions.filter(a => a.date === ds && a.completed).length;
        const dayIndex = (d.getDay() + 6) % 7; // Mon=0
        weekDays.push({ label: dayLabels[dayIndex], count, dateStr: ds });
    }

    const maxCount = Math.max(...weekDays.map(d => d.count), 1);

    return (
        <div className="bg-white dark:bg-card p-5 rounded-[2rem] shadow-sm border border-border/50 dark:border-border h-full flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Активність
            </h3>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-50 dark:bg-secondary/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-muted-foreground">Сьогодні</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                        {completedToday}<span className="text-sm font-normal text-muted-foreground">/{plannedToday}</span>
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-secondary/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-medium text-muted-foreground">Стрік</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                        {streak} <span className="text-sm font-normal text-muted-foreground">дн.</span>
                    </p>
                </div>
            </div>

            {/* Weekly Heatmap */}
            <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Тиждень</p>
                <div className="grid grid-cols-7 gap-1.5">
                    {weekDays.map((day, i) => {
                        const intensity = day.count === 0 ? 0 : Math.max(0.2, day.count / maxCount);
                        const isToday = day.dateStr === todayStr;
                        return (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <div
                                    className={cn(
                                        "w-full aspect-square rounded-lg transition-all flex items-center justify-center text-xs font-bold",
                                        isToday && "ring-2 ring-orange-400 ring-offset-1 dark:ring-offset-card",
                                        day.count === 0
                                            ? "bg-slate-100 dark:bg-secondary/30 text-transparent"
                                            : "text-white"
                                    )}
                                    style={day.count > 0 ? {
                                        backgroundColor: `rgba(249, 115, 22, ${intensity})`,
                                    } : undefined}
                                    title={`${day.count} завдань`}
                                >
                                    {day.count > 0 ? day.count : ''}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    isToday ? "text-orange-500" : "text-muted-foreground"
                                )}>
                                    {day.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
