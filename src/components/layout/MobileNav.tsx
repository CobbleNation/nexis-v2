'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, CheckSquare, Target, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContent } from '@/components/layout/Sidebar';
import { useState } from 'react';
import { QuickAddModal } from '@/components/features/QuickAddModal';

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const MOBILE_ITEMS = [
        { name: 'Огляд', href: '/overview', icon: LayoutDashboard },
        { name: 'Розклад', href: '/timeline', icon: History },
        { name: 'Завдання', href: '/actions', icon: CheckSquare },
        { name: 'Цілі', href: '/goals', icon: Target },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2 pb-4 pt-2 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
            <Link
                href="/overview"
                className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 w-16",
                    pathname.startsWith('/overview') ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <div className={cn("relative flex items-center justify-center h-8 w-8 rounded-xl mb-1 transition-colors", pathname.startsWith('/overview') ? "bg-primary/10" : "bg-transparent")}>
                    <LayoutDashboard className={cn("h-5 w-5", pathname.startsWith('/overview') ? "text-primary" : "text-muted-foreground")} />
                </div>
                <span className="text-[10px]">Огляд</span>
            </Link>

            <Link
                href="/timeline"
                className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 w-16",
                    pathname.startsWith('/timeline') ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <div className={cn("relative flex items-center justify-center h-8 w-8 rounded-xl mb-1 transition-colors", pathname.startsWith('/timeline') ? "bg-primary/10" : "bg-transparent")}>
                    <History className={cn("h-5 w-5", pathname.startsWith('/timeline') ? "text-primary" : "text-muted-foreground")} />
                </div>
                <span className="text-[10px]">Розклад</span>
            </Link>

            <button
                onClick={() => setShowQuickAdd(true)}
                className="flex flex-col items-center justify-center -mt-6 p-1 relative z-10"
            >
                <div className="h-14 w-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center text-white active:scale-95 transition-transform">
                    <CheckSquare className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-orange-600">Додати</span>
            </button>

            <Link
                href="/goals?tab=active"
                className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 w-16",
                    pathname.startsWith('/goals') ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <div className={cn("relative flex items-center justify-center h-8 w-8 rounded-xl mb-1 transition-colors", pathname.startsWith('/goals') ? "bg-primary/10" : "bg-transparent")}>
                    <Target className={cn("h-5 w-5", pathname.startsWith('/goals') ? "text-primary" : "text-muted-foreground")} />
                </div>
                <span className="text-[10px]">Цілі</span>
            </Link>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <button className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 w-16 text-muted-foreground hover:text-foreground">
                        <div className="relative flex items-center justify-center h-8 w-8 rounded-xl mb-1 bg-transparent">
                            <Menu className="h-5 w-5" />
                        </div>
                        <span className="text-[10px]">Меню</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[85%] max-w-[320px] border-r-border bg-sidebar">
                    <SidebarContent onNavigate={() => setOpen(false)} />
                </SheetContent>
            </Sheet>

            <QuickAddModal open={showQuickAdd} onOpenChange={setShowQuickAdd} />
        </div>
    );
}
