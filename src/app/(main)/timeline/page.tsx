'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/lib/store';
import { addDays, addMonths, addWeeks, addYears, format, subDays, subMonths, subWeeks, subYears } from 'date-fns';
import { uk } from 'date-fns/locale';
import { getScheduleItems } from '@/lib/schedule-utils';
import { DayView } from '@/components/timeline/DayView';
import { WeekView } from '@/components/timeline/WeekView';
import { MonthView } from '@/components/timeline/MonthView';
import { YearView } from '@/components/timeline/YearView';
import { ItemEditDialog } from '@/components/shared/ItemEditDialog';
import { TimelineLockState } from '@/components/timeline/TimelineLockState';
import { useSubscription } from '@/hooks/useSubscription';
import { LIMITS, SUBSCRIPTION_PLAN } from '@/lib/limits';
import { toast } from 'sonner';
// ... other imports
import { QuickAddModal } from '@/components/features/QuickAddModal';

type ViewMode = 'day' | 'week' | 'month' | 'year';

export default function TimelinePage() {
    const { state, dispatch } = useData();
    const { isPro, tier } = useSubscription();
    const [viewModeLocal, setViewModeLocal] = useState<ViewMode>((state.period as ViewMode) || 'day');
    const currentViewMode = viewModeLocal;

    const [currentDate, setCurrentDate] = useState(new Date());

    // Navigation
    const navigate = (direction: 'prev' | 'next') => {
        if (currentViewMode === 'day') setCurrentDate(d => direction === 'next' ? addDays(d, 1) : subDays(d, 1));
        if (currentViewMode === 'week') setCurrentDate(d => direction === 'next' ? addWeeks(d, 1) : subWeeks(d, 1));
        if (currentViewMode === 'month') setCurrentDate(d => direction === 'next' ? addMonths(d, 1) : subMonths(d, 1));
        if (currentViewMode === 'year') setCurrentDate(d => direction === 'next' ? addYears(d, 1) : subYears(d, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    // Data
    const scheduleItems = useMemo(() => {
        return getScheduleItems({ ...state, metrics: state.metricDefinitions }, new Date(currentDate.getFullYear() - 1, 0, 1), new Date(currentDate.getFullYear() + 2, 0, 1), currentViewMode);
    }, [state, currentDate, currentViewMode]);

    // Format Title
    const getTitle = () => {
        if (currentViewMode === 'day') return format(currentDate, 'd MMMM yyyy', { locale: uk });
        if (currentViewMode === 'week') return `Тиждень ${format(currentDate, 'w, yyyy', { locale: uk })}`;
        if (currentViewMode === 'month') return format(currentDate, 'LLLL yyyy', { locale: uk });
        if (currentViewMode === 'year') return format(currentDate, 'yyyy');
    };

    // Edit Dialog
    const [editTarget, setEditTarget] = useState<{ id: string; type: any } | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Quick Add
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddData, setQuickAddData] = useState<{ date: string, time: string } | undefined>();

    // --- Callbacks ---
    const handleEditItem = useCallback((id: string, type: string) => {
        let actualType = type;
        if (type === 'deadline') {
            const isGoal = state.goals.some(g => g.id === id);
            actualType = isGoal ? 'goal' : 'project';
        }
        setEditTarget({ id, type: actualType as any });
        setIsEditDialogOpen(true);
    }, [state.goals]);

    const handleCompleteItem = useCallback((id: string, type: string) => {
        if (type === 'task') {
            const action = state.actions.find(a => a.id === id);
            if (action) {
                dispatch({
                    type: 'UPDATE_ACTION',
                    payload: { ...action, completed: true, status: 'completed' as const }
                });
                toast.success('Завдання виконано ✅');
            }
        }
    }, [state.actions, dispatch]);

    const handleDeleteItem = useCallback((id: string, type: string) => {
        if (type === 'task') dispatch({ type: 'DELETE_ACTION', payload: { id } });
        else if (type === 'event') dispatch({ type: 'DELETE_EVENT', payload: { id } });
        else if (type === 'routine') dispatch({ type: 'DELETE_ROUTINE', payload: { id } });
        toast.success('Видалено');
    }, [dispatch]);

    const handleDayClick = useCallback((day: Date) => {
        setCurrentDate(day);
        setViewModeLocal('day');
    }, []);

    const handleLegacyToggle = useCallback((id: string) => {
        const item = scheduleItems.find(i => i.entityId === id);
        if (item) handleEditItem(id, item.type);
    }, [scheduleItems, handleEditItem]);

    const handleTimeSelect = useCallback((date: Date, time: string) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        setQuickAddData({ date: dateStr, time });
        setIsQuickAddOpen(true);
    }, []);

    return (
        <div id="schedule-container" className="space-y-4 animate-in fade-in duration-500 h-[calc(100vh-theme(spacing.8))] flex flex-col">
            <div id="schedule-top-bar" className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Розклад</h2>
                    <p className="text-muted-foreground text-sm">
                        {currentViewMode === 'day' && 'План на день'}
                        {currentViewMode === 'week' && 'Навантаження тижня'}
                        {currentViewMode === 'month' && 'Масштаб місяця'}
                        {currentViewMode === 'year' && 'Стратегія року'}
                    </p>
                </div>

                <div className="bg-muted/50 p-1 rounded-xl flex items-center gap-1">
                    {(['day', 'week', 'month', 'year'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewModeLocal(mode)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                currentViewMode === mode
                                    ? "bg-white dark:bg-card text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            {mode === 'day' && 'День'}
                            {mode === 'week' && 'Тиждень'}
                            {mode === 'month' && 'Місяць'}
                            {mode === 'year' && 'Рік'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between bg-card p-2 rounded-2xl border border-border shrink-0 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => navigate('prev')} className="h-8 w-8 hover:bg-secondary">
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg min-w-[150px] text-center capitalize text-foreground">
                        {getTitle()}
                    </span>
                    <Button variant="outline" size="sm" onClick={goToToday} className="h-7 text-xs px-2 border-border hover:bg-secondary">
                        Сьогодні
                    </Button>
                </div>

                <Button variant="ghost" size="icon" onClick={() => navigate('next')} className="h-8 w-8 hover:bg-secondary">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentViewMode + currentDate.toISOString()}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {currentViewMode === 'day' && (
                            <DayView
                                date={currentDate}
                                items={scheduleItems}
                                onToggleItem={handleLegacyToggle}
                                onEditItem={handleEditItem}
                                onCompleteItem={handleCompleteItem}
                                onDeleteItem={handleDeleteItem}
                                onTimeSelect={handleTimeSelect}
                            />
                        )}

                        {currentViewMode === 'week' && (
                            tier === SUBSCRIPTION_PLAN.FREE && !LIMITS[SUBSCRIPTION_PLAN.FREE].HAS_WEEKLY_VIEW ? (
                                <TimelineLockState view="week" />
                            ) : (
                                <WeekView
                                    date={currentDate}
                                    items={scheduleItems}
                                    onToggleItem={handleLegacyToggle}
                                    onEditItem={handleEditItem}
                                    onCompleteItem={handleCompleteItem}
                                    onDeleteItem={handleDeleteItem}
                                    onDayClick={handleDayClick}
                                    onTimeSelect={handleTimeSelect}
                                />
                            )
                        )}

                        {currentViewMode === 'month' && (
                            tier === SUBSCRIPTION_PLAN.FREE && !LIMITS[SUBSCRIPTION_PLAN.FREE].HAS_MONTHLY_VIEW ? (
                                <TimelineLockState view="month" />
                            ) : (
                                <MonthView
                                    date={currentDate}
                                    items={scheduleItems}
                                    onToggleItem={handleLegacyToggle}
                                    onEditItem={handleEditItem}
                                    onCompleteItem={handleCompleteItem}
                                    onDeleteItem={handleDeleteItem}
                                />
                            )
                        )}

                        {currentViewMode === 'year' && (
                            <YearView
                                date={currentDate}
                                items={scheduleItems}
                                onEditItem={handleEditItem}
                                onCompleteItem={handleCompleteItem}
                                onDeleteItem={handleDeleteItem}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <ItemEditDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                itemId={editTarget?.id || null}
                type={editTarget?.type || null}
            />

            <QuickAddModal
                open={isQuickAddOpen}
                onOpenChange={setIsQuickAddOpen}
                initialData={quickAddData}
            />
        </div>
    );
}
