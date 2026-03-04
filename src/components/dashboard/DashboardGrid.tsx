'use client';

import { useState } from 'react';
import { OverviewHeader } from './OverviewHeader';
import { StartDayPanel } from './StartDayPanel';
import { TasksTodayList } from './TasksTodayList';
import { FocusToday } from './FocusToday';
import { LifeBalance } from './LifeBalance';
import { ActiveProjectsOverview } from './ActiveProjectsOverview';
import { WeeklyActivity } from './WeeklyActivity';
import { QuickActions } from './QuickActions';
import { AIInsight } from './AIInsight';

// Import Modals for QuickActions
import { QuickAddModal } from '../features/QuickAddModal';

export function DashboardGrid() {
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddTab, setQuickAddTab] = useState<'tasks' | 'goals' | 'projects' | 'notes'>('tasks');

    // Day progress state
    // In a real app, this might stick in localStorage or global state based on tasks
    const [isDayStarted, setIsDayStarted] = useState(false);

    const handleOpenAddModal = (type: string) => {
        if (type === 'project') setQuickAddTab('projects');
        else if (type === 'metric') setQuickAddTab('goals'); // Metrics are usually under goals or separate
        else if (type === 'note') setQuickAddTab('notes');
        else setQuickAddTab('tasks');

        setQuickAddOpen(true);
    };

    return (
        <div className="w-full px-4 md:px-8 py-8 space-y-8">
            {/* Header: Focus Ring & Momentum */}
            <OverviewHeader />

            {!isDayStarted ? (
                <StartDayPanel onStartDay={() => setIsDayStarted(true)} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-6 auto-rows-max">
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
                        <AIInsight />
                    </div>

                    {/* SECTION 3 & 8: Life Balance & Active Projects (Bottom Row or fitting into columns) */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <LifeBalance />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <ActiveProjectsOverview />
                    </div>
                </div>
            )}

            {/* Modals triggered from QuickActions */}
            <QuickAddModal
                open={quickAddOpen}
                onOpenChange={setQuickAddOpen}
                defaultTab={quickAddTab}
            />
            {/* Additional modals (Create Project etc) would go here based on available components. 
                Using QuickAddModal for demonstration as it usually supports adding various entities. 
                Adapt as needed depending on what components actually exist in Nexis 2.0. */}
        </div>
    );
}
