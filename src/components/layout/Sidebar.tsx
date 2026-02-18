'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    Activity,
    CheckSquare,
    Target,
    Library,
    Lightbulb,
    Settings,
    Plus,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SidebarUpsell } from '@/components/layout/SidebarUpsell';

import { LucideIcon } from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    children?: { name: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
    { name: 'Огляд', href: '/overview', icon: LayoutDashboard },
    { name: 'Розклад', href: '/timeline', icon: History },
    { name: 'Сфери', href: '/areas', icon: Activity },
    {
        name: 'Завдання',
        href: '/actions',
        icon: CheckSquare,
        children: [
            { name: 'Вхідні', href: '/actions?tab=inbox' },
            { name: 'Завдання', href: '/actions?tab=tasks' },
            { name: 'Рутина', href: '/actions?tab=routines' },
            { name: 'Звички', href: '/actions?tab=habits' },
            { name: 'Фокус', href: '/actions?tab=focus' },
        ]
    },
    {
        name: 'Цілі та Проекти',
        href: '/goals',
        icon: Target,
        children: [
            { name: 'Активні Цілі', href: '/goals?tab=goals' },
            { name: 'Проекти', href: '/goals?tab=projects' },
            { name: 'Історія', href: '/goals?tab=history' },
        ]
    },
    {
        name: 'Контент',
        href: '/content',
        icon: Library,
        children: [
            { name: 'Нотатки', href: '/content?tab=notes' },
            { name: 'Журнал', href: '/content?tab=journal' },
            { name: 'Файли', href: '/content?tab=files' },
            { name: 'Бібліотека', href: '/content?tab=library' },
        ]
    },
    { name: 'Аналітика', href: '/insights', icon: Lightbulb },
    { name: 'Налаштування', href: '/settings', icon: Settings },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <div id="sidebar-container" className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
            {/* Logo Area - Floating & Clean */}
            <div className="h-24 flex items-center px-6 mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground/90">Zynorvia</span>
                </div>
            </div>

            {/* Navigation - Spaced & Pill-shaped */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin scrollbar-thumb-sidebar-border">
                <div className="text-[10px] font-bold text-muted-foreground/40 mb-3 px-4 uppercase tracking-widest">Головне Меню</div>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const navId = `sidebar-nav-${item.href.replace('/', '')}`;
                    const hasChildren = item.children && item.children.length > 0;
                    const showChildren = isActive && hasChildren;

                    return (
                        <div key={item.href} className="flex flex-col mb-1">
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                id={navId}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-sidebar-accent shadow-sm text-orange-600 ring-1 ring-sidebar-border"
                                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-orange-600" : "text-muted-foreground/70 group-hover:text-orange-500")} />
                                {item.name}
                            </Link>

                            {showChildren && (
                                <div className="mt-1 ml-9 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 pl-2">
                                    {item.children!.map((child) => {
                                        // Robust active check using searchParams
                                        const [childPath, childQuery] = child.href.split('?');
                                        const childTab = childQuery ? new URLSearchParams(childQuery).get('tab') : null;
                                        const currentTab = searchParams.get('tab');

                                        // If child has specific tab, check it. If not, just check pathname.
                                        const isChildActive = childTab
                                            ? pathname === childPath && currentTab === childTab
                                            : pathname === child.href;

                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={onNavigate}
                                                className={cn(
                                                    "block px-3 py-1.5 rounded-md text-sm transition-all duration-200",
                                                    isChildActive
                                                        ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium shadow-sm ring-1 ring-orange-200 dark:ring-orange-900/20"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:pl-4"
                                                )}
                                            >
                                                {child.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <SidebarUpsell />

            {/* User Profile - Clean & Separated */}
            {user && (
                <div className="p-4 mt-auto border-t border-sidebar-border shrink-0">
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-9 w-9 rounded-full border border-sidebar-border shadow-sm shrink-0">
                                <AvatarImage src={user.avatar} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                                    {user.name?.substring(0, 2).toUpperCase() || 'Я'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-foreground truncate min-w-[3ch]">{user.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate font-medium uppercase tracking-wide">
                                    {user.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                await logout();
                            }}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Вийти"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex-col z-50">
            <SidebarContent />
        </aside>
    );
}
