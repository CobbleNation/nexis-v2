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
    Activity,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navigation = [
    { name: 'Огляд', href: '/overview', icon: LayoutDashboard },
    // Removed 'Щоденник' (Activity) as per request
    { name: 'Дії', href: '/actions', icon: CheckSquare },
    { name: 'Проєкти', href: '/projects', icon: Folder },
    { name: 'Сфери', href: '/areas', icon: Layers },
    { name: 'Цілі', href: '/goals', icon: Target },
    { name: 'Аналітика', href: '/insights', icon: BarChart2 },
    { name: 'Контент', href: '/content', icon: BookOpen },
    { name: 'Розклад', href: '/timeline', icon: Calendar }, // Renamed from 'Часова шкала'
    { name: 'Налаштування', href: '/settings', icon: Settings },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const isPro = user?.subscriptionTier === 'pro' || user?.role === 'admin';

    // Helper to close sheet on mobile
    const handleNavigation = () => {
        if (onNavigate) onNavigate();
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
            {/* Logo Section */}
            <div className="p-8 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary rounded-lg rotate-45 shadow-sm shadow-primary/20" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-foreground">Nexis</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 scrollbar-hide">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavigation}
                            className={cn(
                                "flex items-center gap-4 px-5 py-3.5 text-sm font-medium rounded-2xl transition-all duration-300 relative group",
                                isActive
                                    ? "text-primary bg-primary/5 font-bold shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                            )}
                            {/* Removed fill-current to prevent icon filling */}
                            <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 space-y-4">
                {/* Upgrade Card (Only for Free Plan) */}
                {!isPro && (
                    <div className="bg-gradient-to-br from-primary/10 to-orange-100 dark:to-orange-900/10 p-5 rounded-[1.5rem] relative overflow-hidden border border-primary/10">
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                                <Zap className="w-5 h-5 text-primary fill-current" />
                            </div>
                            <h4 className="font-bold text-foreground text-sm mb-1">Перейти на Pro</h4>
                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Отримайте доступ до всіх можливостей.</p>
                            <Button asChild size="sm" className="w-full rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white border-none">
                                <Link href="/pricing" onClick={handleNavigation}>Покращити план</Link>
                            </Button>
                        </div>
                        {/* Abstract Background Decoration */}
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
                        <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-orange-300/20 rounded-full blur-xl" />
                    </div>
                )}

                {/* User Profile moved to Header as per request */}
            </div>
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-64 flex-col bg-transparent rounded-[2rem] shadow-xl border border-border/50 z-50 overflow-hidden">
            <SidebarContent />
        </aside>
    );
}
