'use client';

import { useFilteredData, useData } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ContextState } from '@/components/overview/ContextState';
import { MobileContextControls } from '@/components/features/MobileContextControls';
import { DailyRecapCard } from '@/components/features/DailyRecapCard';
import { OverviewDay } from '@/components/overview/OverviewDay';
import { OverviewWeek } from '@/components/overview/OverviewWeek';
import { OverviewMonth } from '@/components/overview/OverviewMonth';
import { OverviewYear } from '@/components/overview/OverviewYear';
import { calculateFocusLevel } from '@/lib/metrics';
import { useMemo } from 'react';

export default function OverviewPage() {
    const { state } = useData();

    const {
        filteredActions,
        filteredGoals,
        period,
        activeArea,
        activeColor
    } = useFilteredData();

    // 1. Calculate Focus Level (Dynamic)
    const metrics = useMemo(() => calculateFocusLevel(state), [state]);
    const contextScore = metrics.score;

    // 2. Evening Recap Logic
    const showDailyRecap = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 18) return false;

        const todayStr = new Date().toISOString().split('T')[0];
        const hasEntryToday = state.journal?.some((j: any) => {
            const jDate = (j.date instanceof Date)
                ? j.date.toISOString().split('T')[0]
                : (typeof j.date === 'string' ? j.date.split('T')[0] : String(j.date));
            return jDate === todayStr;
        });

        return !hasEntryToday;
    }, [state.journal]);

    const handleOpenJournal = () => {
        // Dispatch custom event that Header/QuickAddWrapper listens to
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-quick-add-journal'));
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-12">
            {/* 0. Daily Recap Card (Evening Only) */}
            {period === 'day' && showDailyRecap && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-500">
                    <DailyRecapCard onOpenJournal={handleOpenJournal} />
                </div>
            )}

            {/* 1. Context State Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <MobileContextControls />
                <ContextState
                    score={contextScore}
                    metrics={metrics}
                    period={period}
                    areaName={activeArea?.title}
                    activeColor={activeColor}
                />
            </motion.div>

            {/* 2. Dynamic Content Based on Period */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={period}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    id="overview-container"
                >
                    {period === 'day' && (
                        <OverviewDay
                            filteredActions={filteredActions}
                            filteredGoals={filteredGoals}
                            activeArea={activeArea}
                            activeColor={activeColor}
                        />
                    )}

                    {period === 'week' && (
                        <OverviewWeek
                            filteredActions={filteredActions}
                            filteredGoals={filteredGoals}
                            activeArea={activeArea}
                            activeColor={activeColor}
                        />
                    )}

                    {period === 'month' && (
                        <OverviewMonth
                            filteredActions={filteredActions}
                            filteredGoals={filteredGoals}
                            activeArea={activeArea}
                            activeColor={activeColor}
                        />
                    )}

                    {period === 'year' && (
                        <OverviewYear
                            filteredActions={filteredActions}
                            filteredGoals={filteredGoals}
                            activeArea={activeArea}
                            activeColor={activeColor}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
