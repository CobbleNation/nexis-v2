'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

export function SidebarUpsell() {
    const { user, isLoading } = useAuth();

    // 1. Visibility Logic
    if (isLoading || !user) return null;
    if (user.subscriptionTier === 'pro') return null;

    return (
        <div className="px-3 py-3 mt-auto">
            <Link href="/pricing" className="group block relative overflow-hidden rounded-xl bg-sidebar-accent/30 hover:bg-sidebar-accent/60 border border-sidebar-border/50 hover:border-orange-500/20 transition-all p-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:shadow-sm transition-all duration-300">
                        <Sparkles className="h-4 w-4 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground group-hover:text-orange-600 transition-colors">Upgrade Plan</span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80">Unlock full potential</span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
