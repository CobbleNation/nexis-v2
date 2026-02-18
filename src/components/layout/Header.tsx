'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { useAuth } from '@/lib/auth-context';

export function Header() {
    const pathname = usePathname();
    const { user } = useAuth();

    // Simple breadcrumb/title logic
    const getPageTitle = () => {
        if (pathname === '/overview') return 'Dashboard';
        if (pathname.startsWith('/actions')) return 'Tasks';
        if (pathname.startsWith('/goals')) return 'Goals';
        if (pathname.startsWith('/content')) return 'Content';
        if (pathname.startsWith('/timeline')) return 'Calendar';
        if (pathname.startsWith('/insights')) return 'Analytics';
        if (pathname.startsWith('/team')) return 'Team';
        if (pathname.startsWith('/settings')) return 'Settings';
        return 'Dashboard';
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-background/50 backdrop-blur-md pt-4 px-6 md:px-8 pb-2">
            <div className="flex h-16 items-center justify-between gap-4">

                {/* Search Bar - Pill Shape */}
                <div className="flex-1 max-w-xl">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Input
                            placeholder="Search task"
                            className="w-full pl-10 pr-4 h-11 rounded-full bg-white border-none shadow-sm ring-1 ring-border/50 hover:ring-primary/20 focus-visible:ring-primary transition-all duration-300"
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

                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-border shadow-sm hover:bg-gray-50 transition-colors">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    </button>

                    {/* Profile */}
                    <Link href="/settings" className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full bg-white border border-border shadow-sm hover:ring-2 hover:ring-primary/10 transition-all">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                                {user?.name?.substring(0, 2).toUpperCase() || 'TM'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block text-left pr-2">
                            <div className="text-xs font-bold text-foreground">{user?.name || 'User'}</div>
                            <div className="text-[10px] text-muted-foreground">{user?.email || 'user@example.com'}</div>
                        </div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
