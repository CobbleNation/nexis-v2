'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useData } from '@/lib/store';
import { seedOnboardingData } from '@/lib/onboarding-seed';

export type OnboardingStepId =
    | 'welcome'
    // 1. Sidebar Intro
    | 'intro-sidebar'
    // 2. Areas
    | 'intro-areas'
    | 'navigate-health'
    | 'explain-area-navigation'
    | 'explain-area-goals'
    | 'explain-area-activity'
    | 'explain-area-metrics'
    // 3. Schedule
    | 'navigate-schedule'
    | 'explain-schedule-topbar'
    | 'explain-schedule-time'
    | 'explain-schedule-table'
    // 4. Tasks
    | 'navigate-tasks'
    | 'explain-task-tabs' // Routine, Habits

    // 5. Goals & Projects
    | 'navigate-goals'
    | 'explain-goals-intro'
    // 6. Content
    | 'navigate-content'
    | 'explore-content-tabs'
    // 7. Analytics
    | 'navigate-analytics'
    | 'explain-analytics'
    // 8. Overview
    | 'navigate-overview'
    | 'explain-overview-blocks'
    | 'explain-focus-level'
    // TOP BAR
    | 'explain-top-bar'
    | 'completed';

interface OnboardingContextType {
    isActive: boolean;
    currentStep: OnboardingStepId;
    nextStep: () => void;
    skipOnboarding: () => void;
    startOnboarding: () => void;
    completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const { user, updateProfile } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState<OnboardingStepId>('welcome');
    const [isHydrated, setIsHydrated] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Hydrate from localStorage
    useEffect(() => {
        const savedStep = localStorage.getItem('onboarding_step') as OnboardingStepId;
        const savedActive = localStorage.getItem('onboarding_active') === 'true';

        if (savedStep && savedActive) {
            setCurrentStep(savedStep);
            setIsActive(true);
        }
        setIsHydrated(true);
    }, []);

    // Persist state
    useEffect(() => {
        if (isHydrated) {
            if (isActive) {
                localStorage.setItem('onboarding_step', currentStep);
                localStorage.setItem('onboarding_active', 'true');
            } else {
                localStorage.removeItem('onboarding_step');
                localStorage.removeItem('onboarding_active');
            }
        }
    }, [isActive, currentStep, isHydrated]);

    // Auto-start for new users (only after hydration)
    const { dispatch, state } = useData();

    useEffect(() => {
        if (user && isHydrated && !state.isLoading) {
            // Only start if not active and no saved state was restored (implied by !isActive check above)
            if (!isActive && currentStep === 'welcome' && !localStorage.getItem('onboarding_active')) {
                // Check user profile if they completed it before
                if (user.onboardingCompleted !== true) {
                    console.log("Starting onboarding for user:", user.id);
                    setIsActive(true);

                    // Seed Data if not already seeded
                    // Seed Data if not already seeded
                    if (!localStorage.getItem('onboarding_seeded_v2')) {
                        console.log("Seeding default onboarding data (v2)...");
                        seedOnboardingData(dispatch, state.areas, state, user.id);
                        localStorage.setItem('onboarding_seeded_v2', 'true');
                    }
                }
            }
        }
    }, [user, isActive, currentStep, isHydrated, state.areas, dispatch, state.isLoading]);



    const [lastStepTime, setLastStepTime] = useState(0);

    const nextStep = useCallback(() => {
        console.log("[Onboarding] nextStep called");
        const now = Date.now();
        if (now - lastStepTime < 500) { // 500ms debounce
            console.log("Onboarding transition ignored: too fast");
            return;
        }
        setLastStepTime(now);

        setCurrentStep((prev) => {
            console.log(`[Onboarding] Calculating next step from: ${prev}`);
            let next: OnboardingStepId = prev;
            switch (prev) {
                case 'welcome': next = 'intro-sidebar'; break;

                // Areas
                case 'intro-sidebar': next = 'intro-areas'; break;
                case 'intro-areas': next = 'navigate-health'; break;
                // Granular Area Steps
                case 'navigate-health': next = 'explain-area-navigation'; break;
                case 'explain-area-navigation': next = 'explain-area-goals'; break;
                case 'explain-area-goals': next = 'explain-area-activity'; break;
                case 'explain-area-activity': next = 'explain-area-metrics'; break;
                // REMOVED back-to-sidebar-from-area
                case 'explain-area-metrics': next = 'navigate-schedule'; break;

                // Schedule
                case 'navigate-schedule': next = 'explain-schedule-topbar'; break;
                case 'explain-schedule-topbar': next = 'explain-schedule-time'; break;
                case 'explain-schedule-time': next = 'explain-schedule-table'; break;
                case 'explain-schedule-table': next = 'navigate-tasks'; break;

                // Tasks
                case 'navigate-tasks': next = 'explain-task-tabs'; break;
                case 'explain-task-tabs': next = 'navigate-goals'; break;
                // Goals
                case 'navigate-goals': next = 'explain-goals-intro'; break;
                case 'explain-goals-intro': next = 'navigate-content'; break;

                // Content
                case 'navigate-content': next = 'explore-content-tabs'; break;
                case 'explore-content-tabs': next = 'navigate-analytics'; break;

                // Analytics
                case 'navigate-analytics': next = 'explain-analytics'; break;
                case 'explain-analytics': next = 'navigate-overview'; break;

                // Overview & Top Bar
                case 'navigate-overview': next = 'explain-overview-blocks'; break;
                case 'explain-overview-blocks': next = 'explain-focus-level'; break;
                case 'explain-focus-level': next = 'explain-top-bar'; break;
                case 'explain-top-bar': next = 'completed'; break;

                default: next = prev; break;
            }
            console.log(`[Onboarding] Transition: ${prev} -> ${next}`);
            return next;
        });
    }, [lastStepTime]);

    const completeOnboarding = useCallback(async () => {
        setIsActive(false);
        setCurrentStep('completed');
        if (user) {
            await updateProfile({ onboardingCompleted: true });
        }
    }, [user, updateProfile]);

    const skipOnboarding = useCallback(async () => {
        setIsActive(false);
        if (user) {
            await updateProfile({ onboardingCompleted: true });
        }
    }, [user, updateProfile]);

    // Auto-complete when reaching 'completed' step
    useEffect(() => {
        if (currentStep === 'completed' && isActive) {
            // Short delay to allow any final animations if needed
            const timer = setTimeout(() => {
                completeOnboarding();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentStep, isActive, completeOnboarding]);

    const startOnboarding = useCallback(() => {
        setIsActive(true);
        setCurrentStep('welcome');
        router.push('/overview');
    }, [router]);

    return (
        <OnboardingContext.Provider value={{ isActive, currentStep, nextStep, skipOnboarding, startOnboarding, completeOnboarding }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
