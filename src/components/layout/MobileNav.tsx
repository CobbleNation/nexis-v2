'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, CheckSquare, Target, Menu, Home, Folder, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContent } from '@/components/layout/Sidebar';
import { useState } from 'react';
import { QuickAddModal } from '@/components/features/QuickAddModal';
import { UnifiedAssistant } from '@/components/ai/UnifiedAssistant';

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);

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
                    pathname.startsWith('/overview') ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <div className={cn("relative flex items-center justify-center h-8 w-8 rounded-xl mb-1 transition-colors", pathname.startsWith('/overview') ? "bg-primary/10 shadow-sm" : "bg-transparent")}>
                    <LayoutDashboard className={cn("h-5 w-5", pathname.startsWith('/overview') ? "text-primary fill-primary/20" : "text-muted-foreground")} strokeWidth={pathname.startsWith('/overview') ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] tracking-wide", pathname.startsWith('/overview') && "font-semibold")}>Огляд</span>
            </Link>

            <Link
                href="/timeline"
                className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 w-16",
                    pathname.startsWith('/timeline') ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <div className={cn("relative flex items-center justify-center h-8 w-8 rounded-xl mb-1 transition-colors", pathname.startsWith('/timeline') ? "bg-primary/10 shadow-sm" : "bg-transparent")}>
                    <History className={cn("h-5 w-5", pathname.startsWith('/timeline') ? "text-primary fill-primary/20" : "text-muted-foreground")} strokeWidth={pathname.startsWith('/timeline') ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] tracking-wide", pathname.startsWith('/timeline') && "font-semibold")}>Розклад</span>
            </Link>

            <button
                onClick={() => setShowAssistant(true)}
                className="flex flex-col items-center justify-center -mt-6 p-1 relative z-10 group"
            >
                <div className="h-14 w-14 bg-gradient-to-tr from-indigo-500 to-indigo-700 dark:from-indigo-600 dark:to-indigo-900 rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center text-white transition-all transform group-active:scale-95 group-hover:shadow-indigo-500/50 outline outline-4 outline-background">
                    <Brain className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold mt-1 text-indigo-600 dark:text-indigo-400">Nexis OS</span>
            </button>

            <Link
                href="/projects"
                className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 w-16",
                    pathname.startsWith('/projects') ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <div className={cn("relative flex items-center justify-center h-8 w-8 rounded-xl mb-1 transition-colors", pathname.startsWith('/projects') ? "bg-primary/10 shadow-sm" : "bg-transparent")}>
                    <Folder className={cn("h-5 w-5", pathname.startsWith('/projects') ? "text-primary fill-primary/20" : "text-muted-foreground")} strokeWidth={pathname.startsWith('/projects') ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] tracking-wide", pathname.startsWith('/projects') && "font-semibold")}>Проекти</span>
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
                <SheetContent side="bottom" className="h-[100dvh] rounded-none p-0 flex flex-col items-center hide-bottom-safe-area pt-top-safe">
                    <div className="w-12 h-1.5 bg-muted rounded-full mt-6 mb-2 flex-shrink-0" />
                    
                    <div className="w-full flex-1 overflow-y-auto mt-6 px-6 pb-20 no-scrollbar relative z-10">
                        <SidebarContent onNavigate={() => setOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

            <QuickAddModal open={showQuickAdd} onOpenChange={setShowQuickAdd} />
            <UnifiedAssistant open={showAssistant} onClose={() => setShowAssistant(false)} />
        </div>
    );
}
