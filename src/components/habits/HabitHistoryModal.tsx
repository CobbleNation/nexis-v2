import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Habit, HabitLog, MetricDefinition } from '@/types';
import { useData } from '@/lib/store';
import { format, subDays, startOfMonth, startOfYear, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart3, Calendar as CalendarIcon, Flame, Target, Clock, AlertCircle } from 'lucide-react';
import { BasicCalendar } from "@/components/ui/basic-calendar";

interface HabitHistoryModalProps {
    habit: Habit;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HabitHistoryModal({ habit, open, onOpenChange }: HabitHistoryModalProps) {
    const { state } = useData();
    const [viewMode, setViewMode] = React.useState<'month' | 'year'>('month');
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

    const logs = state.habitLogs.filter(l => l.habitId === habit.id);
    const relatedMetrics = habit.relatedMetricIds
        ? state.metricDefinitions.filter(m => habit.relatedMetricIds?.includes(m.id))
        : [];

    // Stats
    const totalCompletions = logs.filter(l => l.completed).length;

    // Calendar Helpers
    const isCompleted = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return logs.some(l => l.date === dateStr && l.completed);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] sm:h-[800px] overflow-y-auto bg-slate-50 dark:bg-card/95 backdrop-blur-xl border-slate-200 dark:border-border p-6 rounded-3xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                        <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-2 rounded-xl">
                            <Flame className="w-6 h-6 fill-orange-500" />
                        </span>
                        {habit.title}
                    </DialogTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                        {habit.minimum && (
                            <span className="bg-white dark:bg-secondary border px-3 py-1 rounded-full flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" />
                                Мінімум: <span className="font-semibold text-slate-700 dark:text-foreground">{habit.minimum}</span>
                            </span>
                        )}
                        {habit.timeOfDay && habit.timeOfDay !== 'anytime' && (
                            <span className="bg-white dark:bg-secondary border px-3 py-1 rounded-full flex items-center gap-2 capitalize">
                                <Clock className="w-3.5 h-3.5" />
                                {habit.timeOfDay}
                            </span>
                        )}
                        {relatedMetrics.length > 0 && relatedMetrics.map(m => (
                            <span key={m.id} className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                                <BarChart3 className="w-3.5 h-3.5" />
                                {m.name}
                            </span>
                        ))}
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main History View */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Visualization Tabs */}
                        <div className="flex gap-2 bg-slate-100 dark:bg-secondary/50 p-1 rounded-lg w-fit">
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", viewMode === 'month' ? "bg-white dark:bg-card shadow-sm text-slate-900 dark:text-foreground" : "text-slate-500 hover:text-slate-700")}
                            >
                                Календар
                            </button>
                            <button
                                onClick={() => setViewMode('year')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", viewMode === 'year' ? "bg-white dark:bg-card shadow-sm text-slate-900 dark:text-foreground" : "text-slate-500 hover:text-slate-700")}
                            >
                                Огляд року
                            </button>
                        </div>

                        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-6 shadow-sm min-h-[350px] flex items-center justify-center">
                            {viewMode === 'month' ? (
                                <BasicCalendar
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        if (date) setSelectedDate(date);
                                    }}
                                    className="p-3"
                                    completedDays={logs
                                        .filter(l => l.completed)
                                        .map(l => new Date(l.date))
                                    }
                                />
                            ) : (
                                <YearHeatmap logs={logs} />
                            )}
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        {/* Current Streak */}
                        <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 rounded-2xl shadow-lg shadow-orange-200 dark:shadow-none">
                            <div className="flex items-center gap-2 opacity-90 mb-2">
                                <Flame className="w-5 h-5" />
                                <span className="font-medium text-sm">Поточний стрік</span>
                            </div>
                            <div className="text-5xl font-bold mb-1">{habit.streak} <span className="text-2xl font-normal opacity-80">днів</span></div>
                            <p className="text-xs opacity-70">Keep the fire burning!</p>
                        </div>

                        {/* Total Stats */}
                        <div className="bg-white dark:bg-card border border-slate-100 dark:border-border p-6 rounded-2xl">
                            <h4 className="font-semibold mb-4 text-slate-900 dark:text-foreground">Статистика</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Всього виконань</span>
                                    <span className="font-bold text-lg">{totalCompletions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Ефективність</span>
                                    <span className="font-bold text-lg">
                                        {Math.round((totalCompletions / (subDays(new Date(), 30).getDate() || 1)) * 100)}%
                                        {/* Simplistic efficiency logic, improve later */}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function YearHeatmap({ logs }: { logs: HabitLog[] }) {
    // Simple grid visualization of the year
    const today = new Date();
    const start = startOfYear(today);
    const days = eachDayOfInterval({ start, end: today });

    return (
        <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-sm mb-2">{today.getFullYear()} Activity</h4>
            <div className="flex flex-wrap gap-1">
                {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isDone = logs.some(l => l.date === dateStr && l.completed);
                    return (
                        <div
                            key={dateStr}
                            title={`${dateStr}: ${isDone ? 'Completed' : 'Missed'}`}
                            className={cn(
                                "w-3 h-3 rounded-[2px]",
                                isDone ? "bg-emerald-500" : "bg-slate-100 dark:bg-secondary"
                            )}
                        />
                    );
                })}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-slate-100 dark:bg-secondary rounded-[2px]" /> Не виконано
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded-[2px]" /> Виконано
                </div>
            </div>
        </div>
    );
}
