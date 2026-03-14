'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { AiOnboardingModal } from "@/components/onboarding/AiOnboardingModal";

function OnboardingResumer({ setShowOnboarding }: { setShowOnboarding: (val: boolean) => void }) {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        if (searchParams?.get('resume_onboarding') === 'deep_plan') {
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
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isOnboardingMinimized, setIsOnboardingMinimized] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [isLoading, user, router]);

    useEffect(() => {
        if (user && user.onboardingCompleted === false) {
            // Cutoff date for when this feature was released
            const featureLaunchDate = new Date('2026-03-14T00:00:00Z').getTime();
            const userCreatedDate = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
            
            if (userCreatedDate < featureLaunchDate) {
                // Existing user -> Show button on the left, don't open modal
                setIsOnboardingMinimized(true);
            } else {
                // New user -> Open modal immediately
                setShowOnboarding(true);
            }
        }
    }, [user]);

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

    const handleOnboardingSuccess = async () => {
        await updateProfile({ onboardingCompleted: true });
        setShowOnboarding(false);
        setIsOnboardingMinimized(false);
    };

    const handleMinimize = () => {
        setShowOnboarding(false);
        setIsOnboardingMinimized(true);
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {user && (
                <React.Suspense fallback={null}>
                    <OnboardingResumer setShowOnboarding={setShowOnboarding} />
                </React.Suspense>
            )}

            {showOnboarding && (
                <AiOnboardingModal 
                    onSuccess={handleOnboardingSuccess} 
                    onMinimize={handleMinimize}
                />
            )}
            
            {/* Onboarding Resume Trigger */}
            {isOnboardingMinimized && !showOnboarding && (
                <div className="fixed bottom-6 left-6 z-[8000] animate-in slide-in-from-left-4 duration-300">
                    <button 
                        onClick={() => setShowOnboarding(true)}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-2xl shadow-xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 group"
                    >
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        <span className="font-semibold text-sm">Продовжити налаштування</span>
                    </button>
                </div>
            )}

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
