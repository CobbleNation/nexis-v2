import * as React from "react"
import { MetricDefinition, MetricEntry } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useData } from "@/lib/store"
import { toast } from "sonner"
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { format, formatDistanceToNow } from "date-fns"
import { uk } from "date-fns/locale"
import { Calendar, ArrowUp, ArrowDown, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetricHistoryList } from "./MetricHistoryList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MetricUpdateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    metric: MetricDefinition
    entries: MetricEntry[]
    color?: string // Tailwind bg class, e.g., 'bg-emerald-500'
}

export function MetricUpdateDialog({ open, onOpenChange, metric, entries, color = 'bg-indigo-600' }: MetricUpdateDialogProps) {
    const [value, setValue] = React.useState('')
    const [mode, setMode] = React.useState<'delta' | 'absolute'>('delta') // Default to Delta for easier updates
    const { dispatch } = useData()

    // Helper to get hex for chart
    const getColorHex = (bgClass: string) => {
        if (bgClass.includes('emerald')) return '#10b981';
        if (bgClass.includes('green')) return '#22c55e';
        if (bgClass.includes('blue')) return '#3b82f6';
        if (bgClass.includes('indigo')) return '#6366f1';
        if (bgClass.includes('cyan')) return '#06b6d4';
        if (bgClass.includes('sky')) return '#0ea5e9';
        if (bgClass.includes('violet')) return '#8b5cf6';
        if (bgClass.includes('purple')) return '#a855f7';
        if (bgClass.includes('fuchsia')) return '#d946ef';
        if (bgClass.includes('pink')) return '#ec4899';
        if (bgClass.includes('rose')) return '#f43f5e';
        if (bgClass.includes('red')) return '#ef4444';
        if (bgClass.includes('orange')) return '#f97316';
        if (bgClass.includes('amber')) return '#f59e0b';
        if (bgClass.includes('yellow')) return '#eab308';
        return '#6366f1'; // default indigo
    };

    const accentHex = getColorHex(color);
    // Generate lighter/subtle background for badges from the main color
    const badgeBgClass = color.replace('bg-', 'bg-').replace('-500', '-50').replace('-600', '-50');
    const badgeTextClass = color.replace('bg-', 'text-').replace('-500', '-600').replace('-600', '-700');

    // Focus input on open
    React.useEffect(() => {
        if (open) setValue('')
    }, [open])

    const lastEntry = entries.length > 0
        ? entries.reduce((prev, current) => (new Date(prev.date) > new Date(current.date) ? prev : current))
        : null;

    const lastValue = lastEntry ? lastEntry.value : (metric.baseline || 0);

    // Calculate Preview
    const deltaValue = parseFloat(value);
    const previewValue = !isNaN(deltaValue)
        ? (mode === 'delta' ? lastValue + deltaValue : deltaValue)
        : lastValue;

    const handleSubmit = () => {
        if (!value) return

        const val = parseFloat(value)
        if (isNaN(val)) {
            toast.error("Введіть коректне число")
            return
        }

        let finalValue = val;
        if (mode === 'delta') {
            finalValue = lastValue + val;
        }

        let metricId = metric.id;

        // Check for virtual metric (first update)
        // If it starts with 'virtual-', we need to create the definition first
        if (metric.id.startsWith('virtual-')) {
            metricId = Date.now().toString(); // Generate simple ID

            // Create the Definition first
            const newDef: MetricDefinition = {
                ...metric,
                id: metricId,
                // Ensure we persist the current date
                createdAt: new Date()
            };

            dispatch({ type: 'ADD_METRIC_DEF', payload: newDef });
        }

        const newEntry: MetricEntry = {
            id: Date.now().toString() + '-entry',
            userId: 'current-user', // handled by context/backend
            metricId: metricId,
            value: finalValue,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }

        dispatch({ type: 'ADD_METRIC_ENTRY', payload: newEntry })
        toast.success("Метрику оновлено")
        onOpenChange(false)
    }

    // Sort entries for chart
    const data = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(e => ({
        date: format(new Date(e.date), 'dd MMM'),
        value: e.value
    }))


    // --- Frequency Logic ---
    const getNextUpdateDate = () => {
        if (!lastEntry) return new Date(0); // Always allow if no entries
        const lastDate = new Date(lastEntry.date);
        const freq = metric.frequency.toLowerCase();

        if (freq === 'daily') return new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
        if (freq === 'weekly') return new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (freq === 'monthly') return new Date(lastDate.setMonth(lastDate.getMonth() + 1));
        if (freq === 'yearly') return new Date(lastDate.setFullYear(lastDate.getFullYear() + 1));

        return lastDate; // Default (allow update?)
    };

    const nextUpdateDate = getNextUpdateDate();
    const canUpdate = new Date() >= nextUpdateDate;
    const timeRemaining = formatDistanceToNow(nextUpdateDate, { locale: uk });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:max-w-md bg-white dark:bg-card border-none shadow-xl rounded-xl overflow-hidden p-0 gap-0 text-foreground">
                <div className={cn("h-2 w-full", color)} />

                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center justify-between">
                            {metric.name}
                            <span className="text-sm font-normal text-muted-foreground bg-slate-100 dark:bg-secondary px-2 py-1 rounded-full">{metric.unit || 'од.'}</span>
                        </DialogTitle>
                        <DialogDescription>
                            {metric.description || "Відслідковуйте динаміку змін"}
                            <span className={cn("flex items-center gap-2 mt-2 text-xs font-medium w-fit px-2 py-1 rounded-md max-w-full dark:opacity-80", badgeBgClass, badgeTextClass)}>
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                    {metric.frequency === 'daily' && 'Оновлюйте щодня'}
                                    {metric.frequency === 'weekly' && 'Оновлюйте щотижня'}
                                    {metric.frequency === 'monthly' && 'Оновлюйте раз на місяць'}
                                    {metric.frequency === 'per_trip' && 'Після поїздки'}
                                </span>
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="update" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="update">Оновити</TabsTrigger>
                            <TabsTrigger value="history">Історія</TabsTrigger>
                        </TabsList>

                        <TabsContent value="update" className="space-y-6">
                            {/* Quick Stats or Chart */}
                            <div className="h-[120px] w-full bg-slate-50/50 dark:bg-secondary/20 rounded-lg mb-6 border border-slate-100 dark:border-border flex items-center justify-center relative overflow-hidden">
                                {data.length > 1 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data}>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: accentHex, fontWeight: 600 }}
                                            />
                                            <Line type="monotone" dataKey="value" stroke={accentHex} strokeWidth={3} dot={{ r: 4, fill: accentHex, strokeWidth: 2, stroke: '#fff' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center text-slate-400 text-sm p-4">
                                        Недостатньо даних для графіку.<br />Додайте більше записів.
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="space-y-4">
                                {!canUpdate ? (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-full text-amber-600 dark:text-amber-400">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Оновлення недоступне</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                Наступне оновлення через <span className="font-bold">{timeRemaining}</span> (після {format(nextUpdateDate, "d MMM HH:mm", { locale: uk })})
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex bg-slate-100 dark:bg-secondary p-1 rounded-lg">
                                            <button
                                                onClick={() => setMode('delta')}
                                                className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all", mode === 'delta' ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                            >
                                                Зміна (+/-)
                                            </button>
                                            <button
                                                onClick={() => setMode('absolute')}
                                                className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all", mode === 'absolute' ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                            >
                                                Всього (Total)
                                            </button>
                                        </div>

                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider ml-1">
                                                    {mode === 'delta' ? 'На скільки змінилось?' : 'Нове значення'}
                                                </label>
                                                <Input
                                                    autoFocus
                                                    type="number"
                                                    value={value}
                                                    onChange={e => setValue(e.target.value)}
                                                    placeholder={mode === 'delta' ? "Напр. 10 або -50" : (lastEntry ? `${lastEntry.value}` : "0")}
                                                    className="text-lg font-bold h-12 bg-slate-50 dark:bg-secondary/40 border-slate-200 dark:border-border focus:bg-white dark:focus:bg-secondary transition-colors dark:text-foreground"
                                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                                />
                                                {value && (
                                                    <div className="text-xs text-right text-muted-foreground font-medium animate-in fade-in slide-in-from-top-1">
                                                        Буде: <span className="text-foreground font-bold">{previewValue} {metric.unit}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-xs text-slate-400">
                                        {lastEntry ? `Останнє: ${lastEntry.value} (${format(new Date(lastEntry.date), 'dd MMM')})` : 'Ще немає записів'}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Скасувати</Button>
                                        {canUpdate && (
                                            <Button onClick={handleSubmit} className={cn("text-white shadow-md transition-all hover:opacity-90", color)}>
                                                Зберегти
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="history">
                            <MetricHistoryList entries={entries} metric={metric} />
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
