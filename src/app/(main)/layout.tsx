'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

function OnboardingResumer({ setShowOnboarding }: { setShowOnboarding: (val: boolean) => void }) {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const resume = searchParams?.get('resume_onboarding');
        if (resume === 'deep_plan' || resume === 'true') {
            setShowOnboarding(true);
        }
    }, [searchParams, setShowOnboarding]);

    return null;
}

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, isLoading, updateProfile } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                ... 
            </div>
        );
    }

    if (!user) {
        return null;
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
                <main className="flex-1 p-4 md:p-6 pb-28 md:pb-6 relative min-h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)] md:overflow-y-auto scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
