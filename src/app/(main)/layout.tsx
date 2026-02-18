import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import React from "react";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
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
