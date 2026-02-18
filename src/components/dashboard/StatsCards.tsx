'use client';

import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useData } from '@/lib/store';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    variant?: 'primary' | 'default';
}

function StatCard({ title, value, trend, trendValue, variant = 'default' }: StatCardProps) {
    const isPrimary = variant === 'primary';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "p-6 rounded-[2rem] flex flex-col justify-between h-[180px] relative overflow-hidden transition-all duration-300",
                isPrimary
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                    : "bg-white text-foreground shadow-sm hover:shadow-md border border-border"
            )}
        >
            {/* Background decoration for primary card */}
            {isPrimary && (
                <>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-5 -mb-5 blur-xl"></div>
                </>
            )}

            <div className="flex justify-between items-start z-10">
                <span className={cn("text-sm font-medium", isPrimary ? "text-white/80" : "text-muted-foreground")}>
                    {title}
                </span>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isPrimary ? "bg-white/20 text-white" : "bg-gray-100 text-foreground"
                )}>
                    <ArrowUpRight className="w-4 h-4" />
                </div>
            </div>

            <div className="z-10 mt-auto">
                <div className="text-4xl font-bold tracking-tight mb-3">{value}</div>
                {trendValue && (
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "flex items-center text-[10px] uppercase font-bold px-2 py-0.5 rounded-md",
                            isPrimary
                                ? "bg-white/20 text-white"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        )}>
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            <span>{trendValue}</span>
                        </div>
                        <span className={cn("text-[10px] uppercase font-bold opacity-60", isPrimary ? "text-white" : "text-muted-foreground")}>
                            Вплив
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export function StatsCards() {
    const { state } = useData();

    // Calculate real stats
    const totalProjects = state.projects?.length || 0;
    const activeProjects = state.projects?.filter((p: any) => p.status === 'active').length || 0;
    const completedProjects = state.projects?.filter((p: any) => p.status === 'completed').length || 0;
    const pendingProjects = state.projects?.filter((p: any) => p.status === 'pending').length || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Всього проєктів"
                value={totalProjects}
                trend="up"
                trendValue="+2"
                variant="primary"
            />
            <StatCard
                title="Завершені"
                value={completedProjects}
                trend="up"
                trendValue="+5"
            />
            <StatCard
                title="Активні"
                value={activeProjects}
                trend="up"
                trendValue="+3"
            />
            <StatCard
                title="В очікуванні"
                value={pendingProjects}
                trend="neutral"
                trendValue="1 новий"
            />
        </div>
    );
}
