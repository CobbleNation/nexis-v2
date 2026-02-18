'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { useAuth } from '@/lib/auth-context';
import { useFilteredData, useData } from '@/lib/store';
import { MobileContextControls } from '@/components/features/MobileContextControls';
import { ContextState } from '@/components/overview/ContextState';
import { calculateFocusLevel } from '@/lib/metrics';
import { useMemo } from 'react';

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
                {/* Search Bar - Pill Shape */}
                <div className="flex-1 max-w-xl">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Input
                            placeholder="Пошук (скоро)"
                            className="w-full pl-10 pr-4 h-10 rounded-full bg-white border-none shadow-sm ring-1 ring-border/50 hover:ring-primary/20 focus-visible:ring-primary transition-all duration-300"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>F
                            </kbd>
                        </div>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    <NotificationsPopover />

                    {/* Profile */}
                    <Link href="/settings" className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full bg-white border border-border shadow-sm hover:ring-2 hover:ring-primary/10 transition-all">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                                {user?.name?.substring(0, 2).toUpperCase() || 'TM'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left pr-2">
                            <div className="text-sm font-bold text-foreground">{user?.name || 'User'}</div>
                        </div>
                    </Link>
                </div>
            </header>

            {/* Sub-header for Context Controls (Area & Time) */}
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
        </div>
    );
}
