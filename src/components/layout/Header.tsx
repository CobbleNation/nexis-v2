'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown, Sun, Moon, Monitor, LayoutDashboard, Settings, LogOut, Globe } from 'lucide-react';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { useAuth } from '@/lib/auth-context';
import { useFilteredData, useData } from '@/lib/store';
import { useTheme } from 'next-themes';
import { ContextState } from '@/components/overview/ContextState';
import { calculateFocusLevel } from '@/lib/metrics';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

import { GlobalSearch } from '@/components/layout/GlobalSearch';

export function Header() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { state } = useData();
    const { theme, setTheme } = useTheme();
    const isPro = user?.subscriptionTier === 'pro';

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
            <header className="flex h-16 items-center justify-between gap-3 px-6 md:px-8">
                {/* Search Bar - Global Search Component */}
                <GlobalSearch />


                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    <NotificationsPopover />

                    {/* User Profile - Compact */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none">
                                <Avatar className="h-9 w-9 shrink-0 border border-border shadow-sm">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                                        {user?.name?.substring(0, 2) || 'US'}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 opacity-50 hidden md:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 mt-2 p-2">
                            <div className="px-2 py-1.5 mb-2">
                                <p className="text-sm font-semibold text-foreground truncate leading-tight mb-0.5">
                                    {user?.name || 'Користувач'}
                                </p>
                                <p className="text-[11px] font-medium text-muted-foreground truncate">
                                    {isPro ? 'Pro План' : 'Безкоштовний План'}
                                </p>
                            </div>
                            <DropdownMenuSeparator className="mb-2" />

                            <div className="px-2 py-1.5 mb-1">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Тема</div>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={cn("flex-1 flex justify-center p-1.5 rounded-md transition-all", theme === 'light' ? "bg-white dark:bg-slate-700 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                        title="Світла"
                                    >
                                        <Sun className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={cn("flex-1 flex justify-center p-1.5 rounded-md transition-all", theme === 'dark' ? "bg-white dark:bg-slate-700 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                        title="Темна"
                                    >
                                        <Moon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setTheme('system')}
                                        className={cn("flex-1 flex justify-center p-1.5 rounded-md transition-all", theme === 'system' ? "bg-white dark:bg-slate-700 shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                        title="Системна"
                                    >
                                        <Monitor className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="p-2 cursor-pointer">
                                <Link href="/" className="flex items-center w-full">
                                    <Globe className="mr-2 h-4 w-4" /> На головну
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="p-2 cursor-pointer">
                                <Link href="/settings" className="flex items-center w-full">
                                    <Settings className="mr-2 h-4 w-4" /> Налаштування
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="p-2 text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" /> Вийти
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
