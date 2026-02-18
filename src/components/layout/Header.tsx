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
import { MobileContextControls } from '@/components/features/MobileContextControls';
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
                    {/* Add Button Removed (Moved to Sidebar) */}

                    <NotificationsPopover />

                    {/* Profile */}
                    <Link href="/settings" className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-border/60 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                        <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-700 shadow-sm">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px]">
                                {user?.name?.substring(0, 2).toUpperCase() || 'TM'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left pr-1">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground leading-none mb-0.5">{user?.name || 'User'}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {user?.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </header>

            {/* Sub-header for Context Controls (Area & Time) - ONLY on Overview */}
            {pathname === '/overview' && (
                <div className="px-6 md:px-8 pb-4">
                    <div className="flex items-center justify-between">
                        <ContextState
                            score={contextScore}
                            metrics={metrics}
                            period={period}
                            areaName={activeArea?.title}
                            activeColor={activeColor}
                        />
                        <div className="md:hidden">
                            <MobileContextControls />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
