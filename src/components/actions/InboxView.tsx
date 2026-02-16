'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { Action } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Inbox, ArrowRight, Trash2, Calendar, Target } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemEditDialog } from '@/components/shared/ItemEditDialog';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/common/UpgradeModal';

export function InboxView() {
    const { state, dispatch } = useData();
    const [inputValue, setInputValue] = useState('');
    const [editTarget, setEditTarget] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Inbox items: Tasks with NO date and NO area (and not from routine preferably, but mostly just undefined metadata)
    const inboxItems = state.actions.filter(a =>
        a.type === 'task' &&
        !a.date &&
        !a.areaId &&
        !a.completed &&
        a.status !== 'canceled'
    );

    const { canCreateTask } = useSubscription();
    const [showUpgrade, setShowUpgrade] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            if (!canCreateTask()) {
                setShowUpgrade(true);
                return;
            }

            const newItem: Action = {
                id: uuidv4(),
                userId: 'current',
                title: inputValue.trim(),
                type: 'task',
                status: 'pending',
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                // No area, no date = Inbox
            };
            dispatch({ type: 'ADD_ACTION', payload: newItem });
            setInputValue('');
            toast.success("Збережено у Вхідні");
        }
    };

    const processItem = (id: string, type: 'delete' | 'plan') => {
        if (type === 'delete') {
            dispatch({ type: 'DELETE_ACTION', payload: { id } });
            toast.info("Видалено");
        }
        // Planning (moving to Task) would usually involve opening a modal to set Date/Area.
        // For now we just log it or we could implement a quick "Move to Today" action
    };

    return (
        <div className="space-y-8 w-full h-full flex flex-col p-4 md:p-8">
            <div className="text-center space-y-2 py-4">
                <h2 className="text-3xl font-bold flex items-center justify-center gap-3 text-slate-800 dark:text-foreground">
                    <div className="bg-orange-100 dark:bg-primary/20 p-3 rounded-2xl text-orange-600 dark:text-primary">
                        <Inbox className="w-8 h-8" />
                    </div>
                    Вхідні
                </h2>
                <p className="text-muted-foreground text-sm">Звільніть голову. Запишіть усе, що турбує. Розберите пізніше.</p>
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-card p-2 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-border flex items-center gap-2 sticky top-0 z-10">
                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-secondary flex items-center justify-center text-slate-400 dark:text-muted-foreground">
                    <Plus className="w-5 h-5" />
                </div>
                <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Швидка думка чи завдання..."
                    className="border-none shadow-none text-lg font-medium bg-transparent focus-visible:ring-0 px-2 h-12 text-foreground placeholder:text-muted-foreground/50"
                    autoFocus
                />
                <Button size="sm" onClick={() => handleKeyDown({ key: 'Enter' } as any)} disabled={!inputValue.trim()} className="rounded-xl">
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 p-1">
                <AnimatePresence mode="popLayout">
                    {inboxItems.length > 0 ? inboxItems.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-border shadow-sm flex items-center justify-between group hover:border-slate-200 dark:hover:border-primary/50 transition-all cursor-pointer"
                            onClick={() => { setEditTarget(item.id); setIsEditOpen(true); }}
                        >
                            <span className="font-medium text-slate-700 dark:text-foreground">{item.title}</span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 dark:text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    onClick={(e) => { e.stopPropagation(); processItem(item.id, 'delete'); }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                {/* Schedule Button - Opens Dialog to set Date/Area */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-orange-600 dark:text-primary bg-orange-50 dark:bg-primary/20 hover:bg-orange-100 dark:hover:bg-primary/30 font-medium"
                                    onClick={(e) => { e.stopPropagation(); setEditTarget(item.id); setIsEditOpen(true); }}
                                >
                                    <Calendar className="w-3 h-3 mr-1" /> Запланувати
                                </Button>
                            </div>
                        </motion.div>
                    )) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4"
                        >
                            <div className="w-20 h-20 bg-slate-50 dark:bg-secondary/30 rounded-full flex items-center justify-center">
                                <Inbox className="w-10 h-10 opacity-20 dark:opacity-40" />
                            </div>
                            <p>Вхідні пусті. Чудова робота!</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ItemEditDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                itemId={editTarget}
                type="task" // Inbox items are strictly tasks
            />
            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title="Ліміт завдань досягнуто"
                description="У Free-версії доступно до 10 активних завдань. Перейдіть на Pro для безлімітного планування."
            />
        </div>
    );
}
