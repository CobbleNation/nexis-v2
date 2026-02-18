'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Plus, CheckSquare, Folder, Target, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
                    {/* Global Add Button */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/25">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                                <Link href="/actions?action=new" className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                    <span>Завдання</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                                <Link href="/projects?action=new" className="flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-primary" />
                                    <span>Проєкт</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                                <Link href="/goals?action=new" className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span>Ціль</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                                <Link href="/content?action=new" className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    <span>Нотатка</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-foreground leading-none">{user?.name || 'User'}</div>
                                {/* Subscription Badge */}
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                                    {user?.subscriptionTier === 'pro' ? 'PRO' : 'FREE'}
                                </Badge>
                            </div>
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
