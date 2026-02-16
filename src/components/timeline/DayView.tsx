'use client';

import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DayViewProps {
    date: Date;
    items: ScheduleItem[];
    onToggleItem: (id: string) => void;
}

// 06:00 to 23:00 (17 hours)
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

export function DayView({ date, items, onToggleItem }: DayViewProps) {
    const router = useRouter();

    // All-day items & Routines
    const { allDayTasks, routineItems } = useMemo(() => {
        const dateStr = date.toISOString().split('T')[0];
        const dayItems = items.filter(i => !i.time && i.date === dateStr);

        const tasks = dayItems.filter(i => i.type !== 'routine');
        const routines = dayItems.filter(i => i.type === 'routine');

        return { allDayTasks: tasks, routineItems: routines };
    }, [items, date]);

    // Current Time
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const isToday = new Date().toDateString() === date.toDateString();

    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

    // Filter & Position Logic
    const { timedItems } = useMemo(() => {
        const timed: ScheduleItem[] = [];
        const dateStr = date.toISOString().split('T')[0];

        items.forEach(item => {
            if (item.date !== dateStr) return;
            if (item.time) timed.push(item);
        });

        return { timedItems: timed };
    }, [items, date]);

    // Calculate Grid Positions (Overlaps)
    const renderItems = useMemo(() => {
        const itemsWithPos = timedItems.map(item => {
            const [h, m] = item.time!.split(':').map(Number);
            if (h < START_HOUR || h > END_HOUR) return null;

            const minutesFromStart = (h - START_HOUR) * 60 + m;
            const topPercent = (minutesFromStart / (TOTAL_HOURS * 60)) * 100;
            const heightPercent = ((item.duration || 60) / (TOTAL_HOURS * 60)) * 100;

            return { item, top: topPercent, height: heightPercent, colIndex: 0 };
        }).filter(Boolean) as { item: ScheduleItem, top: number, height: number, colIndex: number }[];

        // Sort by start time
        itemsWithPos.sort((a, b) => a.top - b.top || b.height - a.height);

        // Column Assignment (Horizontal Stacking)
        const columns: typeof itemsWithPos[] = [];
        itemsWithPos.forEach(entry => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                // Check overlap
                const overlap = col.some(e => Math.max(entry.top, e.top) < Math.min(entry.top + entry.height, e.top + e.height));
                if (!overlap) {
                    col.push(entry);
                    entry.colIndex = i;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([entry]);
                entry.colIndex = columns.length - 1;
            }
        });

        return { itemsWithPos, totalCols: columns.length };
    }, [timedItems]);


    const currentTimePercent = (() => {
        const h = now.getHours();
        const m = now.getMinutes();
        if (h < START_HOUR || h > END_HOUR) return null;
        return ((h - START_HOUR) * 60 + m) / (TOTAL_HOURS * 60) * 100;
    })();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card rounded-xl overflow-hidden border border-slate-200 dark:border-border shadow-sm relative">

            {/* All Day Header */}
            {allDayTasks.length > 0 && (
                <div className="p-2 border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-card/50 z-20 shrink-0">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2">Весь день</span>
                        {allDayTasks.map(item => (
                            <Popover key={item.id}>
                                <PopoverTrigger asChild>
                                    <button className="bg-white dark:bg-secondary border border-slate-200 dark:border-border px-2 py-1 rounded-md text-[11px] font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-secondary/80 transition-colors shadow-sm">
                                        {item.title}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0 overflow-hidden z-50 border-slate-200 dark:border-border">
                                    <div className="bg-slate-50 dark:bg-card border-b border-slate-100 dark:border-border p-3">
                                        <h4 className="font-semibold leading-tight text-foreground">{item.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground capitalize bg-slate-100 dark:bg-secondary px-1.5 py-0.5 rounded-full">{item.type}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-card">
                                        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                            {item.details || 'No details provided.'}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ))}
                    </div>
                </div>
            )}

            {/* Routine Header */}
            {routineItems.length > 0 && (
                <div className="p-2 border-b border-slate-100 dark:border-border bg-purple-50/30 dark:bg-purple-900/10 z-20 shrink-0">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase mr-2">Рутина</span>
                        {routineItems.map(item => (
                            <Popover key={item.id}>
                                <PopoverTrigger asChild>
                                    <button className="bg-purple-100/50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 px-2 py-1 rounded-md text-[11px] font-medium text-purple-900 dark:text-purple-100 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-sm">
                                        {item.title}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0 overflow-hidden z-50 border-slate-200 dark:border-border">
                                    <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 p-3">
                                        <h4 className="font-semibold leading-tight text-foreground">{item.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-purple-600 dark:text-purple-400 capitalize bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-full">{item.type}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-card">
                                        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                            {item.details || 'No details provided.'}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ))}
                    </div>
                </div>
            )}

            {/* Scrollable Timeline (No scroll actually, fit to height) */}
            <div id="schedule-time-table" className="flex-1 relative overflow-hidden min-h-0">
                <div className="h-full relative font-sans">

                    {/* Time Grid Background */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {hours.map((hour, i) => (
                            // Dividers
                            <div key={hour} className="absolute w-full border-t border-slate-100 dark:border-border/30 flex items-center" style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}>
                                <span className="w-14 text-right pr-3 text-[10px] text-muted-foreground bg-white/50 dark:bg-card/50 -translate-y-1/2 ">
                                    {i < hours.length - 1 && `${hour}:00`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Current Time Line */}
                    {currentTimePercent !== null && isToday && (
                        <div id="schedule-current-time-indicator" className="absolute left-0 w-full z-30 pointer-events-none flex items-center" style={{ top: `${currentTimePercent}%` }}>
                            <div className="w-14 pr-3 text-right">
                                <span className="text-[10px] font-bold text-white bg-rose-500 px-1 rounded-sm shadow-sm leading-none py-0.5">
                                    {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')}
                                </span>
                            </div>
                            <div className="flex-1 h-px bg-rose-500 shadow-sm opacity-50" />
                        </div>
                    )}

                    {/* Items */}
                    <div className="absolute top-0 left-14 right-2 bottom-0">
                        {renderItems.itemsWithPos.map(entry => {
                            const widthPercent = 100 / renderItems.totalCols;
                            const leftPercent = widthPercent * entry.colIndex;

                            // Pastel Styles - Solid Blocks
                            let styles = "";
                            if (entry.item.status === 'completed') {
                                styles = "bg-slate-100 dark:bg-card/50 border-slate-200 dark:border-border text-muted-foreground line-through opacity-70 grayscale";
                            } else {
                                switch (entry.item.type) {
                                    case 'task': styles = "bg-blue-100/80 text-blue-900 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800"; break;
                                    case 'routine': styles = "bg-purple-100/80 text-purple-900 border-purple-200 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-800"; break;
                                    case 'event': styles = "bg-orange-100/80 text-orange-900 border-orange-200 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-800"; break;
                                    default: styles = "bg-rose-100/80 text-rose-900 border-rose-200 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-800"; break;
                                }
                            }

                            return (
                                <Popover key={entry.item.id}>
                                    <PopoverTrigger asChild>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            layout
                                            className={cn(
                                                "absolute rounded-md border flex flex-col overflow-hidden cursor-pointer hover:z-50 transition-all hover:shadow-md group px-2 py-1 hover:brightness-95 dark:hover:brightness-110",
                                                styles
                                            )}
                                            style={{
                                                top: `${entry.top}%`,
                                                height: `max(${entry.height - 0.2}%, 32px)`, // Minimal gap
                                                left: `${leftPercent}%`,
                                                width: `${widthPercent - 1}%`, // Small gap
                                            }}
                                        >
                                            <div className="flex flex-col h-full min-w-0 justify-center">
                                                <div className="flex items-center gap-1.5 leading-tight">
                                                    <span className="text-[11px] font-bold truncate">
                                                        {entry.item.title}
                                                    </span>
                                                    {entry.item.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                                                </div>

                                                {/* Details if height allows */}
                                                {entry.height > 5 && (
                                                    <div className="text-[10px] opacity-80 mt-0.5 font-medium truncate">
                                                        {entry.item.time} ({entry.item.duration}m)
                                                    </div>
                                                )}

                                                {entry.height > 8 && entry.item.details && (
                                                    <div className="text-[10px] opacity-70 mt-0.5 line-clamp-1">
                                                        {entry.item.details}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-0 overflow-hidden border-slate-200 dark:border-border" align="start" side="right">
                                        <div className={cn("p-3 border-b border-white/10 dark:border-black/10 relative overflow-hidden", styles.split(' ')[0])}>
                                            {/* Slight overlay for text contrast if needed, mostly handled by text colors */}
                                            <h4 className="font-bold text-sm relative z-10">{entry.item.title}</h4>
                                            <div className="text-xs opacity-90 mt-1 flex items-center gap-2 relative z-10 font-medium">
                                                <span>{entry.item.time} - {entry.item.duration}m</span>
                                                <span className="capitalize px-1.5 py-0.5 bg-white/20 dark:bg-black/20 rounded-full text-[10px]">{entry.item.type}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-card">
                                            {entry.item.details ? (
                                                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {entry.item.details}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">
                                                    No additional details.
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
