'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Timer, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

export interface FocusSessionLog {
    id: string;
    focusItemId: string | undefined;
    focusItemTitle: string;
    durationSeconds: number;
    startTime: string; // ISO
    endTime: string; // ISO
}

const FOCUS_HISTORY_KEY = 'nexis-focus-history';

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} год ${m} хв`;
    if (m > 0) return `${m} хв ${s} сек`;
    return `${s} сек`;
}

interface FocusHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FocusHistoryModal({ open, onOpenChange }: FocusHistoryModalProps) {
    const [history, setHistory] = useState<FocusSessionLog[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        if (open) {
            try {
                const raw = localStorage.getItem(FOCUS_HISTORY_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as FocusSessionLog[];
                    // Sort descending by startTime
                    parsed.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
                    setHistory(parsed);
                } else {
                    setHistory([]);
                }
            } catch {
                setHistory([]);
            }
        }
    }, [open]);

    const filteredHistory = history.filter(log => isSameDay(parseISO(log.startTime), selectedDate));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 md:p-8 border-border/50 shadow-xl bg-card">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Timer className="w-6 h-6 text-orange-500" />
                        Історія сесій фокусу
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    {/* Date picker toggle */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            <CalendarIcon className="w-4 h-4 text-orange-500" />
                            <span className="font-bold text-sm">
                                {format(selectedDate, 'd MMMM yyyy', { locale: uk })}
                            </span>
                        </button>
                    </div>

                    {showCalendar && (
                        <div className="p-4 bg-white dark:bg-slate-900 border border-border/50 rounded-2xl animate-in fade-in slide-in-from-top-2 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    if (date) setSelectedDate(date);
                                    setShowCalendar(false);
                                }}
                                className="mx-auto"
                            />
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="flex flex-col gap-4">
                        {filteredHistory.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-border">
                                <Timer className="w-10 h-10 text-muted-foreground/30 mb-3" />
                                <p className="font-bold text-muted-foreground">Немає сесій за цей день</p>
                                <p className="text-xs text-muted-foreground/80 mt-1 max-w-[200px]">Увійдіть у фокус-режим, щоб записати свою продуктивність</p>
                            </div>
                        ) : (
                            filteredHistory.map((log) => (
                                <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-border/50 shadow-sm">
                                    <div className="w-12 h-12 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-foreground text-sm truncate mb-1">
                                            {log.focusItemTitle}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <Timer className="w-3.5 h-3.5 opacity-70" />
                                                {formatDuration(log.durationSeconds)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 opacity-70">
                                                {format(parseISO(log.startTime), 'HH:mm')} - {format(parseISO(log.endTime), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
