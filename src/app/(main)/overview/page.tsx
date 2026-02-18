'use client';

import { useData } from '@/lib/store';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

export default function OverviewPage() {
    return (
        <div className="animate-in fade-in duration-500 pb-12">
            <DashboardGrid />
        </div>
    );
}
