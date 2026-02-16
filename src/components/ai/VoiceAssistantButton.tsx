
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { VoiceOverlay } from './VoiceOverlay';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { LIMITS, SUBSCRIPTION_PLAN } from '@/lib/limits';
import { UpgradeModal } from '@/components/common/UpgradeModal';

interface VoiceAssistantButtonProps {
    className?: string;
    variant?: 'nav' | 'fab';
}

export function VoiceAssistantButton({ className, variant = 'nav' }: VoiceAssistantButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const { tier } = useSubscription();

    const handleOpen = () => {
        if (!LIMITS[tier].HAS_VOICE) {
            setShowUpgrade(true);
            return;
        }
        setIsOpen(true);
    };

    if (variant === 'fab') {
        return (
            <>
                <Button
                    onClick={handleOpen}
                    className={cn(
                        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white z-50 flex items-center justify-center transition-transform hover:scale-105",
                        className
                    )}
                >
                    <Mic className="w-6 h-6" />
                </Button>
                <VoiceOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
                <UpgradeModal
                    open={showUpgrade}
                    onOpenChange={setShowUpgrade}
                    title="Голосовий Асистент"
                    description="Керуйте життям голосом. Створюйте завдання, нотатки та підсумки розмовляючи."
                />
            </>
        );
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleOpen}
                className={cn(
                    "text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors",
                    className
                )}
                title="Голосовий асистент"
            >
                <div className="relative">
                    <Mic className="w-5 h-5" />
                    {/* Optional: Add a subtle badge or dot if needed */}
                </div>
            </Button>
            <VoiceOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title="Голосовий Асистент"
                description="Керуйте життям голосом. Створюйте завдання, нотатки та підсумки розмовляючи."
            />
        </>
    );
}
