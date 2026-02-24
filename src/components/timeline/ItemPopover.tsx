import { ScheduleItem } from '@/lib/schedule-utils';
import { cn } from '@/lib/utils';
import { PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Edit, Trash2 } from 'lucide-react';

export function ItemPopover({ item, styles, getTypeLabel, onEdit, onComplete, onDelete }: {
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
