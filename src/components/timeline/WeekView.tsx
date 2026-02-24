'use client';

import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useMemo, useRef, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Edit, Trash2, Star } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';

interface WeekViewProps {
    date: Date;
    items: ScheduleItem[];
    onToggleItem: (id: string) => void;
    onEditItem?: (id: string, type: string) => void;
    onCompleteItem?: (id: string, type: string) => void;
    onDeleteItem?: (id: string, type: string) => void;
    onDayClick?: (date: Date) => void;
    onTimeSelect?: (date: Date, time: string) => void;
}

const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 56; // slightly smaller for week view

export function WeekView({ date, items, onToggleItem, onEditItem, onCompleteItem, onDeleteItem, onDayClick, onTimeSelect }: WeekViewProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const today = new Date();
    const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

    const [now, setNow] = useState(new Date());
    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to current time
    useEffect(() => {
        if (scrollRef.current) {
            const h = now.getHours();
            const m = now.getMinutes();
            if (h >= START_HOUR && h <= END_HOUR) {
                const offsetPx = ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT - 80;
                scrollRef.current.scrollTop = Math.max(0, offsetPx);
            }
        }
    }, []);

    const currentTimePx = useMemo(() => {
        const hour = now.getHours();
        const minute = now.getMinutes();
        if (hour < START_HOUR || hour > END_HOUR) return null;
        return ((hour - START_HOUR) * 60 + minute) / 60 * HOUR_HEIGHT;
    }, [now]);

    const totalGridHeight = TOTAL_HOURS * HOUR_HEIGHT;

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
        <div className="flex flex-col h-full bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm">
            {/* Header: Days */}
            <div className="flex border-b border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-card/50 shrink-0">
                <div className="w-12 shrink-0 border-r border-slate-100 dark:border-border/50" />
                {days.map((day) => {
                    const isToday = isSameDay(day, today);
                    return (
                        <div
                            key={day.toISOString()}
                            className="flex-1 py-2.5 text-center border-r border-slate-100 dark:border-border/50 last:border-r-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-secondary/20 transition-colors"
                            onClick={() => onDayClick?.(day)}
                        >
                            <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wider">
                                {format(day, 'EEE', { locale: uk })}
                            </div>
                            <div className={cn(
                                "inline-flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold transition-all",
                                isToday ? "bg-orange-500 text-white shadow-md shadow-orange-500/25" : "text-foreground hover:bg-muted"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scrollable Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
                <div className="flex relative" style={{ height: totalGridHeight }}>
                    {/* Time Axis */}
                    <div className="w-12 shrink-0 border-r border-slate-100 dark:border-border/50 bg-slate-50/30 dark:bg-card/30 z-20 relative">
                        {hours.map((hour, i) => (
                            i < hours.length - 1 && (
                                <div
                                    key={hour}
                                    className="absolute w-full text-right pr-2 text-[10px] text-muted-foreground font-medium -translate-y-1/2 leading-none select-none"
                                    style={{ top: i * HOUR_HEIGHT }}
                                >
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                            )
                        ))}
                    </div>

                    {/* Grid Columns */}
                    <div className="flex flex-1 relative">
                        {/* Hour Lines */}
                        {hours.map((hour, i) => (
                            <div key={hour} className="absolute w-full border-t border-slate-100 dark:border-border/30"
                                style={{ top: i * HOUR_HEIGHT }} />
                        ))}
                        {/* Half-hour lines */}
                        {hours.slice(0, -1).map((hour, i) => (
                            <div key={`h-${hour}`} className="absolute w-full border-t border-slate-50 dark:border-border/15"
                                style={{ top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
                        ))}

                        {/* Current Time */}
                        {currentTimePx !== null && (
                            <div className="absolute w-full z-30 pointer-events-none flex items-center" style={{ top: currentTimePx }}>
                                <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 hidden md:block" />
                                <div className="w-full h-[2px] bg-red-500/60" />
                            </div>
                        )}

                        {/* Day Columns */}
                        {days.map((day) => {
                            const dayItems = items.filter(item => item.time && isSameDay(new Date(item.date), day));

                            // Calculate Grid Positions (Overlaps)
                            const renderItems = (() => {
                                const itemsWithPos = dayItems.map(item => {
                                    const [h, m] = item.time!.split(':').map(Number);
                                    if (h < START_HOUR || h > END_HOUR) return null;
                                    const topPx = ((h - START_HOUR) * 60 + m) / 60 * HOUR_HEIGHT;
                                    const heightPx = Math.max(((item.duration || 60) / 60) * HOUR_HEIGHT, 24);
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
                            })();

                            return (
                                <div key={day.toISOString()} className="flex-1 min-w-[120px] md:min-w-0 border-r border-slate-100 dark:border-border/50 last:border-r-0 relative">
                                    {/* Clickable Grid Area */}
                                    <div
                                        className="absolute inset-0 cursor-crosshair z-0"
                                        onClick={(e) => {
                                            if (!onTimeSelect) return;
                                            const offsetY = e.nativeEvent.offsetY;
                                            const totalMinutes = (offsetY / HOUR_HEIGHT) * 60;
                                            const hours = Math.floor(totalMinutes / 60) + START_HOUR;
                                            const minutes = Math.floor((totalMinutes % 60) / 30) * 30; // Round to nearest 30 mins
                                            if (hours >= START_HOUR && hours <= END_HOUR) {
                                                const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                                onTimeSelect(day, timeStr);
                                            }
                                        }}
                                    />

                                    {renderItems.itemsWithPos.map(entry => {
                                        const widthPercent = 100 / renderItems.totalCols;
                                        const leftPercent = widthPercent * entry.colIndex;
                                        const styles = getItemStyles(entry.item);

                                        return (
                                            <Popover key={entry.item.id}>
                                                <PopoverTrigger asChild>
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className={cn(
                                                            "absolute rounded-md border flex overflow-hidden hover:z-20 hover:shadow-lg transition-all cursor-pointer group",
                                                            styles.bg, styles.border
                                                        )}
                                                        style={{
                                                            top: entry.top,
                                                            height: Math.max(entry.height - 2, 22),
                                                            left: `${leftPercent}%`,
                                                            width: `calc(${widthPercent}% - 4px)`
                                                        }}
                                                    >
                                                        <div className={cn("w-0.5 shrink-0", styles.accent)} />
                                                        <div className={cn("flex flex-col justify-center px-1.5 py-0.5 flex-1 min-w-0", styles.text)}>
                                                            <div className="flex items-center gap-1 leading-tight">
                                                                {entry.item.isFocus && <Star className="w-2.5 h-2.5 text-amber-500 shrink-0 fill-amber-500" />}
                                                                <span className="font-bold truncate text-[10px]">{entry.item.title}</span>
                                                                {entry.item.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
                                                            </div>
                                                            {entry.height > 30 && (
                                                                <div className="opacity-70 truncate text-[9px] font-medium flex items-center gap-1 mt-0.5">
                                                                    <Clock className="w-2 h-2" />
                                                                    {entry.item.time}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                </PopoverTrigger>
                                                <ItemPopover
                                                    item={entry.item}
                                                    styles={styles}
                                                    getTypeLabel={getTypeLabel}
                                                    onEdit={onEditItem}
                                                    onComplete={onCompleteItem}
                                                    onDelete={onDeleteItem}
                                                />
                                            </Popover>
                                        );
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
        <PopoverContent className="w-72 p-0 overflow-hidden border-slate-200 dark:border-border shadow-xl rounded-xl" align="start" side="bottom">
            {/* Header */}
            <div className={cn("p-3 border-b relative", styles.bg, styles.border)}>
                <div className={cn("flex items-start gap-2", styles.text)}>
                    <div className={cn("w-1 min-h-[28px] rounded-full shrink-0 self-stretch", styles.accent)} />
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
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap line-clamp-3">{item.details}</p>
                ) : (
                    <p className="text-sm text-muted-foreground/60 italic">Без деталей</p>
                )}
            </div>
            {/* Actions */}
            {(onComplete || onEdit || onDelete) && (
                <div className="border-t border-slate-100 dark:border-border p-2 flex gap-1.5 bg-slate-50/50 dark:bg-card/50">
                    {onComplete && item.type === 'task' && item.status !== 'completed' && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                            onClick={() => onComplete(item.entityId, item.type)}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Виконано
                        </Button>
                    )}
                    {onEdit && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 flex-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                            onClick={() => onEdit(item.entityId, item.type)}>
                            <Edit className="w-3.5 h-3.5" /> Редагувати
                        </Button>
                    )}
                    {onDelete && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            onClick={() => onDelete(item.entityId, item.type)}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            )}
        </PopoverContent>
    );
}
