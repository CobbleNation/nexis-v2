'use client';

import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { uk } from 'date-fns/locale';

interface MonthViewProps {
    date: Date;
    items: ScheduleItem[];
    onToggleItem: (id: string) => void;
}

export function MonthView({ date, items }: MonthViewProps) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });

    // Grid Setup: Start from Monday.
    const startDay = (getDay(start) + 6) % 7;
    const emptySlots = Array.from({ length: startDay });

    const getItemsForDay = (day: Date) => {
        return items.filter(item => isSameDay(new Date(item.date), day));
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card rounded-xl shadow-sm border border-slate-200 dark:border-border overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-card/50 shrink-0">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid (Fit to screen: Flex with equal rows approach or Grid with h-full) */}
            <div className="grid grid-cols-7 flex-1 min-h-0 auto-rows-fr">
                {emptySlots.map((_, i) => <div key={`empty-${i}`} className="border-b border-r border-slate-100 dark:border-border/50" />)}

                {days.map((day, idx) => {
                    const dayItems = getItemsForDay(day);
                    const isToday = isSameDay(day, new Date());

                    // Filter: Only significant items to avoid clutter
                    const deadlines = dayItems.filter(i => i.type === 'deadline');
                    const events = dayItems.filter(i => i.type === 'event');
                    // We can include tasks if important, but Month view is broadly for Structure.
                    const others = dayItems.filter(i => i.type !== 'deadline' && i.type !== 'event').slice(0, 2);

                    const allDisplay = [...deadlines, ...events, ...others];

                    return (
                        <motion.div
                            key={day.toISOString()}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.005 }}
                            className={cn(
                                "border-b border-r border-slate-100 dark:border-border/50 p-1 relative group flex flex-col gap-1 min-h-0 overflow-hidden hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors",
                                isToday && "bg-orange-50/30 dark:bg-orange-950/20"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full transition-colors self-end",
                                isToday ? "bg-orange-500 text-white" : "text-slate-400 dark:text-muted-foreground group-hover:text-foreground"
                            )}>
                                {format(day, 'd')}
                            </span>

                            {/* Blocks */}
                            <div className="flex flex-col gap-1 overflow-hidden">
                                {allDisplay.slice(0, 4).map(item => {
                                    let style = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-800";
                                    if (item.type === 'deadline') style = "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border-rose-200 dark:border-rose-800";
                                    if (item.type === 'event') style = "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border-orange-200 dark:border-orange-800";
                                    if (item.type === 'routine') style = "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border-purple-200 dark:border-purple-800";

                                    return (
                                        <div key={item.id} className={cn(
                                            "text-[9px] truncate px-1.5 py-0.5 rounded-full border shadow-sm font-medium leading-none flex items-center gap-1",
                                            style
                                        )}>
                                            <div className={cn("w-1 h-1 rounded-full bg-current opacity-50")} />
                                            <span className="truncate">{item.title}</span>
                                        </div>
                                    )
                                })}
                                {(allDisplay.length > 4) && (
                                    <div className="text-[9px] font-medium text-muted-foreground text-center leading-none bg-slate-100 dark:bg-secondary/50 rounded-full py-0.5">
                                        +{allDisplay.length - 4} more
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
