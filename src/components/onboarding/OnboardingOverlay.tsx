'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useOnboarding, OnboardingStepId } from './OnboardingProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ArrowRight, Play, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StepConfig {
    id: OnboardingStepId;
    title: string;
    description: string;
    targetId?: string;
    targetSelector?: string; // New: Support generic selectors
    position?: 'top' | 'bottom' | 'left' | 'right';
    autoAdvance?: boolean;
    additionalTargets?: string[]; // For cases like metric direction (multiple buttons)
}

const STEPS: Record<OnboardingStepId, StepConfig> = {
    'welcome': {
        id: 'welcome',
        title: 'Ласкаво просимо',
        description: 'Давайте швидко налаштуємо вашу систему продуктивності (3 хв).',
    },
    'intro-sidebar': {
        id: 'intro-sidebar',
        title: 'Навігація',
        description: 'Ось ваша головна панель управління. Почнемо зі Сфер.',
        targetId: 'sidebar-container', // Covers full sidebar
        position: 'right',
        autoAdvance: true
    },
    'intro-areas': {
        id: 'intro-areas',
        title: 'Сфери Життя',
        description: 'Тут живуть ваші головні напрямки. Натисніть, щоб перейти.',
        targetId: 'sidebar-nav-areas',
        position: 'right',
        autoAdvance: true
    },
    'navigate-health': {
        id: 'navigate-health',
        title: 'Деталі Сфери',
        description: 'Відкрийте сферу (наприклад, "Здоров\'я").',
        targetSelector: '[id^="area-card-"]',
        position: 'top',
        autoAdvance: true
    },
    'explain-area-navigation': {
        id: 'explain-area-navigation',
        title: 'Вкладки Сфери',
        description: 'Перемикайтесь між цілями, діями та нотатками.',
        targetId: 'area-navigation-tabs',
        position: 'bottom',
        autoAdvance: true
    },
    'explain-area-goals': {
        id: 'explain-area-goals',
        title: 'Активні Цілі',
        description: 'Ваші головні пріоритети в цій сфері тримаються тут.',
        targetId: 'area-active-goals-section',
        position: 'bottom',
        autoAdvance: true
    },
    'explain-area-activity': {
        id: 'explain-area-activity',
        title: 'Історія Активності',
        description: 'Слідкуйте за останніми змінами та прогресом.',
        targetId: 'area-activity-section',
        position: 'bottom',
        autoAdvance: true
    },
    'explain-area-metrics': {
        id: 'explain-area-metrics',
        title: 'Ключові Метрики',
        description: 'Числові показники вашого успіху (вага, години, тощо).',
        targetId: 'area-metrics-section',
        position: 'left',
        autoAdvance: true
    },
    // REMOVED back-to-sidebar-from-area
    'navigate-schedule': {
        id: 'navigate-schedule',
        title: 'Розклад',
        description: 'Натисніть сюди, щоб відкрити календар.',
        targetId: 'sidebar-nav-timeline',
        position: 'right',
        autoAdvance: true
    },
    'explain-schedule-topbar': {
        id: 'explain-schedule-topbar',
        title: 'Період та Вигляд',
        description: 'Змінюйте масштаб (День, Тиждень) тут.',
        targetId: 'schedule-view-selector', // Specific selector
        position: 'bottom',
        autoAdvance: true
    },
    'explain-schedule-time': {
        id: 'explain-schedule-time',
        title: 'Поточний Час',
        description: 'Червона лінія показує, де ви зараз.',
        targetId: 'schedule-current-time-indicator',
        position: 'top',
        autoAdvance: true
    },
    'explain-schedule-table': {
        id: 'explain-schedule-table',
        title: 'Часова Сітка',
        description: 'Ваш день як на долоні. Плануйте блоками.',
        targetId: 'schedule-time-table',
        position: 'top',
        autoAdvance: false
    },
    'navigate-tasks': {
        id: 'navigate-tasks',
        title: 'Завдання',
        description: 'Перейдіть до списку всіх дій.',
        targetId: 'sidebar-nav-actions',
        position: 'right',
        autoAdvance: true
    },
    // REMOVED explain-tasks-intro
    'explain-task-tabs': {
        id: 'explain-task-tabs',
        title: 'Типи Завдань',
        description: 'Перемикайтесь між Рутиною, Звичками та звичайними справами.',
        targetId: 'tasks-tabs',
        position: 'bottom',
        autoAdvance: false
    },

    // Goals
    'navigate-goals': {
        id: 'navigate-goals',
        title: 'Цілі та Проекти',
        description: 'Перейдіть до стратегічного планування.',
        targetId: 'sidebar-nav-goals',
        position: 'right',
        autoAdvance: true
    },
    'explain-goals-intro': {
        id: 'explain-goals-intro',
        title: 'Стратегія',
        description: 'Тут живуть ваші амбіції та великі проекти.',
        targetId: 'goals-container',
        position: 'top',
        autoAdvance: true
    },
    // Goal Creation
    // Reordered: Type first.

    // Content
    'navigate-content': {
        id: 'navigate-content',
        title: 'Контент',
        description: 'Перейдіть до бази знань.',
        targetId: 'sidebar-nav-content',
        position: 'right',
        autoAdvance: true
    },
    'explore-content-tabs': {
        id: 'explore-content-tabs',
        title: 'База Знань',
        description: 'Нотатки, Ідеї, Медіа. Все в одному місці.',
        targetId: 'content-tabs',
        position: 'bottom',
        autoAdvance: false
    },

    // Analytics
    'navigate-analytics': {
        id: 'navigate-analytics',
        title: 'Аналітика',
        description: 'Перейдіть до статистики.',
        targetId: 'sidebar-nav-insights',
        position: 'right',
        autoAdvance: true
    },
    'explain-analytics': {
        id: 'explain-analytics',
        title: 'Ваші Показники',
        description: 'Баланс, Продуктивність та Прогрес по цілям.',
        targetId: 'analytics-container',
        position: 'top', // Changed from default to top to avoid cutoff
        autoAdvance: false
    },
    // Overview
    'navigate-overview': {
        id: 'navigate-overview',
        title: 'Огляд',
        description: 'Поверніться на головну.',
        targetId: 'sidebar-nav-overview',
        position: 'right',
        autoAdvance: true
    },
    'explain-overview-blocks': {
        id: 'explain-overview-blocks',
        title: 'Дашборд',
        description: 'Тут зібрано все важливе на сьогодні.',
        targetId: 'overview-container',
        position: 'top',
        autoAdvance: true
    },
    'explain-focus-level': {
        id: 'explain-focus-level',
        title: 'Рівень Фокусу',
        description: 'Це ваш головний показник. Виконуйте завдання вчасно, щоб тримати його високим.',
        targetId: 'focus-level-card',
        position: 'bottom',
        autoAdvance: false
    },
    'explain-top-bar': {
        id: 'explain-top-bar',
        title: 'Верхня Панель',
        description: 'Швидкий доступ до пошуку, сповіщень та профілю.',
        targetId: 'header-container',
        position: 'bottom',
        autoAdvance: false
    },
    'completed': {
        id: 'completed',
        title: 'Навчання Завершено! 🚀',
        description: 'Ви успішно пройшли курс бійця. Час перемагати.',
    }
};

export function OnboardingOverlay() {
    const { isActive, currentStep, nextStep, skipOnboarding, completeOnboarding } = useOnboarding();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = STEPS[currentStep];

    console.log(`[OnboardingOverlay] Render. Active: ${isActive}, Step: ${currentStep}, TargetRect: ${!!targetRect}`);

    useEffect(() => {
        if (!isActive || !step) return;

        const updateRect = () => {
            let target: Element | null = null;
            if (step.targetId) {
                target = document.getElementById(step.targetId);
            } else if (step.targetSelector) {
                target = document.querySelector(step.targetSelector);
            }

            if (target) {
                const rect = target.getBoundingClientRect();
                setTargetRect(rect);
            } else {
                setTargetRect(null);
            }
        };

        updateRect();

        // Retry loop for dynamic content
        const interval = setInterval(updateRect, 100);
        const timeout = setTimeout(() => clearInterval(interval), 3000);

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [isActive, currentStep, step]);

    // Click-to-Advance Logic
    useEffect(() => {
        if (!isActive || !step || !targetRect) return;

        const handleClick = (e: MouseEvent) => {
            // If the click is inside the target element, advance
            if (
                e.clientX >= targetRect.left &&
                e.clientX <= targetRect.right &&
                e.clientY >= targetRect.top &&
                e.clientY <= targetRect.bottom
            ) {
                console.log("[Onboarding] Clicked target, advancing...");
                // Small delay to allow potential UI actions (like navigation) to start
                setTimeout(() => nextStep(), 150);
            }
        };

        // Capture phase to intercept before React if needed, but bubbling is usually fine for "monitoring"
        // Using capture to ensure we see it even if propagation stopped? No, bubbling is safer for "did it happen".
        // Actually, we want to detect if they clicked the target.
        window.addEventListener('click', handleClick, true); // Use capture to detect even if handled

        return () => window.removeEventListener('click', handleClick, true);
    }, [isActive, step, targetRect, nextStep]);

    // Success Confetti
    useEffect(() => {
        if (currentStep === 'completed' && isActive) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [currentStep, isActive]);

    if (!isActive) return null;

    if (!step && currentStep !== 'welcome' && currentStep !== 'completed') return null;

    // Full Screen Welcome / Completed (Same as before)
    if (currentStep === 'welcome' || currentStep === 'completed') {
        return (
            <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-500">
                <div className="max-w-md space-y-8 relative">
                    {currentStep === 'welcome' && (
                        <>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="space-y-4"
                            >
                                <h1 className="text-4xl font-bold tracking-tight">Ласкаво просимо в Zynorvia.</h1>
                                <p className="text-xl text-muted-foreground">
                                    Давайте за 2 хвилини налаштуємо систему під вас.
                                </p>
                            </motion.div>
                            <div className="flex gap-4 justify-center pt-4">
                                <Button size="lg" onClick={nextStep} className="rounded-full px-8 text-lg gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20">
                                    <Play className="h-5 w-5" /> Розпочати
                                </Button>
                                <Button variant="ghost" onClick={skipOnboarding} className="rounded-full text-muted-foreground">
                                    Пропустити
                                </Button>
                            </div>
                        </>
                    )}

                    {currentStep === 'completed' && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check className="h-10 w-10" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight">Все налаштовано 🎉</h1>
                                <p className="text-lg text-muted-foreground">
                                    Тепер це ваш простір для дій та рішень.
                                </p>
                            </motion.div>
                            <div className="pt-8">
                                <Button size="lg" onClick={completeOnboarding} className="rounded-full px-12 text-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                                    Перейти до Продукту
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Step Overlay
    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
            {targetRect && (
                <>
                    {/* Simplified mask: 4 rectangles */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute bg-black/60 backdrop-blur-[1px] pointer-events-auto transition-all duration-300"
                        style={{ top: 0, left: 0, right: 0, height: targetRect.top - 4 }}
                    />
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute bg-black/60 backdrop-blur-[1px] pointer-events-auto transition-all duration-300"
                        style={{ top: targetRect.bottom + 4, left: 0, right: 0, bottom: 0 }}
                    />
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute bg-black/60 backdrop-blur-[1px] pointer-events-auto transition-all duration-300"
                        style={{ top: targetRect.top - 4, bottom: window.innerHeight - (targetRect.bottom + 4), left: 0, width: targetRect.left - 4 }}
                    />
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute bg-black/60 backdrop-blur-[1px] pointer-events-auto transition-all duration-300"
                        style={{ top: targetRect.top - 4, bottom: window.innerHeight - (targetRect.bottom + 4), right: 0, left: targetRect.right + 4 }}
                    />

                    {/* Spotlight Glow */}
                    <div
                        className="absolute rounded-lg ring-4 ring-orange-500/50 transition-all duration-300 animate-pulse"
                        style={{
                            top: targetRect.top - 4,
                            left: targetRect.left - 4,
                            width: targetRect.width + 8,
                            height: targetRect.height + 8,
                        }}
                    />

                    {/* Tooltip */}
                    <div
                        className="absolute w-full max-w-sm pointer-events-none"
                        style={{
                            top: (() => {
                                // Side positioning (Left/Right)
                                if (step.position === 'left' || step.position === 'right') {
                                    // Default to centering vertically relative to target
                                    let top = targetRect.top + (targetRect.height / 2) - 100; // Approx center minus half tooltip height
                                    // Clamp to screen edges
                                    top = Math.max(20, Math.min(window.innerHeight - 250, top));
                                    return top;
                                }

                                // Top/Bottom positioning
                                const TOOLTIP_EST_HEIGHT = 200;
                                const spaceAbove = targetRect.top;
                                const spaceBelow = window.innerHeight - targetRect.bottom;
                                const prefersTop = step.position === 'top' || (step.position !== 'bottom' && spaceAbove > spaceBelow);

                                const useTop = prefersTop && spaceAbove > TOOLTIP_EST_HEIGHT ? true :
                                    !prefersTop && spaceBelow < TOOLTIP_EST_HEIGHT && spaceAbove > TOOLTIP_EST_HEIGHT ? true :
                                        false;

                                return useTop ? 'auto' : targetRect.bottom + 20;
                            })(),
                            bottom: (() => {
                                if (step.position === 'left' || step.position === 'right') return 'auto';

                                const TOOLTIP_EST_HEIGHT = 200;
                                const spaceAbove = targetRect.top;
                                const spaceBelow = window.innerHeight - targetRect.bottom;
                                const prefersTop = step.position === 'top' || (step.position !== 'bottom' && spaceAbove > spaceBelow);

                                const useTop = prefersTop && spaceAbove > TOOLTIP_EST_HEIGHT ? true :
                                    !prefersTop && spaceBelow < TOOLTIP_EST_HEIGHT && spaceAbove > TOOLTIP_EST_HEIGHT ? true :
                                        false;

                                return useTop ? window.innerHeight - targetRect.top + 20 : 'auto';
                            })(),
                            left: (() => {
                                if (step.position === 'right') {
                                    return targetRect.right + 20;
                                }
                                if (step.position === 'left') {
                                    return targetRect.left - 360; // Approx width + padding
                                }
                                return Math.max(20, Math.min(window.innerWidth - 340, targetRect.left));
                            })(),
                            right: step.position === 'left' ? window.innerWidth - targetRect.left + 20 : 'auto'
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="pointer-events-auto bg-white dark:bg-card p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-border"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{step.title}</h3>
                                <button onClick={skipOnboarding} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                {step.description}
                            </p>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-1">
                                    {/* Progress dots (simplified) */}
                                    <div className="text-xs text-muted-foreground">
                                        {/* Optional: Step X of Y */}
                                    </div>
                                </div>
                                <Button size="sm" onClick={nextStep} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                                    {step.autoAdvance ? 'Пропустити' : 'Далі'} <ArrowRight className="h-3 w-3 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
}
