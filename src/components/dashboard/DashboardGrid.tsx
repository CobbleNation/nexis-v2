'use client';

import { StatsCards } from './StatsCards';
import { ProjectAnalytics } from './ProjectAnalytics';
import { Reminders } from './Reminders';
import { ProjectList } from './ProjectList';
import { ProjectProgress } from './ProjectProgress';
import { TimeTracker } from './TimeTracker';

export function DashboardGrid() {
    return (
        <div className="p-2 space-y-6 max-w-[1600px] mx-auto">
            {/* Row 1: Stats */}
            <StatsCards />

            {/* Main Grid: 12 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-fr">
                {/* Row 2 */}
                <div className="md:col-span-8 lg:col-span-8 h-full">
                    <ProjectAnalytics />
                </div>
                <div className="md:col-span-4 lg:col-span-4 h-full">
                    <Reminders />
                </div>

                {/* Row 3 */}
                <div className="md:col-span-4 lg:col-span-4 h-full">
                    <ProjectList />
                </div>
                <div className="md:col-span-4 lg:col-span-4 h-full">
                    <ProjectProgress />
                </div>
                <div className="md:col-span-4 lg:col-span-4 h-full">
                    <TimeTracker />
                </div>
            </div>
        </div>
    );
}
