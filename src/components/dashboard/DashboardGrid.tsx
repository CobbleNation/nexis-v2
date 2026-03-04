'use client';

import { useState } from 'react';
import { LifeStatus } from './LifeStatus';
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

    const handleOpenAddModal = (type: string) => {
        if (type === 'project') setQuickAddTab('projects');
        else if (type === 'metric') setQuickAddTab('goals'); // Metrics are usually under goals or separate
        else if (type === 'note') setQuickAddTab('notes');
        else setQuickAddTab('tasks');

        setQuickAddOpen(true);
    };

    return (
        <div className="p-2 md:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Top Section: Life Status */}
            <LifeStatus />

            {/* Main Grid: 3 Columns Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[minmax(350px,auto)] mt-8">

                {/* Left Column (Life Balance & Projects) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <LifeBalance />
                    <ActiveProjectsOverview />
                </div>

                {/* Center Column (Focus Today & Quick Actions) */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    <FocusToday />
                    <div className="h-auto">
                        <QuickActions onOpenAddModal={handleOpenAddModal} />
                    </div>
                </div>

                {/* Right Column (Weekly Activity & AI Insight) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <WeeklyActivity />
                    <AIInsight />
                </div>
            </div>

            {/* Modals triggered from QuickActions */}
            <QuickAddModal
                open={quickAddOpen}
                onOpenChange={setQuickAddOpen}
                defaultTab="task"
            />
            {/* Additional modals (Create Project etc) would go here based on available components. 
                Using QuickAddModal for demonstration as it usually supports adding various entities. 
                Adapt as needed depending on what components actually exist in Nexis 2.0. */}
        </div>
    );
}
