"use client";

import * as React from "react";
import { format } from "date-fns";
import {
    Target,
    Compass,
    Flag,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreHorizontal
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Goal, Action } from "@/types";
import { calculateGoalProgress, ComputedGoalStatus } from "@/lib/goal-utils";

interface GoalCardProps {
    goal: Goal;
    linkedActions?: Action[];
    onEdit?: (goal: Goal) => void;
    onDelete?: (goalId: string) => void;
}

export function GoalCard({ goal, linkedActions = [], onEdit, onDelete }: GoalCardProps) {
    // Calculate honest progress
    // Note: We use the cached metricCurrentValue from the goal object itself
    // In a real app, this might come from a separate store or query if real-time is needed
    const statusData: ComputedGoalStatus = React.useMemo(() => {
        return calculateGoalProgress(goal, goal.metricCurrentValue, linkedActions);
    }, [goal, linkedActions]);

    const { type } = goal;

    return (
        <Card className={cn(
            "group relative transition-all duration-200 hover:shadow-md border-border/50",
            type === 'vision' ? "bg-gradient-to-br from-primary/5 to-transparent border-primary/20" : "bg-card"
        )}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                        <GoalIcon type={type} className={cn(
                            "w-5 h-5",
                            type === 'vision' ? "text-primary" : "text-muted-foreground"
                        )} />
                        <CardTitle className="text-lg font-semibold leading-tight">
                            {goal.title}
                        </CardTitle>
                    </div>

                    <GoalActionsMenu onEdit={() => onEdit?.(goal)} onDelete={() => onDelete?.(goal.id)} />
                </div>

                {goal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {goal.description}
                    </p>
                )}
            </CardHeader>

            <CardContent className="pt-2">
                {/* Visualizations based on Type */}

                {/* 1. VISION: Minimalist, Directional */}
                {type === 'vision' && (
                    <div className="flex items-center gap-2 text-xs text-primary/80 font-medium mt-2">
                        <Compass className="w-3 h-3" />
                        <span>Довгостроковий напрямок</span>
                    </div>
                )}

                {/* 2. STRATEGIC: Metric-Driven, Detail-Oriented */}
                {type === 'strategic' && (
                    <div className="space-y-4">
                        {/* Progress Bar & Values */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{statusData.reason}</span>
                                <span className={cn(
                                    "font-medium",
                                    getColorForStatus(statusData.displayStatus)
                                )}>
                                    {Math.round(statusData.progress)}%
                                </span>
                            </div>
                            <Progress value={statusData.progress} className="h-2" />

                            {/* Metric Details (Start -> Current -> Target) */}
                            {statusData.isMetricBased && (
                                <div className="flex justify-between text-[10px] text-muted-foreground opacity-80 pt-1">
                                    <span>S: {goal.metricStartValue ?? 0}</span>
                                    <span className="font-medium text-foreground">
                                        Now: {goal.metricCurrentValue ?? (goal.metricStartValue ?? 0)}
                                    </span>
                                    <span>T: {goal.metricTargetValue ?? '?'}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer: Status Badge & Linked Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <StatusBadge status={statusData.displayStatus} />

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Flag className="w-3 h-3" />
                                <span>{linkedActions.length} дій</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TACTICAL: Milestone focused */}
                {type === 'tactical' && (
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{statusData.reason}</span>
                                <span>{Math.round(statusData.progress)}%</span>
                            </div>
                            <Progress value={statusData.progress} className="h-1.5" />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <StatusBadge status={statusData.displayStatus} size="sm" />

                            {goal.deadline && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{format(new Date(goal.deadline), 'd MMM')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// --- Sub-components ---

function GoalIcon({ type, className }: { type: Goal['type']; className?: string }) {
    switch (type) {
        case 'vision': return <Compass className={className} />;
        case 'strategic': return <Target className={className} />;
        case 'tactical': return <Flag className={className} />;
        default: return <Target className={className} />;
    }
}

function StatusBadge({ status, size = 'default' }: { status: ComputedGoalStatus['displayStatus'], size?: 'default' | 'sm' }) {
    const config = {
        'completed': { label: 'Виконано', icon: CheckCircle2, color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
        'on-track': { label: 'Рухаємось', icon: TrendingUp, color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
        'at-risk': { label: 'Ризик', icon: AlertCircle, color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' },
        'off-track': { label: 'Без змін', icon: AlertCircle, color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
        'not-started': { label: 'Не почато', icon: Clock, color: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20' },
    };

    const { label, icon: Icon, color } = config[status] || config['not-started'];
    const isSmall = size === 'sm';

    return (
        <Badge variant="outline" className={cn(
            "gap-1 font-normal border-0",
            color,
            isSmall ? "px-1.5 py-0 text-[10px]" : "px-2"
        )}>
            <Icon className={cn(isSmall ? "w-2.5 h-2.5" : "w-3 h-3")} />
            <span>{label}</span>
        </Badge>
    );
}

function getColorForStatus(status: ComputedGoalStatus['displayStatus']) {
    switch (status) {
        case 'completed': return 'text-green-600';
        case 'on-track': return 'text-blue-600';
        case 'at-risk': return 'text-orange-600';
        case 'off-track': return 'text-red-600';
        default: return 'text-muted-foreground';
    }
}

function GoalActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>Редагувати</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    Видалити
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
