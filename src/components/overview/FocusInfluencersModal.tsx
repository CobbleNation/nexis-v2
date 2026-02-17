'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { InfoBadge } from '@/components/common/InfoBadge';
import { Zap, Brain, Moon, Coffee } from 'lucide-react';
import { CorrelationResult } from '@/lib/analytics';

interface FocusInfluencersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    drivers: CorrelationResult[];
    isLoading?: boolean;
}

export function FocusInfluencersModal({ open, onOpenChange, drivers, isLoading }: FocusInfluencersModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Що впливає на твій Фокус?
                    </DialogTitle>
                    <DialogDescription>
                        Аналіз кореляцій між твоїми показниками та рівнем фокусу за останні 30 днів.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-8 space-y-3">
                            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Аналізуємо дані...</p>
                        </div>
                    ) : drivers.length > 0 ? (
                        <div className="space-y-3">
                            {drivers.map((item, idx) => (
                                <Card key={idx} className="border-none shadow-sm bg-muted/50 dark:bg-card hover:bg-muted/80 transition-colors">
                                    <div className={`h-1 w-full rounded-t-lg ${item.impactPercent > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-foreground text-sm flex items-center gap-2">
                                                    {item.variableX}
                                                    {/* We can map icons based on variableX if we want, or just generic */}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.impactPercent > 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                                                }`}>
                                                {item.impactPercent > 0 ? '+' : ''}{item.impactPercent}%
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 border-2 border-dashed border-muted rounded-xl">
                            <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <h3 className="text-sm font-semibold text-foreground">Мало даних для аналізу</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                                Продовжуй вести трекінг звичок та завдань. Через кілька днів тут з'являться перші інсайти.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
