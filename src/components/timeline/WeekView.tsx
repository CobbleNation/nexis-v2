'use client';

import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useMemo } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from 'next/navigation';

interface WeekViewProps {
    date: Date;
    items: ScheduleItem[];
    onToggleItem: (id: string) => void;
}

// 06:00 to 23:00 (17 hours) - Fits screen better
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

export function WeekView({ date, items, onToggleItem }: WeekViewProps) {
    const router = useRouter();
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const today = new Date();

    // Create ticks for the grid
    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

    const currentTimePercent = useMemo(() => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        if (hour < START_HOUR || hour > END_HOUR) return null;
        return ((hour - START_HOUR) * 60 + minute) / (TOTAL_HOURS * 60) * 100;
    }, []);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm">
            {/* Header: Days */}
            <div className="flex border-b border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-card/50 shrink-0">
                <div className="w-12 shrink-0 border-r border-slate-100 dark:border-border/50" />
                {days.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    return (
                        <div key={day.toISOString()} className="flex-1 py-3 text-center border-r border-slate-100 dark:border-border/50 last:border-r-0">
                            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wider">
                                {format(day, 'EEE', { locale: uk })}
                            </div>
                            <div className={cn(
                                "inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold transition-all",
                                isToday ? "bg-orange-500 text-white shadow-md shadow-orange-500/25" : "text-foreground"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content: Fit to Screen (No Scroll) */}
            <div id="schedule-time-table" className="flex-1 relative overflow-hidden min-h-0">
                <div className="flex h-full relative">
                    {/* Time Axis */}
                    <div className="w-12 shrink-0 border-r border-slate-100 dark:border-border/50 bg-slate-50/30 dark:bg-card/30 z-20 relative h-full">
                        {hours.map((hour, i) => (
                            // Skip last label to avoid overflow
                            i < hours.length - 1 && (
                                <div key={hour} className="absolute w-full text-right pr-2 text-[10px] text-muted-foreground font-medium -translate-y-1/2 leading-none"
                                    style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}>
                                    {hour}:00
                                </div>
                            )
                        ))}
                    </div>

                    {/* Grid Columns */}
                    <div className="flex flex-1 relative h-full">
                        {/* Horizontal Lines (Grid) */}
                        {hours.map((hour, i) => (
                            <div key={hour} className="absolute w-full border-t border-slate-100 dark:border-border/30"
                                style={{ top: `${(i / TOTAL_HOURS) * 100}%` }} />
                        ))}

                        {/* Current Time Indicator */}
                        {currentTimePercent !== null && (
                            <div id="schedule-current-time-indicator" className="absolute w-full border-t-2 border-red-500/50 z-30 pointer-events-none" style={{ top: `${currentTimePercent}%` }}>
                                <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500 hidden md:block" />
                            </div>
                        )}

                        {days.map((day, dayIndex) => {
                            const dayItems = items.filter(item => isSameDay(new Date(item.date), day));

                            return (
                                <div key={day.toISOString()} className="flex-1 border-r border-slate-100 dark:border-border/50 last:border-r-0 relative h-full">
                                    {dayItems.map(item => {
                                        if (!item.time) return null;
                                        const [h, m] = item.time.split(':').map(Number);
                                        if (h < START_HOUR || h > END_HOUR) return null;

                                        const minutesFromStart = (h - START_HOUR) * 60 + m;
                                        const totalMinutes = TOTAL_HOURS * 60;
                                        const topPercent = (minutesFromStart / totalMinutes) * 100;
                                        const durationPercent = ((item.duration || 60) / totalMinutes) * 100;

                                        // Colors based on type (Pastel Blocks)
                                        let bgClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

                                        if (item.status === 'completed') {
                                            bgClass = "bg-slate-100 dark:bg-card/50 border-slate-200 dark:border-border text-muted-foreground line-through opacity-70 grayscale";
                                        } else {
                                            switch (item.type) {
                                                case 'task': bgClass = "bg-blue-100/80 text-blue-900 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800"; break;
                                                case 'routine': bgClass = "bg-purple-100/80 text-purple-900 border-purple-200 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-800"; break;
                                                case 'event': bgClass = "bg-orange-100/80 text-orange-900 border-orange-200 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-800"; break;
                                                case 'deadline': bgClass = "bg-rose-100/80 text-rose-900 border-rose-200 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-800"; break;
                                            }
                                        }

                                        return (
                                            <Popover key={item.id}>
                                                <PopoverTrigger asChild>
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className={cn(
                                                            "absolute left-0.5 right-0.5 rounded px-1.5 py-1 text-[10px] shadow-sm overflow-hidden hover:z-20 hover:shadow-md transition-all cursor-pointer flex flex-col justify-center border",
                                                            bgClass
                                                        )}
                                                        style={{
                                                            top: `${topPercent}%`,
                                                            height: `max(${durationPercent}%, 24px)`
                                                        }}
                                                    >
                                                        <div className="font-bold truncate leading-tight">{item.title}</div>
                                                        {/* Only show time if height allows (approx > 4% of screen) */}
                                                        {durationPercent > 4 && (
                                                            <div className="opacity-80 truncate text-[9px] font-medium">{item.time}</div>
                                                        )}
                                                    </motion.div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-0 overflow-hidden border-slate-200 dark:border-border" align="start" side="bottom">
                                                    <div className={cn("p-3 border-b border-white/10 dark:border-black/10 relative", bgClass.split(' ')[0])}>
                                                        <h4 className="font-bold text-sm relative z-10">{item.title}</h4>
                                                        <div className="text-xs opacity-90 mt-1 flex items-center gap-2 relative z-10 font-medium">
                                                            <span>{item.time} ({item.duration}m)</span>
                                                            <span className="capitalize px-1.5 py-0.5 bg-white/20 dark:bg-black/20 rounded-full text-[10px]">{item.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white dark:bg-card">
                                                        {item.details ? (
                                                            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                                {item.details}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground italic">
                                                                No additional details.
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
