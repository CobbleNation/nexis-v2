'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== 'admin') {
                router.replace('/overview');
            }
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-950 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null; // Will redirect
    }

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 dark">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
