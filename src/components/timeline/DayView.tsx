'use client';

import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, Edit, Trash2, Circle, MapPin, Star } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';

interface DayViewProps {
    date: Date;
    items: ScheduleItem[];
    onToggleItem: (id: string) => void;
    onEditItem?: (id: string, type: string) => void;
    onCompleteItem?: (id: string, type: string) => void;
    onDeleteItem?: (id: string, type: string) => void;
}

const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 64; // px per hour — fixed for scrolling

export function DayView({ date, items, onToggleItem, onEditItem, onCompleteItem, onDeleteItem }: DayViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

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

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (scrollRef.current && isToday) {
            const h = now.getHours();
            const m = now.getMinutes();
            if (h >= START_HOUR && h <= END_HOUR) {
                const offsetPx = ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT - 100;
                scrollRef.current.scrollTop = Math.max(0, offsetPx);
            }
        }
    }, [isToday]); // only on mount / date change

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
        const totalPx = TOTAL_HOURS * HOUR_HEIGHT;
        const itemsWithPos = timedItems.map(item => {
            const [h, m] = item.time!.split(':').map(Number);
            if (h < START_HOUR || h > END_HOUR) return null;
            const topPx = ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
            const heightPx = Math.max(((item.duration || 60) / 60) * HOUR_HEIGHT, 28);
            return { item, top: topPx, height: heightPx, colIndex: 0 };
        }).filter(Boolean) as { item: ScheduleItem; top: number; height: number; colIndex: number }[];

        itemsWithPos.sort((a, b) => a.top - b.top || b.height - a.height);

        // Column Assignment
        const columns: typeof itemsWithPos[] = [];
        itemsWithPos.forEach(entry => {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
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

        return { itemsWithPos, totalCols: Math.max(columns.length, 1) };
    }, [timedItems]);

    const currentTimePx = (() => {
        const h = now.getHours();
        const m = now.getMinutes();
        if (h < START_HOUR || h > END_HOUR) return null;
        return ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
    })();

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

    const totalGridHeight = TOTAL_HOURS * HOUR_HEIGHT;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card rounded-xl overflow-hidden border border-slate-200 dark:border-border shadow-sm">

            {/* All Day Header */}
            {(allDayTasks.length > 0 || routineItems.length > 0) && (
                <div className="border-b border-slate-100 dark:border-border shrink-0">
                    {allDayTasks.length > 0 && (
                        <div className="px-3 py-2 flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1 w-12 text-right pr-2">День</span>
                            {allDayTasks.map(item => {
                                const styles = getItemStyles(item);
                                return (
                                    <Popover key={item.id}>
                                        <PopoverTrigger asChild>
                                            <button className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors shadow-sm hover:shadow-md", styles.bg, styles.border, styles.text)}>
                                                {item.title}
                                            </button>
                                        </PopoverTrigger>
                                        <ItemPopover item={item} styles={styles} getTypeLabel={getTypeLabel} onEdit={onEditItem} onComplete={onCompleteItem} onDelete={onDeleteItem} />
                                    </Popover>
                                );
                            })}
                        </div>
                    )}
                    {routineItems.length > 0 && (
                        <div className="px-3 py-2 bg-purple-50/30 dark:bg-purple-900/5 flex flex-wrap gap-1.5 items-center border-t border-slate-50 dark:border-border/30">
                            <span className="text-[10px] font-bold text-purple-500/70 uppercase mr-1 w-12 text-right pr-2">Рутина</span>
                            {routineItems.map(item => (
                                <Popover key={item.id}>
                                    <PopoverTrigger asChild>
                                        <button className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 text-purple-900 dark:text-purple-100 hover:shadow-md transition-colors shadow-sm">
                                            {item.title}
                                        </button>
                                    </PopoverTrigger>
                                    <ItemPopover item={item} styles={getItemStyles(item)} getTypeLabel={getTypeLabel} onEdit={onEditItem} onComplete={onCompleteItem} onDelete={onDeleteItem} />
                                </Popover>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Scrollable Timeline */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative custom-scrollbar">
                <div className="relative" style={{ height: totalGridHeight }}>

                    {/* Hour Grid Lines */}
                    {hours.map((hour, i) => (
                        <div
                            key={hour}
                            className="absolute w-full flex items-start"
                            style={{ top: i * HOUR_HEIGHT }}
                        >
                            <span className="w-14 text-right pr-3 text-[10px] text-muted-foreground font-medium -translate-y-1/2 select-none">
                                {i < hours.length - 1 && `${String(hour).padStart(2, '0')}:00`}
                            </span>
                            <div className="flex-1 border-t border-slate-100 dark:border-border/30" />
                        </div>
                    ))}

                    {/* Half-hour lines (subtle) */}
                    {hours.slice(0, -1).map((hour, i) => (
                        <div
                            key={`half-${hour}`}
                            className="absolute w-full flex items-start"
                            style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                        >
                            <span className="w-14" />
                            <div className="flex-1 border-t border-slate-50 dark:border-border/15" />
                        </div>
                    ))}

                    {/* Current Time Line */}
                    {currentTimePx !== null && isToday && (
                        <div
                            className="absolute left-0 w-full z-30 pointer-events-none flex items-center"
                            style={{ top: currentTimePx }}
                        >
                            <div className="w-14 pr-1 text-right">
                                <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 rounded-sm shadow-sm leading-none py-0.5">
                                    {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                                </span>
                            </div>
                            <div className="relative flex-1">
                                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-md" />
                                <div className="h-[2px] bg-red-500 shadow-sm" />
                            </div>
                        </div>
                    )}

                    {/* Schedule Items */}
                    <div className="absolute top-0 left-14 right-2 bottom-0">
                        {renderItems.itemsWithPos.map(entry => {
                            const widthPercent = 100 / renderItems.totalCols;
                            const leftPercent = widthPercent * entry.colIndex;
                            const styles = getItemStyles(entry.item);

                            return (
                                <Popover key={entry.item.id}>
                                    <PopoverTrigger asChild>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            layout
                                            className={cn(
                                                "absolute rounded-lg border flex overflow-hidden cursor-pointer hover:z-50 transition-all hover:shadow-lg group",
                                                styles.bg, styles.border
                                            )}
                                            style={{
                                                top: entry.top,
                                                height: Math.max(entry.height - 2, 28),
                                                left: `${leftPercent}%`,
                                                width: `${widthPercent - 1}%`,
                                            }}
                                        >
                                            {/* Left accent bar */}
                                            <div className={cn("w-1 shrink-0 rounded-l-lg", styles.accent)} />

                                            <div className={cn("flex flex-col min-w-0 justify-center px-2 py-1 flex-1", styles.text)}>
                                                <div className="flex items-center gap-1.5 leading-tight">
                                                    {entry.item.isFocus && <Star className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />}
                                                    <span className="text-[11px] font-bold truncate">{entry.item.title}</span>
                                                    {entry.item.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                                                </div>

                                                {entry.height > 36 && (
                                                    <div className="text-[10px] opacity-70 mt-0.5 font-medium truncate flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {entry.item.time} · {entry.item.duration}хв
                                                    </div>
                                                )}

                                                {entry.height > 56 && entry.item.details && (
                                                    <div className="text-[10px] opacity-60 mt-0.5 line-clamp-1">{entry.item.details}</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </PopoverTrigger>
                                    <ItemPopover item={entry.item} styles={styles} getTypeLabel={getTypeLabel} onEdit={onEditItem} onComplete={onCompleteItem} onDelete={onDeleteItem} />
                                </Popover>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Shared Popover Component ---
function ItemPopover({ item, styles, getTypeLabel, onEdit, onComplete, onDelete }: {
    item: ScheduleItem;
    styles: { bg: string; border: string; text: string; accent: string };
    getTypeLabel: (type: string) => string;
    onEdit?: (id: string, type: string) => void;
    onComplete?: (id: string, type: string) => void;
    onDelete?: (id: string, type: string) => void;
}) {
    return (
        <PopoverContent className="w-72 p-0 overflow-hidden border-slate-200 dark:border-border shadow-xl rounded-xl" align="start" side="right">
            {/* Header */}
            <div className={cn("p-3 border-b relative overflow-hidden", styles.bg, styles.border)}>
                <div className={cn("flex items-start gap-2", styles.text)}>
                    <div className={cn("w-1 h-full min-h-[28px] rounded-full shrink-0 self-stretch", styles.accent)} />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/30 dark:bg-black/20">
                                {getTypeLabel(item.type)}
                            </span>
                            {item.time && (
                                <span className="text-[11px] font-medium flex items-center gap-1 opacity-80">
                                    <Clock className="w-3 h-3" />
                                    {item.time}{item.duration ? ` · ${item.duration}хв` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="p-3 bg-white dark:bg-card">
                {item.details ? (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">{item.details}</p>
                ) : (
                    <p className="text-sm text-muted-foreground/60 italic">Без деталей</p>
                )}
            </div>

            {/* Action Buttons */}
            {(onComplete || onEdit || onDelete) && (
                <div className="border-t border-slate-100 dark:border-border p-2 flex gap-1.5 bg-slate-50/50 dark:bg-card/50">
                    {onComplete && item.type === 'task' && item.status !== 'completed' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1.5 flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                            onClick={() => onComplete(item.entityId, item.type)}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Виконано
                        </Button>
                    )}
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1.5 flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                            onClick={() => onEdit(item.entityId, item.type)}
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Редагувати
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            onClick={() => onDelete(item.entityId, item.type)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            )}
        </PopoverContent>
    );
}
