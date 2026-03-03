'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { useAuth } from '@/lib/auth-context';
import { useFilteredData, useData } from '@/lib/store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ContextState } from '@/components/overview/ContextState';
import { calculateFocusLevel } from '@/lib/metrics';
import { useMemo } from 'react';

import { GlobalSearch } from '@/components/layout/GlobalSearch';

export function Header() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { state } = useData();
    const {
        period,
        activeArea,
        activeColor
    } = useFilteredData();

    // Calculate Focus Level for ContextState
    const metrics = useMemo(() => calculateFocusLevel(state), [state]);
    const contextScore = metrics.score;

    return (
        <div className="sticky top-0 z-40 w-full bg-background/50 backdrop-blur-md border-b border-border/40">
            <header className="flex h-16 items-center justify-between gap-4 px-6 md:px-8">
                {/* Search Bar - Global Search Component */}
                <GlobalSearch />


                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    <NotificationsPopover />
                </div>
            </header>

            {/* Sub-header for Context Controls (Area & Time) - ONLY on Overview */}
            {pathname === '/overview' && (
                <div className="px-6 md:px-8 pb-4">
                    <ContextState
                        score={contextScore}
                        metrics={metrics}
                        period={period}
                        areaName={activeArea?.title}
                        activeColor={activeColor}
                    />
                </div>
            )}
        </div>
    );
}
