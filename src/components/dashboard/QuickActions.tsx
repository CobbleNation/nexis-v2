'use client';

import {
    CheckSquare,
    Lightbulb,
    BarChart2,
    FolderPlus,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function QuickActions({
    onOpenAddModal
}: {
    onOpenAddModal?: (type: string) => void
}) {
    const router = useRouter();

    const actions = [
        {
            id: 'task',
            title: 'Нове завдання',
            icon: CheckSquare,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
            border: 'border-blue-500/20',
            onClick: () => onOpenAddModal?.('task')
        },
        {
            id: 'thought',
            title: 'Нова думка',
            icon: Lightbulb,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
            border: 'border-amber-500/20',
            onClick: () => onOpenAddModal?.('note') // Assuming 'note' is used for thoughts
        },
        {
            id: 'metric',
            title: 'Внести метрику',
            icon: BarChart2,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
            border: 'border-purple-500/20',
            onClick: () => onOpenAddModal?.('metric')
        },
        {
            id: 'project',
            title: 'Створити проєкт',
            icon: FolderPlus,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10 group-hover:bg-orange-500/20',
            border: 'border-orange-500/20',
            onClick: () => onOpenAddModal?.('project')
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-muted-foreground" />
                Швидкі Дії
            </h3>

            <div className="grid grid-cols-2 gap-3 flex-1">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group active:scale-95",
                                "hover:shadow-md bg-white dark:bg-card",
                                action.border
                            )}
                        >
                            <div className={cn("p-3 rounded-xl mb-3 transition-colors", action.bg, action.color)}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors text-center leading-tight">
                                {action.title}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
