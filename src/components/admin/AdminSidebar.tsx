'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Database,
    ShieldAlert,
    LogOut,
    ArrowLeft,
    Activity,
    Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/content', label: 'Content', icon: Database },
    { href: '/admin/analytics', label: 'Analytics', icon: Activity },
    { href: '/admin/audit', label: 'Audit Logs', icon: ShieldAlert },
];

function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100">
            <div className="p-6 border-b border-slate-800">
                <Link href="/admin" className="flex items-center gap-2" onClick={onNavigate}>
                    <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        Zynorvia Admin
                    </span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-2">
                <Link href="/overview" onClick={onNavigate}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800">
                        <ArrowLeft className="h-4 w-4" />
                        Back to App
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

export function AdminSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 h-screen flex-col border-r border-slate-800 shrink-0">
                <AdminSidebarContent />
            </aside>

            {/* Mobile Header Bar + Sheet */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
                <span className="text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Zynorvia Admin
                </span>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                            <Menu className="h-5 w-5" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 border-r-slate-800 bg-slate-900">
                        <AdminSidebarContent onNavigate={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
