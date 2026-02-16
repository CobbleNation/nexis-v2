'use client';

import { useData } from '@/lib/store';
import { Plus, Zap, Check, Flame, Clock, Target, CalendarDays, MoreHorizontal, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Habit, HabitLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import React from 'react';
import { HabitHistoryModal } from '@/components/habits/HabitHistoryModal';

export function HabitsView() {
    const { state, dispatch } = useData();
    const [selectedHabit, setSelectedHabit] = React.useState<Habit | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const habits = state.habits.filter(h => h.status === 'active');

    const handleToggle = (habit: Habit) => {
        const existingLog = state.habitLogs.find(l => l.habitId === habit.id && l.date === today);
        const isCompleted = existingLog?.completed || false;

        const newCompleted = !isCompleted;
        const val = newCompleted ? (habit.targetValue || 1) : 0;

        const log: HabitLog = {
            id: existingLog ? existingLog.id : uuidv4(),
            habitId: habit.id,
            date: today,
            value: val,
            completed: newCompleted
        };

        dispatch({ type: 'LOG_HABIT', payload: log });

        if (newCompleted) {
            toast.success(`Супер! "${habit.title}" виконано! 🔥`);
        }
    };

    return (
        <div className="space-y-8 w-full h-full p-4 md:p-8">
            <div className="flex items-center justify-between py-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-foreground">
                        <Zap className="w-6 h-6 text-orange-500" />
                        Звички
                    </h2>
                    <p className="text-muted-foreground text-sm">Ваш щоденний ритм та дисципліна</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.map(habit => {
                    const area = state.areas.find(a => a.id === habit.areaId);
                    const log = state.habitLogs.find(l => l.habitId === habit.id && l.date === today);
                    const isCompleted = log?.completed;

                    return (
                        <div key={habit.id} className={cn(
                            "group relative overflow-hidden bg-white dark:bg-card p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between min-h-[220px]",
                            isCompleted
                                ? "border-emerald-100 dark:border-emerald-900/30 shadow-emerald-100/50 dark:shadow-none bg-gradient-to-br from-white to-emerald-50/30 dark:from-card dark:to-emerald-900/10"
                                : "border-slate-100 dark:border-border hover:shadow-lg hover:border-slate-200 dark:hover:border-border/80"
                        )}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        area ? area.color.replace('bg-', 'bg-').replace('500', '100') + ' ' + area.color.replace('bg-', 'text-').replace('500', '700') : "bg-slate-100 text-slate-600"
                                    )}>
                                        {area?.title || 'General'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedHabit(habit)}
                                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-secondary text-slate-400 dark:text-muted-foreground transition-colors mr-1"
                                        >
                                            <CalendarDays className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1 sm:gap-1.5 text-orange-500 font-bold text-xs bg-orange-50 dark:bg-orange-500/10 px-2 py-1.5 rounded-full">
                                            <Flame className={cn("w-3.5 h-3.5 fill-orange-500 transition-all", isCompleted ? "scale-110" : "scale-100")} />
                                            {habit.streak}
                                        </div>
                                    </div>
                                </div>

                                <h3 className={cn(
                                    "font-bold text-xl mb-3 transition-colors",
                                    isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-slate-800 dark:text-foreground"
                                )}>{habit.title}</h3>

                                <div className="space-y-2 mb-6">
                                    {habit.minimum && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Target className="w-3.5 h-3.5" />
                                            <span>{habit.minimum}</span>
                                        </div>
                                    )}
                                    {habit.timeOfDay && habit.timeOfDay !== 'anytime' && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground capitalize">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{habit.timeOfDay}</span>
                                        </div>
                                    )}
                                    {habit.relatedMetricIds && habit.relatedMetricIds.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-border/50">
                                            {state.metricDefinitions
                                                .filter(m => habit.relatedMetricIds?.includes(m.id))
                                                .map(m => (
                                                    <div key={m.id} className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-secondary text-slate-500 px-2 py-0.5 rounded-full" title="Потенційний вплив">
                                                        <BarChart3 className="w-3 h-3 text-indigo-500" />
                                                        <span>{m.name}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={() => handleToggle(habit)}
                                className={cn(
                                    "w-full rounded-xl transition-all duration-300 h-12 font-bold text-base mt-2",
                                    isCompleted
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/30"
                                        : "bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground hover:bg-slate-800 dark:hover:bg-primary/90 shadow-lg shadow-slate-200 dark:shadow-none"
                                )}
                            >
                                {isCompleted ? (
                                    <>
                                        <Check className="w-5 h-5 mr-2" /> Виконано
                                    </>
                                ) : (
                                    "Відмітити"
                                )}
                            </Button>
                        </div>
                    );
                })}

                {habits.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-slate-50/50 dark:bg-card/50 rounded-3xl border border-dashed border-slate-200 dark:border-border">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-secondary rounded-full flex items-center justify-center mb-4">
                            <Zap className="w-8 h-8 text-slate-300 dark:text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-foreground mb-1">Ще немає звичок</h3>
                        <p className="max-w-xs mx-auto">Створіть свою першу звичку через кнопку "+" у верхньому меню, щоб почати відстежувати прогрес.</p>
                    </div>
                )}
            </div>

            {selectedHabit && (
                <HabitHistoryModal
                    habit={selectedHabit}
                    open={!!selectedHabit}
                    onOpenChange={(open) => !open && setSelectedHabit(null)}
                />
            )}
        </div>
    );
}
