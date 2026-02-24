'use client';

import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, eachMonthOfInterval, startOfYear, endOfYear, isSameMonth } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { ItemPopover } from './ItemPopover';

interface YearViewProps {
    date: Date;
    items: ScheduleItem[];
    onEditItem?: (id: string, type: string) => void;
    onCompleteItem?: (id: string, type: string) => void;
    onDeleteItem?: (id: string, type: string) => void;
}

export function YearView({ date, items, onEditItem, onCompleteItem, onDeleteItem }: YearViewProps) {
    const start = startOfYear(date);
    const end = endOfYear(date);
    const months = eachMonthOfInterval({ start, end });

    // Filter for "Big" things only (Deadlines, Events)
    const strategicItems = items.filter(i => i.type === 'deadline' || i.type === 'event' || i.type === 'task');

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
        <div className="flex flex-col h-full bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border p-4 shadow-sm overflow-hidden">
            {/* Year Header */}
            <div className="text-center pb-4 shrink-0">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{format(date, 'yyyy')}</h2>
            </div>

            {/* 4x3 Grid to fit screen */}
            <div className="grid grid-cols-4 grid-rows-3 gap-4 flex-1 min-h-0">
                {months.map((month, idx) => {
                    const monthItems = strategicItems.filter(i => isSameMonth(new Date(i.date), month));

                    return (
                        <div key={month.toISOString()} className="border border-slate-100 dark:border-border/50 rounded-xl p-3 flex flex-col relative group hover:border-orange-200 dark:hover:border-orange-800 transition-all hover:shadow-sm bg-slate-50/30 dark:bg-card/30">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold uppercase text-foreground">
                                    {format(month, 'LLLL', { locale: uk })}
                                </span>
                                <span className="text-xs text-muted-foreground font-medium">{monthItems.length}</span>
                            </div>

                            {/* Mini Timeline visualization */}
                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                                {monthItems.slice(0, 6).map(item => {
                                    const styles = getItemStyles(item);
                                    let color = "bg-blue-500"; // Tasks
                                    if (item.type === 'deadline') color = "bg-rose-500";
                                    if (item.type === 'event') color = "bg-orange-500";
                                    if (item.type === 'routine') color = "bg-purple-500";

                                    return (
                                        <Popover key={item.id}>
                                            <PopoverTrigger asChild>
                                                <div className="flex items-center gap-2 group/item cursor-pointer">
                                                    <div className={cn("h-2 w-2 rounded-full shrink-0 shadow-sm", color)} />
                                                    <span className="text-[10px] truncate text-slate-600 dark:text-slate-400 group-hover/item:text-foreground transition-colors hover:underline">
                                                        {item.title}
                                                    </span>
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
                                {monthItems.length > 6 && (
                                    <div className="text-[9px] text-muted-foreground pl-4 pt-1">
                                        +{monthItems.length - 6} more...
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
