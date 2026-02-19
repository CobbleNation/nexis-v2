'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <React.Suspense fallback={<div className="w-64 hidden md:block bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />}>
                <Sidebar />
            </React.Suspense>
            <React.Suspense fallback={null}>
                <MobileNav />
            </React.Suspense>
            <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300 overflow-x-hidden">
                <Header />
                <main className="flex-1 p-3 md:p-6 pb-24 md:pb-6 relative min-h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)] md:overflow-y-auto scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
