'use client';

import { StatsCards } from './StatsCards';
import { ProjectAnalytics } from './ProjectAnalytics';
import { Reminders } from './Reminders';
import { ProjectList } from './ProjectList';
import { TeamCollaboration } from './TeamCollaboration';
import { ProjectProgress } from './ProjectProgress';
import { TimeTracker } from './TimeTracker';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardGrid() {
    return (
        <div className="p-2 space-y-8 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Plan, prioritize, and accomplish your tasks with ease.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6">
                        <Plus className="w-4 h-4 mr-2" /> Add Project
                    </Button>
                    <Button variant="outline" className="rounded-full border-border hover:bg-muted font-bold px-6">
                        <Download className="w-4 h-4 mr-2" /> Import Data
                    </Button>
                </div>
            </div>

            {/* Row 1: Stats */}
            <StatsCards />

            {/* Main Grid: 12 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-fr">
                {/* Row 2 */}
                <div className="md:col-span-6 lg:col-span-6 h-full">
                    <ProjectAnalytics />
                </div>
                <div className="md:col-span-3 lg:col-span-3 h-full">
                    <Reminders />
                </div>
                <div className="md:col-span-3 lg:col-span-3 h-full">
                    <ProjectList />
                </div>

                {/* Row 3 */}
                <div className="md:col-span-4 lg:col-span-4 h-full">
                    <TeamCollaboration />
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
