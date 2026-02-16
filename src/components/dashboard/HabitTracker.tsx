'use client';

import { Action } from '@/types';
import { Check, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface HabitTrackerProps {
    habits: Action[];
}

export function HabitTracker({ habits: initialHabits }: HabitTrackerProps) {
    const [habits, setHabits] = useState(initialHabits);

    const toggleHabit = (id: string) => {
        setHabits(prev => prev.map(h => {
            if (h.id === id) {
                const newCompleted = !h.completed;
                if (newCompleted) {
                    toast.success('Habit completed!', {
                        description: `Great job on "${h.title}"! 🔥`,
                    });
                }
                return {
                    ...h,
                    completed: newCompleted,
                    streak: newCompleted ? (h.streak || 0) + 1 : (h.streak || 0) - 1
                };
            }
            return h;
        }));
    };

    return (
        <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Habits</h2>
                <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full">
                    {habits.filter(h => h.completed).length}/{habits.length} Done
                </span>
            </div>

            <div className="space-y-3">
                {habits.map((habit) => (
                    <div
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group",
                            habit.completed
                                ? "bg-primary/5 border-primary/20"
                                : "bg-background border-border/50 hover:bg-accent/50 hover:border-primary/20"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                className={cn(
                                    "h-6 w-6 rounded-full border flex items-center justify-center transition-all",
                                    habit.completed
                                        ? "bg-primary border-primary text-primary-foreground scale-110"
                                        : "border-muted-foreground/30 group-hover:border-primary/50"
                                )}
                            >
                                {habit.completed && <Check className="h-3.5 w-3.5" />}
                            </button>
                            <span className={cn("text-sm font-medium transition-colors", habit.completed ? "text-muted-foreground line-through" : "text-foreground")}>
                                {habit.title}
                            </span>
                        </div>

                        <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors",
                            habit.completed ? "bg-orange-500/10 text-orange-500" : "bg-muted text-muted-foreground"
                        )}>
                            <Flame className={cn("h-3 w-3", habit.completed ? "fill-orange-500 text-orange-500" : "text-muted-foreground")} />
                            {habit.streak}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
