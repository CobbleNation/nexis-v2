'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    Target,
    Folder,
    Calendar,
    BookOpen,
    BarChart2,
    Settings,
    LogOut,
    Layers,
    Sparkles,
    Lightbulb, // Added Lightbulb
    Zap,
    Plus,
    ChevronDown,
    Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { QuickAddModal } from '@/components/features/QuickAddModal';
import { DailyReviewDialog } from '@/components/features/DailyReviewDialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { GoalBreakdownModal } from '@/components/features/ai/GoalBreakdownModal';

// Navigation Groups
interface NavItem {
    name: string;
    href: string;
    icon: any;
    isAction?: boolean;
    actionId?: string;
    subItems?: { name: string; href: string }[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: 'Головна',
        items: [
            { name: 'Огляд', href: '/overview', icon: LayoutDashboard },
        ]
    },
    {
        title: 'AI Інструменти',
        items: [
            { name: 'Аналіз Дня', href: '#ai-daily-review', icon: Lightbulb, isAction: true, actionId: 'daily-review' },
            { name: 'Розбиття Цілей', href: '#ai-goal-breakdown', icon: Target, isAction: true, actionId: 'goal-breakdown' },
        ]
    },
    {
        title: 'Управління',
        items: [
            { name: 'Проєкти', href: '/projects', icon: Folder },
            { name: 'Сфери', href: '/areas', icon: Layers },
            { name: 'Цілі', href: '/goals', icon: Target },
        ]
    },
    {
        title: 'Щоденно',
        items: [
            {
                name: 'Дії',
                href: '/actions',
                icon: CheckSquare,
                subItems: [
                    { name: 'Задачі', href: '/actions?tab=tasks' },
                    { name: 'Звички', href: '/actions?tab=habits' },
                ]
            },
            { name: 'Розклад', href: '/timeline', icon: Calendar },
        ]
    },
    {
        title: 'Ресурси',
        items: [
            { name: 'Контент', href: '/content', icon: BookOpen },
            { name: 'Аналітика', href: '/insights', icon: BarChart2 },
        ]
    },
    {
        title: 'Налаштування',
        items: [
            { name: 'Налаштування', href: '/settings', icon: Settings },
        ]
    }
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const isPro = user?.subscriptionTier === 'pro' || user?.role === 'admin';

    // Helper to close sheet on mobile
    const handleNavigation = () => {
        if (onNavigate) onNavigate();
    };

    const [showQuickAdd, setShowQuickAdd] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Logo Section - Compact */}
            <div className="p-6 pb-2 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary rounded-sm rotate-45 shadow-sm shadow-primary/20" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">Nexis</span>
            </div>

            {/* Global Create Button */}
            <div className="px-4 py-4 shrink-0">
                <Button
                    onClick={() => setShowQuickAdd(true)}
                    className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 rounded-xl h-10 text-sm font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    <span className="truncate">Створити</span>
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-6 overflow-y-auto py-2 scrollbar-hide">
                {navGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-1">
                        {group.title && (
                            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
                                {group.title}
                            </h4>
                        )}

                        {group.items.map((item) => {
                            // Special handling for Action items (like AI Modal)
                            if (item.isAction) {
                                if (item.actionId === 'daily-review') {
                                    return (
                                        <div key={item.name} className="px-1">
                                            <DailyReviewDialog customTrigger={
                                                <button
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                                                    )}
                                                >
                                                    <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                    <span>{item.name}</span>
                                                </button>
                                            } />
                                        </div>
                                    );
                                }
                                if (item.actionId === 'goal-breakdown') {
                                    return (
                                        <div key={item.name} className="px-1">
                                            <GoalBreakdownModal customTrigger={
                                                <button
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10"
                                                    )}
                                                >
                                                    <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                    <span>{item.name}</span>
                                                </button>
                                            } />
                                        </div>
                                    );
                                }
                            }

                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;

                            return (
                                <div key={item.href} className="space-y-0.5">
                                    <Link
                                        href={item.href}
                                        onClick={handleNavigation}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                                            isActive
                                                ? "text-primary bg-primary/10 font-semibold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                                        <span className="flex-1">{item.name}</span>
                                        {/* Optional: Add chevron if has subItems and we want collapsible (not requested yet, keeping simple) */}
                                    </Link>

                                    {/* Render Sub-items if active or parent match */}
                                    {item.subItems && isActive && (
                                        <div className="ml-9 space-y-0.5 border-l border-border/50 pl-2 mt-1">
                                            {item.subItems.map(sub => (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    onClick={handleNavigation}
                                                    className={cn(
                                                        "block px-2 py-1.5 text-xs rounded-md transition-colors",
                                                        pathname === sub.href // simplistic check, might need query param match
                                                            ? "text-primary font-medium bg-primary/5"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                                    )}
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/50">
                {/* Upgrade Card (Only for Free Plan) */}
                {!isPro && (
                    <div className="mb-0">
                        <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 border-primary/20 text-primary hover:text-primary hover:bg-primary/5">
                            <Link href="/pricing" onClick={handleNavigation}>
                                <Zap className="w-4 h-4 fill-current" />
                                <span className="text-xs font-bold">Upgrade to Pro</span>
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            <QuickAddModal open={showQuickAdd} onOpenChange={setShowQuickAdd} />
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-background border-r border-border z-50">
            <SidebarContent />
        </aside>
    );
}

