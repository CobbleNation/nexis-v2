'use client';

import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { ItemPopover } from './ItemPopover';

interface MonthViewProps {
    date: Date;
    items: ScheduleItem[];
    onToggleItem: (id: string) => void;
    onEditItem?: (id: string, type: string) => void;
    onCompleteItem?: (id: string, type: string) => void;
    onDeleteItem?: (id: string, type: string) => void;
}

export function MonthView({ date, items, onToggleItem, onEditItem, onCompleteItem, onDeleteItem }: MonthViewProps) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });

    // Grid Setup: Start from Monday.
    const startDay = (getDay(start) + 6) % 7;
    const emptySlots = Array.from({ length: startDay });

    const getItemsForDay = (day: Date) => {
        return items.filter(item => isSameDay(new Date(item.date), day));
    };

    const getItemStyles = (item: ScheduleItem) => {
        if (item.status === 'completed') {
            return { bg: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', text: 'text-muted-foreground line-through', accent: 'bg-slate-300 dark:bg-slate-600' };
        }
        switch (item.type) {
            case 'task': return { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200/80 dark:border-blue-800/60', text: 'text-blue-900 dark:text-blue-100', accent: 'bg-blue-500' };
            case 'routine': return { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200/80 dark:border-purple-800/60', text: 'text-purple-900 dark:text-purple-100', accent: 'bg-purple-500' };
            case 'event': return { bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200/80 dark:border-orange-800/60', text: 'text-orange-900 dark:text-orange-100', accent: 'bg-orange-500' };
            default: return { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200/80 dark:border-rose-800/60', text: 'text-rose-900 dark:text-rose-100', accent: 'bg-rose-500' };
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'task': return 'Завдання';
            case 'routine': return 'Рутина';
            case 'event': return 'Подія';
            case 'deadline': return 'Дедлайн';
            default: return type;
        }
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
                                    const styles = getItemStyles(item);

                                    return (
                                        <Popover key={item.id}>
                                            <PopoverTrigger asChild>
                                                <div className={cn(
                                                    "text-[9px] truncate px-1.5 py-0.5 rounded-sm border shadow-sm font-medium leading-none flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                                                    styles.bg, styles.border, styles.text
                                                )}>
                                                    <div className={cn("w-1 h-1 rounded-full shrink-0", styles.accent)} />
                                                    <span className="truncate">{item.title}</span>
                                                </div>
                                            </PopoverTrigger>
                                            <ItemPopover
                                                item={item}
                                                styles={styles}
                                                getTypeLabel={getTypeLabel}
                                                onEdit={onEditItem}
                                                onComplete={onCompleteItem}
                                                onDelete={onDeleteItem}
                                            />
                                        </Popover>
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
