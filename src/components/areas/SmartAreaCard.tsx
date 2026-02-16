import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LifeArea } from '@/types';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { TrendingUp, TrendingDown, Minus, Clock, ArrowRight, Heart, Users } from 'lucide-react';

import { AreaStatus } from '@/lib/status-utils';

interface SmartAreaCardProps {
    area: LifeArea;
    index: number;
    lastActivity?: {
        text: string;
        date: string;
        type?: 'metric' | 'goal' | 'task';
    };
    computedStatus?: AreaStatus;
}

export function SmartAreaCard({ area, index, lastActivity, computedStatus }: SmartAreaCardProps) {
    // Robust Icon Resolution
    // Check iconName first, then icon property
    let Icon = (Icons as any)[area.iconName];

    if (!Icon && area.icon) {
        Icon = (Icons as any)[area.icon];
    }

    // Fallback default
    if (!Icon) {
        Icon = Icons.Activity;
    }

    // Explicit fix for Relationships
    if (area.title === 'Відносини' || area.iconName === 'Heart') {
        Icon = Users;
    }

    // Status Resolution
    // Use computed status if available, otherwise fall back to area.status or calculate basic one
    const statusLabel = computedStatus?.label || 'Стабільно';
    const statusIconName = computedStatus?.iconName || 'Minus';
    const statusColor = computedStatus?.status === 'improving' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
        computedStatus?.status === 'attention' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : // User said warning, not red alert
            computedStatus?.status === 'unchanged' ? 'bg-slate-50 dark:bg-secondary text-slate-600 dark:text-muted-foreground' :
                'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'; // Stable

    const StatusIcon = (Icons as any)[statusIconName] || Minus;

    return (
        <Link href={`/areas/${area.id}`} className="block h-full" id={`area-card-${area.id}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut"
                }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col h-full bg-white dark:bg-card border border-border/40 hover:border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300"
            >
                {/* Header: Icon & Status */}
                <div className="flex items-start justify-between mb-5">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105",
                        // Fix for potentially missing pink-500 class or transparency issue
                        (area.title === 'Відносини' && area.color.includes('pink')) ? 'bg-rose-500' : area.color
                    )}>
                        <Icon className="h-7 w-7" />
                    </div>

                    <div className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                        statusColor
                    )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusLabel}
                    </div>
                </div>

                {/* Title & Stats */}
                <div className="mb-6 flex-grow">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                        {area.title}
                    </h3>
                    {/* Dynamic Status Explanation */}
                    {computedStatus ? (
                        <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">
                            {computedStatus.reason}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {area.description}
                        </p>
                    )}
                </div>

                {/* Footer: Last Activity */}
                <div className="pt-4 border-t border-border/40 min-h-[50px]">
                    {lastActivity ? (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {lastActivity.date}
                            </div>
                            <div className="text-xs font-medium text-foreground/90 line-clamp-1">
                                {lastActivity.text}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 italic">
                            Немає нових активностей
                        </div>
                    )}
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="w-5 h-5 text-primary" />
                </div>
            </motion.div>
        </Link>
    );
}
