'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/lib/store';
import { BarChart2, ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricDefinition, MetricEntry } from '@/types';
import { MetricUpdateDialog } from '@/components/features/MetricUpdateDialog';
import { format, isToday, isThisWeek } from 'date-fns';
import { uk } from 'date-fns/locale';

interface MetricPickerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const METRIC_COLORS = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-amber-500',
];

function getColorForMetric(index: number) {
    return METRIC_COLORS[index % METRIC_COLORS.length];
}

function getLastEntry(entries: MetricEntry[]): MetricEntry | null {
    if (!entries.length) return null;
    return entries.reduce((prev, curr) =>
        new Date(prev.date) > new Date(curr.date) ? prev : curr
    );
}

function getDelta(entries: MetricEntry[]): number | null {
    if (entries.length < 2) return null;
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0].value - sorted[1].value;
}

function getActivityScore(entries: MetricEntry[]): number {
    // Score: today = 100, this week = 50, older = 0 (for sorting priority)
    const last = getLastEntry(entries);
    if (!last) return 0;
    if (isToday(new Date(last.date))) return 100;
    if (isThisWeek(new Date(last.date))) return 50;
    return 0;
}

export function MetricPickerSheet({ open, onOpenChange }: MetricPickerSheetProps) {
    const { state } = useData();
    const [selectedMetric, setSelectedMetric] = useState<{ metric: MetricDefinition; entries: MetricEntry[]; color: string } | null>(null);

    const sortedMetrics = useMemo(() => {
        return state.metricDefinitions
            .map((metric, index) => {
                const entries = state.metricEntries.filter(e => e.metricId === metric.id);
                const score = getActivityScore(entries);
                return { metric, entries, color: getColorForMetric(index), score };
            })
            .sort((a, b) => b.score - a.score);
    }, [state.metricDefinitions, state.metricEntries]);

    const handleMetricClick = (item: typeof sortedMetrics[0]) => {
        setSelectedMetric({ metric: item.metric, entries: item.entries, color: item.color });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95%] sm:max-w-md bg-white dark:bg-card border-none shadow-2xl p-0 overflow-hidden">
                    <div className="sr-only">
                        <DialogTitle>Оновити метрику</DialogTitle>
                    </div>

                    {/* Header */}
                    <div className="px-6 pt-7 pb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center">
                                <BarChart2 className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight">Оновити метрику</h2>
                        </div>
                        <p className="text-sm text-muted-foreground ml-12">
                            Оберіть метрику для внесення нового значення
                        </p>
                    </div>

                    {/* Metrics List */}
                    <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto space-y-2">
                        {sortedMetrics.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7 text-muted-foreground" />
                                </div>
                                <p className="font-bold text-foreground">Немає метрик</p>
                                <p className="text-sm text-muted-foreground">Спочатку створіть метрику в розділі Аналітика</p>
                            </div>
                        ) : (
                            sortedMetrics.map(({ metric, entries, color, score }) => {
                                const lastEntry = getLastEntry(entries);
                                const delta = getDelta(entries);
                                const isUpdatedToday = lastEntry ? isToday(new Date(lastEntry.date)) : false;

                                return (
                                    <button
                                        key={metric.id}
                                        onClick={() => handleMetricClick({ metric, entries, color, score })}
                                        className="w-full flex items-center gap-4 p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 rounded-2xl transition-all group"
                                    >
                                        {/* Color dot */}
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                                            <BarChart2 className="w-5 h-5 text-white" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                                    {metric.name}
                                                </p>
                                                {isUpdatedToday && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                        Сьогодні
                                                    </span>
                                                )}
                                            </div>
                                            {lastEntry ? (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {lastEntry.value} {metric.unit} · {format(new Date(lastEntry.date), 'd MMM', { locale: uk })}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground/60 mt-0.5">Ще немає записів</p>
                                            )}
                                        </div>

                                        {/* Delta indicator */}
                                        {delta !== null && (
                                            <div className={cn(
                                                "flex items-center gap-0.5 text-xs font-bold shrink-0",
                                                delta > 0 ? "text-emerald-500" : delta < 0 ? "text-rose-500" : "text-muted-foreground"
                                            )}>
                                                {delta > 0 ? <ArrowUpRight className="w-4 h-4" /> : delta < 0 ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                                {Math.abs(delta)}
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MetricUpdateDialog shown when metric selected */}
            {selectedMetric && (
                <MetricUpdateDialog
                    open={!!selectedMetric}
                    onOpenChange={(open) => {
                        if (!open) setSelectedMetric(null);
                    }}
                    metric={selectedMetric.metric}
                    entries={selectedMetric.entries}
                    color={selectedMetric.color}
                />
            )}
        </>
    );
}
