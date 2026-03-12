'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Target, Compass, Flag, ChevronRight, BarChart3, ListChecks, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { GoalCreatorResponse, GoalCreatorVariant } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Goal } from '@/types';

interface AIGoalCreatorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    areas: { id: string; title: string }[];
    onSelectVariant: (variant: GoalCreatorVariant, matchedAreaId?: string) => void;
}

const typeConfig = {
    vision: {
        icon: Compass,
        label: 'Довгострокова',
        sublabel: '1–3 роки',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    strategic: {
        icon: Target,
        label: 'Стратегічна',
        sublabel: '3 міс – 1 рік',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    tactical: {
        icon: Flag,
        label: 'Тактична',
        sublabel: '1–3 місяці',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-800',
        badgeBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    },
};

export function AIGoalCreatorModal({ open, onOpenChange, areas, onSelectVariant }: AIGoalCreatorModalProps) {
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [variants, setVariants] = useState<GoalCreatorVariant[]>([]);

    const handleGenerate = async () => {
        if (!userInput.trim()) {
            toast.error("Опишіть, чого ви хочете досягти");
            return;
        }

        setIsGenerating(true);
        setVariants([]);

        try {
            const response = await fetch('/api/ai/goal-creator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInput: userInput.trim(),
                    areas: areas.map(a => a.title),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Помилка сервера (${response.status})`);
            }

            const data: GoalCreatorResponse = await response.json();

            if (data.variants && data.variants.length > 0) {
                setVariants(data.variants);
                toast.success(`AI створив ${data.variants.length} варіанти!`);
            } else {
                toast.info("AI не зміг створити варіанти. Спробуйте описати детальніше.");
            }
        } catch (error: any) {
            console.error('AI Goal Creator Error:', error);
            toast.error(error?.message || "Не вдалося згенерувати варіанти");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = (variant: GoalCreatorVariant) => {
        // Try to match the suggested area with actual areas
        const matchedArea = areas.find(
            a => a.title.toLowerCase() === variant.suggestedArea?.toLowerCase()
        );
        onSelectVariant(variant, matchedArea?.id);
        // Reset state
        setUserInput('');
        setVariants([]);
        onOpenChange(false);
    };

    const handleClose = (val: boolean) => {
        if (!val) {
            setVariants([]);
        }
        onOpenChange(val);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-card border border-slate-200 dark:border-border p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 px-6 py-5 border-b border-slate-100 dark:border-border">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-foreground">
                            <div className="p-1.5 bg-violet-100 dark:bg-violet-900/50 rounded-lg">
                                <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            AI Помічник Цілей
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 dark:text-muted-foreground">
                            Опишіть, що ви хочете досягти або змінити, і AI запропонує структуровані варіанти цілей
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-5">
                    {/* Input Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-foreground">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            Що ви хочете досягти?
                        </div>
                        <Textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Наприклад: Хочу покращити фізичну форму, навчитися програмувати, збільшити дохід, прочитати більше книг..."
                            className="min-h-[100px] p-4 text-base bg-slate-50 dark:bg-secondary/20 border-slate-200 dark:border-border rounded-xl resize-none placeholder:text-slate-300 dark:placeholder:text-muted-foreground/50 dark:text-foreground focus-visible:ring-violet-500"
                            disabled={isGenerating}
                        />
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !userInput.trim()}
                            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    AI аналізує ваш запит...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Згенерувати варіанти
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Loading Skeleton */}
                    {isGenerating && (
                        <div className="space-y-3 animate-in fade-in">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-5 rounded-xl border border-slate-100 dark:border-border animate-pulse">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                                        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                        <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Variants */}
                    {!isGenerating && variants.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground px-1">
                                Варіанти цілей ({variants.length})
                            </div>
                            {variants.map((variant, idx) => {
                                const config = typeConfig[variant.type] || typeConfig.strategic;
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "group p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                                            "hover:shadow-lg hover:scale-[1.01]",
                                            config.border,
                                            config.bg
                                        )}
                                        onClick={() => handleSelect(variant)}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                                                    <Icon className={cn("w-5 h-5", config.color)} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 dark:text-foreground text-base leading-tight truncate">
                                                        {variant.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className={cn("text-[10px] h-5 font-bold", config.badgeBg)}>
                                                            {config.label} · {config.sublabel}
                                                        </Badge>
                                                        {variant.suggestedArea && (
                                                            <span className="text-[11px] text-slate-400 dark:text-muted-foreground">
                                                                📁 {variant.suggestedArea}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="shrink-0 h-8 text-xs bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-secondary shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect(variant);
                                                }}
                                            >
                                                Обрати <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                            </Button>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed mb-3">
                                            {variant.description}
                                        </p>

                                        {/* Reasoning */}
                                        <p className="text-xs text-violet-600 dark:text-violet-400 italic mb-3 flex items-start gap-1.5">
                                            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            {variant.reasoning}
                                        </p>

                                        {/* Metrics & Steps */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {variant.metrics && variant.metrics.length > 0 && (
                                                <div className="bg-white/60 dark:bg-card/40 rounded-lg p-3 border border-slate-100 dark:border-border/50">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground mb-1.5 flex items-center gap-1">
                                                        <BarChart3 className="w-3 h-3" /> Метрики
                                                    </div>
                                                    <div className="space-y-1">
                                                        {variant.metrics.map((m, mi) => (
                                                            <div key={mi} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                                                {m.name} <span className="text-slate-400">({m.unit})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {variant.steps && variant.steps.length > 0 && (
                                                <div className="bg-white/60 dark:bg-card/40 rounded-lg p-3 border border-slate-100 dark:border-border/50">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground mb-1.5 flex items-center gap-1">
                                                        <ListChecks className="w-3 h-3" /> Перші кроки
                                                    </div>
                                                    <div className="space-y-1">
                                                        {variant.steps.map((s, si) => (
                                                            <div key={si} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                                                <span className="text-slate-400 font-bold shrink-0">{si + 1}.</span>
                                                                {s}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tip when no variants yet */}
                    {!isGenerating && variants.length === 0 && (
                        <div className="bg-slate-50 dark:bg-secondary/20 rounded-xl p-4 border border-slate-100 dark:border-border/50">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-muted-foreground mb-2 uppercase tracking-wider">💡 Підказки</h4>
                            <ul className="text-xs text-slate-500 dark:text-muted-foreground space-y-1.5 leading-relaxed">
                                <li>• Опишіть бажаний результат: <span className="text-slate-700 dark:text-slate-300 font-medium">"Хочу пробігти марафон"</span></li>
                                <li>• Або проблему: <span className="text-slate-700 dark:text-slate-300 font-medium">"Не встигаю читати книги"</span></li>
                                <li>• Або амбіцію: <span className="text-slate-700 dark:text-slate-300 font-medium">"Вивчити нову мову програмування"</span></li>
                                <li>• Чим детальніше — тим точніші варіанти</li>
                            </ul>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
