import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { MetricEntry, MetricDefinition } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricHistoryListProps {
    entries: MetricEntry[];
    metric: MetricDefinition;
    className?: string;
}

export function MetricHistoryList({ entries, metric, className }: MetricHistoryListProps) {
    // Sort entries by date descending
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate changes
    const entriesWithChange = sortedEntries.map((entry, index) => {
        const nextEntry = sortedEntries[index + 1]; // Previous in time
        const change = nextEntry ? entry.value - nextEntry.value : 0;
        const isFirst = index === sortedEntries.length - 1;
        return { ...entry, change, isFirst };
    });

    return (
        <div className={cn("border rounded-md", className)}>
            <ScrollArea className="h-[200px] w-full">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Дата</TableHead>
                            <TableHead>Зміна</TableHead>
                            <TableHead className="text-right">Значення</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entriesWithChange.length > 0 ? (
                            entriesWithChange.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium text-xs text-muted-foreground">
                                        {format(new Date(entry.date), "dd MMM yyyy", { locale: uk })}
                                    </TableCell>
                                    <TableCell>
                                        {!entry.isFirst ? (
                                            <div className={cn("flex items-center text-xs font-bold",
                                                entry.change > 0 ? "text-emerald-600" :
                                                    entry.change < 0 ? "text-rose-600" : "text-slate-400"
                                            )}>
                                                {entry.change > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> :
                                                    entry.change < 0 ? <ArrowDown className="w-3 h-3 mr-1" /> :
                                                        <Minus className="w-3 h-3 mr-1" />}
                                                {entry.change > 0 ? '+' : ''}{entry.change}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Початкове</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {entry.value} {metric.unit}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-xs">
                                    Історія порожня
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
}
