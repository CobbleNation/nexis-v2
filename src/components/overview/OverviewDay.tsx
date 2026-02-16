'use client';

import { motion } from 'framer-motion';
import { ContextBrief } from '@/components/overview/ContextBrief';
import { OneFocus } from '@/components/overview/OneFocus';
import { Signals, Signal } from '@/components/overview/Signals';
import { ContextGoals } from '@/components/overview/ContextGoals';
import { Action, Goal, LifeArea } from '@/types';
import { toast } from 'sonner';
import { useData } from '@/lib/store';

interface OverviewDayProps {
    filteredActions: Action[];
    filteredGoals: Goal[];
    activeArea: LifeArea | undefined;
    activeColor: string;
}

export function OverviewDay({ filteredActions, filteredGoals, activeArea, activeColor }: OverviewDayProps) {
    const { state, dispatch } = useData();

    // 1. Identify "One Focus"
    // Priority: High Priority > Scheduled Today > First available
    const oneFocus = filteredActions.find((a: Action) => a.priority === 'high' && !a.completed)
        || filteredActions.find((a: Action) => !a.completed);

    // 2. Generate Signals
    const signals: Signal[] = [];

    const inactiveArea = state.areas.find((area: any) => {
        const areaActions = state.actions.filter((a: Action) => a.areaId === area.id);
        return areaActions.length === 0;
    });

    if (inactiveArea) {
        signals.push({
            id: 'sig-1',
            type: 'warning',
            message: `${inactiveArea.title}: немає активності`,
            area: inactiveArea.title
        });
    }

    if (filteredActions.filter((a: Action) => a.completed).length > 3) {
        signals.push({
            id: 'sig-2',
            type: 'positive',
            message: "Високий темп виконання",
            area: activeArea?.title || "Система"
        });
    }

    // Handlers
    const handleCompleteFocus = (id: string) => {
        dispatch({ type: 'TOGGLE_ACTION', payload: { id } });
        toast.success("Фокус завершено! Чудова робота.");
    };

    const handleSetFocus = () => {
        toast.info("Натисніть Cmd+K або 'Додати' щоб створити завдання");
    };

    return (
        <div className="space-y-12" id="onboarding-plan-day">
            {/* 2. Context Brief */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <ContextBrief
                    activeCount={filteredActions.length}
                    highPriorityCount={filteredActions.filter((a: Action) => a.priority === 'high').length}
                    stagnantAreas={inactiveArea ? [inactiveArea.title] : []}
                    focusArea={activeArea?.title}
                />
            </motion.div>

            {/* 3. One Focus (Centerpiece) */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <OneFocus
                    action={oneFocus}
                    onComplete={handleCompleteFocus}
                    onSetFocus={handleSetFocus}
                />
            </motion.div>

            {/* 4. Signals & Warnings */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Signals signals={signals.slice(0, 3)} />
            </motion.div>

            {/* 5. Context Goals (Why we are here) */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <ContextGoals goals={filteredGoals} areaColor={activeArea?.color} />
            </motion.div>
        </div>
    );
}
