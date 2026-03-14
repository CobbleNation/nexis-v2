'use client';

import { useData } from '@/lib/store';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { useEffect } from 'react';

export default function OverviewPage() {
    useEffect(() => {
        fetch('/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({ eventName: 'opened_dashboard' }),
        }).catch(err => console.error("Failed to track dashboard open:", err));
    }, []);

    return (
        <div className="animate-in fade-in duration-500 pb-12">
            <DashboardGrid />
        </div>
    );
}
