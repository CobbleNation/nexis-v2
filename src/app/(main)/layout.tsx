'use client';

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles, X, Brain } from "lucide-react";
import { toast } from "sonner";
import { UnifiedAssistant } from "@/components/ai/UnifiedAssistant";



export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user, isLoading, updateProfile } = useAuth();
    const router = useRouter();

    const [showAssistant, setShowAssistant] = useState(false);

    useEffect(() => {
        const handleOpenAssistant = () => setShowAssistant(true);
        window.addEventListener('open-assistant', handleOpenAssistant);
        return () => window.removeEventListener('open-assistant', handleOpenAssistant);
    }, []);

    useEffect(() => {
        if (user && user.onboardingCompleted === false) {
             toast('Заповніть профіль, щоб Nexis міг краще вам допомагати!', {
                 action: { label: 'Заповнити', onClick: () => setShowAssistant(true) },
                 duration: 60000,
             })
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            
            <UnifiedAssistant open={showAssistant} onClose={() => setShowAssistant(false)} />
        </div>
    );
}
