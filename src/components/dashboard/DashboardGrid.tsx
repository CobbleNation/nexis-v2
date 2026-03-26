'use client';

import { useState } from 'react';
import { OverviewHeader } from './OverviewHeader';
import { TasksTodayList } from './TasksTodayList';
import { FocusToday } from './FocusToday';
import { LifeBalance } from './LifeBalance';
import { ActiveProjectsOverview } from './ActiveProjectsOverview';
import { WeeklyActivity } from './WeeklyActivity';
import { QuickActions } from './QuickActions';
import { MetricPickerSheet } from './MetricPickerSheet';

// Import Modals for QuickActions
import { QuickAddModal } from '../features/QuickAddModal';

export function DashboardGrid() {
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddTab, setQuickAddTab] = useState<string>('task');
    const [metricPickerOpen, setMetricPickerOpen] = useState(false);

    const handleOpenAddModal = (type: string) => {
        if (type === 'metric') {
            setMetricPickerOpen(true);
            return;
        }
        // Map quick action type to QuickAddModal tab values
        if (type === 'project') setQuickAddTab('project');
        else if (type === 'note') setQuickAddTab('content'); // 'content' defaults to note subtype
        else setQuickAddTab('task');
        setQuickAddOpen(true);
    };

    return (
        <div className="w-full px-0 md:px-4 lg:px-8 py-3 md:py-6 space-y-4 md:space-y-8">
            {/* Header: Focus Ring & Momentum */}
            <OverviewHeader />

            {/* Dashboard Grid — always visible */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-4 md:gap-6 auto-rows-max">
                {/* SECTION 1: Focus of the Day (Full width of the grid) */}
                <div className="lg:col-span-3">
                    <FocusToday />
                </div>

                {/* SECTION 2: Tasks Today */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <TasksTodayList />
                </div>

                {/* SECTION 4 & 5 & 6: Right Column */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <WeeklyActivity />
                    <QuickActions onOpenAddModal={handleOpenAddModal} />
                </div>

                {/* SECTION 3 & 8: Life Balance & Active Projects (Bottom Row) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <LifeBalance />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <ActiveProjectsOverview />
                </div>
            </div>

            {/* Modals triggered from QuickActions */}
            <QuickAddModal
                open={quickAddOpen}
                onOpenChange={setQuickAddOpen}
                defaultTab={quickAddTab}
            />
            <MetricPickerSheet
                open={metricPickerOpen}
                onOpenChange={setMetricPickerOpen}
            />
        </div>
    );
}
