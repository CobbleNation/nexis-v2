'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/lib/store';
import { BarChart2, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Search, Clock, CheckCircle2 } from 'lucide-react';
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
    'bg-teal-500', 'bg-violet-500',
];

function getColorForMetric(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return METRIC_COLORS[Math.abs(hash) % METRIC_COLORS.length];
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
    const last = getLastEntry(entries);
    if (!last) return 0;
    if (isToday(new Date(last.date))) return 100;
    if (isThisWeek(new Date(last.date))) return 50;
    return 10;
}

export function MetricPickerSheet({ open, onOpenChange }: MetricPickerSheetProps) {
    const { state } = useData();
    const [selectedArea, setSelectedArea] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [updateTarget, setUpdateTarget] = useState<{ metric: MetricDefinition; entries: MetricEntry[]; color: string } | null>(null);

    // Build enriched list
    const enrichedMetrics = useMemo(() => {
        return state.metricDefinitions.map(metric => {
            const entries = state.metricEntries.filter(e => e.metricId === metric.id);
            return {
                metric,
                entries,
                color: getColorForMetric(metric.id),
                score: getActivityScore(entries),
                lastEntry: getLastEntry(entries),
                delta: getDelta(entries),
            };
        }).sort((a, b) => b.score - a.score);
    }, [state.metricDefinitions, state.metricEntries]);

    // Areas that have metrics
    const usedAreas = useMemo(() => {
        const areaIds = new Set(state.metricDefinitions.map(m => m.areaId).filter(Boolean));
        return state.areas.filter(a => areaIds.has(a.id));
    }, [state.metricDefinitions, state.areas]);

    // Filtered metrics
    const filteredMetrics = useMemo(() => {
        return enrichedMetrics.filter(({ metric }) => {
            const matchesArea = selectedArea === 'all' || metric.areaId === selectedArea;
            const matchesSearch = !search || metric.name.toLowerCase().includes(search.toLowerCase());
            return matchesArea && matchesSearch;
        });
    }, [enrichedMetrics, selectedArea, search]);

    const handleMetricClick = (item: typeof enrichedMetrics[0]) => {
        // Close picker → open update dialog
        onOpenChange(false);
        setTimeout(() => {
            setUpdateTarget({ metric: item.metric, entries: item.entries, color: item.color });
        }, 150); // slight delay for animation
    };

    const handlePickerClose = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setSearch('');
            setSelectedArea('all');
        }
    };

    return (
        <>
            {/* ── PICKER DIALOG ────────────────────────────────────────────── */}
            <Dialog open={open} onOpenChange={handlePickerClose}>
                <DialogContent className="w-[96%] sm:max-w-lg bg-white dark:bg-card border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
                    <div className="sr-only">
                        <DialogTitle>Оновити метрику</DialogTitle>
                    </div>

                    {/* Gradient Header */}
                    <div className="relative bg-gradient-to-br from-purple-600 to-indigo-600 px-6 pt-6 pb-5 overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-3 mb-1 relative z-10">
                            <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <BarChart2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-white">Оновити метрику</h2>
                                <p className="text-purple-200 text-xs">Оберіть метрику для внесення нового значення</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mt-4 z-10">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Пошук метрики..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-purple-300 focus:outline-none focus:bg-white/25 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Area filter chips */}
                    {usedAreas.length > 1 && (
                        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-border">
                            <button
                                onClick={() => setSelectedArea('all')}
                                className={cn(
                                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                    selectedArea === 'all'
                                        ? 'bg-purple-500 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                                )}
                            >
                                Всі
                            </button>
                            {usedAreas.map(area => (
                                <button
                                    key={area.id}
                                    onClick={() => setSelectedArea(area.id)}
                                    className={cn(
                                        "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                        selectedArea === area.id
                                            ? 'text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                                    )}
                                    style={selectedArea === area.id ? { backgroundColor: area.color || '#8b5cf6' } : {}}
                                >
                                    <span
                                        className={cn("w-2 h-2 rounded-full shrink-0", selectedArea === area.id && 'bg-white/50')}
                                        style={selectedArea !== area.id ? { backgroundColor: area.color || '#8b5cf6' } : {}}
                                    />
                                    {area.title}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Metrics list */}
                    <div className="max-h-[55vh] overflow-y-auto px-4 py-3 space-y-2">
                        {filteredMetrics.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7 text-muted-foreground" />
                                </div>
                                <p className="font-bold text-foreground text-sm">
                                    {search ? 'Нічого не знайдено' : 'Немає метрик'}
                                </p>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    {search ? 'Спробуйте інший запит' : 'Створіть метрику в розділі Аналітика'}
                                </p>
                            </div>
                        ) : (
                            filteredMetrics.map(({ metric, entries, color, lastEntry, delta }) => {
                                const isUpdatedToday = lastEntry ? isToday(new Date(lastEntry.date)) : false;
                                const isUpdatedWeek = !isUpdatedToday && lastEntry ? isThisWeek(new Date(lastEntry.date)) : false;
                                const area = state.areas.find(a => a.id === metric.areaId);

                                return (
                                    <button
                                        key={metric.id}
                                        onClick={() => handleMetricClick({ metric, entries, color, score: getActivityScore(entries), lastEntry, delta })}
                                        className="w-full flex items-center gap-4 p-4 text-left bg-slate-50 dark:bg-slate-800/40 hover:bg-purple-50 dark:hover:bg-purple-950/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-800/40 rounded-2xl transition-all group active:scale-[0.99]"
                                    >
                                        {/* Color icon */}
                                        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", color)}>
                                            <BarChart2 className="w-5 h-5 text-white" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                                                    {metric.name}
                                                </p>
                                                {isUpdatedToday && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Сьогодні
                                                    </span>
                                                )}
                                                {isUpdatedWeek && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                                        <Clock className="w-2.5 h-2.5" /> Цього тижня
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {area && (
                                                    <span className="text-[10px] font-semibold text-muted-foreground/70 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: area.color || '#8b5cf6' }} />
                                                        {area.title}
                                                    </span>
                                                )}
                                                {lastEntry ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {lastEntry.value} {metric.unit} · {format(new Date(lastEntry.date), 'd MMM', { locale: uk })}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground/50">Немає записів</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delta */}
                                        {delta !== null && (
                                            <div className={cn(
                                                "flex items-center gap-0.5 text-xs font-black shrink-0 px-2 py-1 rounded-xl",
                                                delta > 0
                                                    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                                                    : delta < 0
                                                        ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
                                                        : "text-muted-foreground bg-slate-100 dark:bg-slate-800"
                                            )}>
                                                {delta > 0
                                                    ? <ArrowUpRight className="w-3.5 h-3.5" />
                                                    : delta < 0
                                                        ? <ArrowDownRight className="w-3.5 h-3.5" />
                                                        : <Minus className="w-3.5 h-3.5" />
                                                }
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

            {/* ── UPDATE DIALOG (opens after picker closes) ──────────────── */}
            {updateTarget && (
                <MetricUpdateDialog
                    open={!!updateTarget}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) setUpdateTarget(null);
                    }}
                    metric={updateTarget.metric}
                    entries={updateTarget.entries}
                    color={updateTarget.color}
                />
            )}
        </>
    );
}
