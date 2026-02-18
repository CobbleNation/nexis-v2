'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
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

            <div className="z-10">
                <div className="text-4xl font-bold mb-2 tracking-tight">{value}</div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex items-center text-xs px-2 py-1 rounded-full",
                        isPrimary
                            ? "bg-white/20 text-white"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    )}>
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        <span>{trendValue}</span>
                    </div>
                    <span className={cn("text-xs opacity-70", isPrimary ? "text-white" : "text-muted-foreground")}>
                        from last month
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export function StatsCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Total Projects"
                value="24"
                trend="up"
                trendValue="Increased"
                variant="primary"
            />
            <StatCard
                title="Ended Projects"
                value="10"
                trend="up"
                trendValue="Increased"
            />
            <StatCard
                title="Running Projects"
                value="12"
                trend="up"
                trendValue="Increased"
            />
            <StatCard
                title="Pending Project"
                value="2"
                trend="neutral"
                trendValue="On Discuss"
            />
        </div>
    );
}
