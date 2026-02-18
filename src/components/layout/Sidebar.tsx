'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    Activity,
    CheckSquare,
    Target,
    Library,
    Lightbulb,
    Settings,
    LogOut,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
    {
        name: 'Dashboard',
        href: '/overview',
        icon: LayoutDashboard,
        exact: true
    },
    {
        name: 'Tasks',
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
        name: 'Calendar',
        href: '/timeline',
        icon: History
    },
    {
        name: 'Analytics',
        href: '/insights',
        icon: Activity
    },
    {
        name: 'Goals',
        href: '/goals',
        icon: Target,
        children: [
            { name: 'Активні', href: '/goals?tab=active' },
            { name: 'Проекти', href: '/goals?tab=projects' },
            { name: 'Історія', href: '/goals?tab=history' },
        ]
    },
    {
        name: 'Content',
        href: '/content',
        icon: Library,
        children: [
            { name: 'Нотатки', href: '/content?tab=notes' },
            { name: 'Журнал', href: '/content?tab=journal' },
            { name: 'Файли', href: '/content?tab=files' },
            { name: 'Бібліотека', href: '/content?tab=library' },
        ]
    },
    {
        name: 'Team',
        href: '/team',
        icon: Lightbulb
    }
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();


    return (
        <div className="flex flex-col h-full py-6 px-4">
            {/* Logo area */}
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                    <Target className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Donezo</h1>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
                <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
                    <nav className="space-y-1.5">
                        {NAV_ITEMS.slice(0, 5).map((item) => (
                            <NavItem key={item.href} item={item} pathname={pathname} searchParams={searchParams} onNavigate={onNavigate} />
                        ))}
                    </nav>
                </div>

                <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">General</div>
                    <nav className="space-y-1.5">
                        <Link
                            href="/settings"
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-full text-base font-medium transition-all duration-200",
                                pathname.startsWith('/settings')
                                    ? "text-foreground bg-white shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                            )}
                        >
                            <Settings className="h-5 w-5" />
                            Settings
                        </Link>
                        <NavItem
                            item={{ name: 'Help', href: '/help', icon: Lightbulb }}
                            pathname={pathname}
                            searchParams={searchParams}
                            onNavigate={onNavigate}
                        />
                        <button
                            onClick={async () => {
                                // Logout logic
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-base font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </button>
                    </nav>
                </div>
            </div>

            {/* Download App Card */}
            <div className="mt-6">
                <div className="relative overflow-hidden rounded-3xl bg-black p-6 text-center">
                    {/* Abstract background shapes */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-30">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary blur-3xl rounded-full"></div>
                        <div className="absolute top-10 right-0 w-24 h-24 bg-blue-500 blur-3xl rounded-full"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-3">
                            <Download className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-white font-bold mb-1">Download our<br />Mobile App</h4>
                        <p className="text-white/60 text-xs mb-4">Get easy in another way</p>
                        <button className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-full transition-colors">
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NavItem({ item, pathname, searchParams, onNavigate }: { item: any, pathname: string, searchParams: any, onNavigate?: () => void }) {
    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    const showChildren = isActive && item.children;

    // Calculate child active state
    const effectiveActive = isActive; // Simplified for now, can be enhanced

    return (
        <div className="space-y-1">
            <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-full text-base font-medium transition-all duration-200 group",
                    isActive
                        ? "text-primary bg-white shadow-sm ring-1 ring-border" // Active: White bg, Green text, border
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
            >
                {/* Active Indicator Line (Left) */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                )}

                <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}

                {isActive && item.name === 'Tasks' && (
                    <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">12+</span>
                )}
            </Link>

            {/* Sub-items */}
            {showChildren && (
                <div className="ml-5 pl-4 border-l-2 border-border space-y-1 mt-1">
                    {item.children.map((child: any) => {
                        const [childPath, childQuery] = child.href.split('?');
                        const childTab = childQuery ? new URLSearchParams(childQuery).get('tab') : null;
                        const queryTab = searchParams.get('tab');

                        // Determine default tab if query param is missing
                        let currentEffectiveTab = queryTab;
                        if (!currentEffectiveTab && isActive) {
                            if (pathname === '/actions') currentEffectiveTab = 'inbox'; // Default for actions
                            else if (pathname === '/goals') currentEffectiveTab = 'active';
                            else if (pathname === '/content') currentEffectiveTab = 'notes';
                        }


                        const isChildActive = childTab
                            ? pathname === childPath && currentEffectiveTab === childTab
                            : pathname === child.href;

                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNavigate}
                                className={cn(
                                    "block px-3 py-2 text-sm rounded-lg transition-colors",
                                    isChildActive
                                        ? "text-primary font-bold"
                                        : "text-muted-foreground hover:text-foreground"
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
}

export function Sidebar() {
    return (
        <aside className="hidden md:flex flex-col w-72 fixed inset-y-0 z-50 bg-transparent pointer-events-none">
            {/* The visible sidebar box, floating with margin */}
            <div className="flex-1 m-4 mr-0 bg-sidebar rounded-[2rem] border border-sidebar-border shadow-sm pointer-events-auto overflow-hidden">
                <SidebarContent />
            </div>
        </aside>
    );
}
