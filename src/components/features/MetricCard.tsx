import * as React from "react"
import { MetricDefinition, MetricEntry } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { uk } from "date-fns/locale"
import { ArrowUpRight, ArrowDownRight, Minus, RotateCcw } from "lucide-react"

interface MetricCardProps {
    metric: MetricDefinition
    entries: MetricEntry[]
    onUpdate: () => void
    color?: string
}

export function MetricCard({ metric, entries, onUpdate, color }: MetricCardProps) {
    // Sort entries by date descending
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const latest = sortedEntries[0]
    const previous = sortedEntries[1]

    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    let change = 0

    if (latest && previous) {
        change = latest.value - previous.value
        if (change > 0) trend = 'up'
        if (change < 0) trend = 'down'
    }

    const isStale = latest ? (new Date().getTime() - new Date(latest.date).getTime()) > 7 * 24 * 60 * 60 * 1000 : true

    // Derive relative colors from the background class (e.g. 'bg-emerald-500')
    const borderColor = color ? color.replace('bg-', 'border-') : 'border-transparent';
    const textColor = color ? color.replace('bg-', 'text-') : 'text-slate-700';

    return (
        <div
            className={`group relative bg-white dark:bg-card border border-slate-100 dark:border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[150px] overflow-hidden ${color ? `border-t-4 ${borderColor}` : ''}`}
            onClick={onUpdate}
        >
            <div className="flex justify-between items-start z-10">
                <div className="flex-1">
                    <h3 className={`text-sm font-bold mb-1 ${textColor} dark:text-foreground`}>{metric.name}</h3>
                    <p className="text-[10px] text-slate-400 dark:text-muted-foreground line-clamp-2 leading-tight">{metric.description}</p>
                </div>
                {latest && (
                    <div className={`flex items-center text-xs font-bold ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400 dark:text-muted-foreground'
                        }`}>
                        {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                        {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {change !== 0 && Math.abs(change).toFixed(1)}
                    </div>
                )}
            </div>

            <div className="mt-auto z-10">
                {latest ? (
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-foreground">{latest.value}</span>
                            <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium">{metric.unit}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${isStale ? 'bg-amber-400' : 'bg-green-400'}`} />
                            <span className="text-[10px] text-slate-400 dark:text-muted-foreground/80">
                                {formatDistanceToNow(new Date(latest.date), { addSuffix: true, locale: uk })}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-2">
                        <span className="text-2xl font-bold text-slate-200 dark:text-muted">--</span>
                        <div className="flex items-center gap-1 text-slate-400 dark:text-muted-foreground/60">
                            <RotateCcw className="w-3 h-3" />
                            <span className="text-[10px]">Оновіть значення</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Hover Action */}
            <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                <button className="bg-white dark:bg-card border border-slate-200 dark:border-border shadow-sm text-xs font-semibold px-3 py-1.5 rounded-full text-slate-700 dark:text-foreground hover:text-indigo-600 dark:hover:text-primary hover:border-indigo-200 dark:hover:border-primary">
                    Оновити
                </button>
            </div>

            {/* Decoration Background */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 pointer-events-none ${color}`} />
        </div>
    )
}
