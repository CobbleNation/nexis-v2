import React from 'react';
import { Plus, BarChart2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from "@/lib/store";

interface QuickActionsBlockProps {
    onAddGoal: () => void;
    onAddMetric?: () => void;
}

export function QuickActionsBlock({ onAddGoal, onAddMetric }: QuickActionsBlockProps) {
    // These handlers will likely open global modals
    const { dispatch } = useData();

    // Placeholder handlers if not passed
    const handleAddGoal = onAddGoal || (() => {
        // Dispatch event or open modal logic would go here if not handled by parent
        window.dispatchEvent(new CustomEvent('zynorvia:open-quick-add', { detail: { tab: 'goal' } }));
    });

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button
                onClick={handleAddGoal}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold gap-2 shadow-lg shadow-black/5"
            >
                <Target className="w-4 h-4" />
                Додати Ціль
            </Button>

            <Button
                variant="outline"
                className="rounded-full border-border/60 hover:bg-secondary/50 font-medium gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => window.dispatchEvent(new CustomEvent('zynorvia:open-quick-add', { detail: { tab: 'task' } }))}
            >
                <Plus className="w-4 h-4" />
                Зафіксувати
            </Button>

            <Button
                variant="outline"
                className="rounded-full border-border/60 hover:bg-secondary/50 font-medium gap-2 text-muted-foreground hover:text-foreground"
            // Metric adding logic might be more specific, for now placeholder
            >
                <BarChart2 className="w-4 h-4" />
                Оновити метрику
            </Button>
        </div>
    );
}
