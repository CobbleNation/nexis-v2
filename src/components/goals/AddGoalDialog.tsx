'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/lib/store';
import { Plus, Loader2, Target, Compass, Flag, ChevronRight, ChevronLeft, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Goal } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { GOAL_TEMPLATES } from '@/lib/goal-templates';
import { cn } from '@/lib/utils';
import { GoalCreationWizard } from './GoalCreationWizard';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/common/UpgradeModal';

interface AddGoalDialogProps {
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialTitle?: string;
    initialAreaId?: string;
}

export function AddGoalDialog({ trigger, isOpen, onOpenChange, initialTitle, initialAreaId }: AddGoalDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Controlled vs Uncontrolled logic
    const isControlled = isOpen !== undefined;
    const open = isControlled ? isOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const { canCreateGoal } = useSubscription();
    const [showUpgrade, setShowUpgrade] = useState(false);

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen && !canCreateGoal()) {
            setShowUpgrade(true);
            return;
        }
        setOpen(newOpen);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Нова Ціль
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="w-[95%] sm:max-w-[700px] p-0 gap-0 overflow-hidden rounded-2xl h-[90vh] sm:h-[600px] bg-white">
                    <GoalCreationWizard
                        initialTitle={initialTitle}
                        initialAreaId={initialAreaId}
                        onComplete={() => setOpen(false)}
                        onCancel={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title="Ліміт цілей досягнуто"
                description="У Free-версії доступно до 3 активних цілей. Перейдіть на Pro, щоб додавати необмежену кількість."
            />
        </>
    );
}
