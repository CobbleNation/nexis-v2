'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Inbox, List, RefreshCw, Zap, Plus, Settings, Calendar, Layers, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, Suspense } from 'react';
import { useData } from '@/lib/store';
import { InboxView } from '@/components/actions/InboxView';
import { TasksView } from '@/components/actions/TasksView';
import { RoutinesView } from '@/components/actions/RoutinesView';
import { FocusView } from '@/components/actions/FocusView';
import { HabitsView } from '@/components/actions/HabitsView';
import { useRouter, useSearchParams } from 'next/navigation';

function ActionsPageContent() {
    const { state } = useData();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'tasks';

    const handleTabChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', val);
        router.push(`/actions?${params.toString()}`);
    };
    const [taskFilter, setTaskFilter] = useState<'current' | 'active' | 'completed' | 'deferred' | 'incomplete'>('current');

    // Counters
    const inboxCount = state.actions.filter(a => a.type === 'task' && !a.completed && !a.date).length;
    const activeTasksCount = state.actions.filter(a => a.type === 'task' && !a.completed).length;
    const activeHabitsCount = state.habits.filter(h => h.status === 'active').length;
    const routinesCount = state.routines.length;
    const focusCount = state.actions.filter(a => a.isFocus && !a.completed).length;

    return (
        <div id="tasks-container" className="h-full flex flex-col space-y-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">Система Дій</h2>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 dark:bg-secondary/50 text-slate-600 dark:text-muted-foreground text-sm font-medium border border-slate-200/50 dark:border-border">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                                {state.period === 'day' && 'Сьогодні'}
                                {state.period === 'week' && 'Цей Тиждень'}
                                {state.period === 'month' && 'Цей Місяць'}
                                {state.period === 'year' && 'Цей Рік'}
                            </span>
                        </div>
                        <div className="bg-slate-200 dark:bg-border h-4 w-[1px]" />
                        <span className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>

            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col space-y-6">
                <div className="flex flex-col sticky top-0 z-20 bg-slate-50/95 dark:bg-background/95 backdrop-blur-sm -mx-4 px-4 md:-mx-8 md:px-8 border-b border-slate-200/50 dark:border-border">
                    <div className="flex justify-between items-center py-4 w-full">
                        <div className="overflow-x-auto no-scrollbar w-full px-4 -mx-4 md:px-0 md:mx-0">
                            <TabsList id="tasks-tabs" className="bg-white dark:bg-card p-1.5 gap-2 shadow-sm border border-slate-200 dark:border-border rounded-2xl h-auto justify-start w-max md:w-auto flex-nowrap pr-8 md:pr-1.5">
                                <TabsTrigger value="inbox" className="shrink-0 gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-primary/20 whitespace-nowrap">
                                    <Inbox className="h-4 w-4" /> <span className="hidden sm:inline">Вхідні</span>
                                    <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {inboxCount}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="tasks" className="shrink-0 gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-primary/20 whitespace-nowrap">
                                    <List className="h-4 w-4" /> <span className="hidden sm:inline">Завдання</span>
                                    <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {activeTasksCount}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="routines" className="shrink-0 gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-primary/20 whitespace-nowrap">
                                    <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Рутина</span>
                                    <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {routinesCount}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="habits" className="shrink-0 gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-primary/20 whitespace-nowrap">
                                    <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Звички</span>
                                    <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {activeHabitsCount}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="focus" className="shrink-0 gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-slate-900/20 whitespace-nowrap">
                                    <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Фокус</span>
                                    <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {focusCount}
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>

                    {/* Secondary Navigation (Sub-tabs) for Tasks */}
                    {activeTab === 'tasks' && (
                        <>
                            {/* Mobile Filter Sidebar */}
                            <div className="md:hidden px-4 pb-4">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full flex items-center gap-2 border-slate-200 dark:border-border text-slate-700 dark:text-foreground">
                                            <ListFilter className="w-4 h-4" />
                                            Фільтр: {
                                                [
                                                    { id: 'current', label: 'Поточні' },
                                                    { id: 'active', label: 'Активні' },
                                                    { id: 'completed', label: 'Виконані' },
                                                    { id: 'deferred', label: 'Відкладені' },
                                                    { id: 'incomplete', label: 'Не завершені' },
                                                ].find(t => t.id === taskFilter)?.label
                                            }
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[80vw] sm:w-[400px] p-0 border-r-indigo-100 dark:border-r-border flex flex-col">
                                        <SheetHeader className="p-6 pb-2 text-left border-b border-slate-100 dark:border-border">
                                            <SheetTitle className="flex items-center gap-2">
                                                <ListFilter className="w-5 h-5 text-indigo-500" />
                                                Фільтр Завдань
                                            </SheetTitle>
                                            <SheetDescription className="hidden">Виберіть список завдань</SheetDescription>
                                        </SheetHeader>
                                        <div className="flex flex-col py-4">
                                            {[
                                                { id: 'current', label: 'Поточні' },
                                                { id: 'active', label: 'Активні' },
                                                { id: 'completed', label: 'Виконані' },
                                                { id: 'deferred', label: 'Відкладені' },
                                                { id: 'incomplete', label: 'Не завершені' },
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setTaskFilter(tab.id as any)}
                                                    className={cn(
                                                        "text-left px-6 py-4 text-sm font-medium transition-colors border-l-4",
                                                        taskFilter === tab.id
                                                            ? "bg-indigo-50/50 dark:bg-primary/10 text-indigo-700 dark:text-primary border-indigo-500 dark:border-primary"
                                                            : "text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-secondary/50 border-transparent hover:text-slate-900 dark:hover:text-foreground"
                                                    )}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            {/* Desktop Filter Tabs */}
                            <div className="hidden md:flex pb-4 gap-4 overflow-x-auto no-scrollbar md:pl-12">
                                {[
                                    { id: 'current', label: 'Поточні' },
                                    { id: 'active', label: 'Активні' },
                                    { id: 'completed', label: 'Виконані' },
                                    { id: 'deferred', label: 'Відкладені' },
                                    { id: 'incomplete', label: 'Не завершені' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setTaskFilter(tab.id as any)}
                                        className={cn(
                                            "text-sm font-medium transition-all relative py-1",
                                            taskFilter === tab.id
                                                ? "text-orange-600 dark:text-primary"
                                                : "text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground"
                                        )}
                                    >
                                        {tab.label}
                                        {taskFilter === tab.id && (
                                            <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-orange-500 dark:bg-primary rounded-t-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <TabsContent value="inbox" className="h-full m-0 data-[state=active]:flex flex-col">
                        <InboxView />
                    </TabsContent>

                    <TabsContent value="tasks" className="h-full m-0 data-[state=active]:flex flex-col">
                        <TasksView filter={taskFilter} />
                    </TabsContent>

                    <TabsContent value="routines" className="h-full m-0 data-[state=active]:flex flex-col">
                        <RoutinesView />
                    </TabsContent>

                    <TabsContent value="habits" className="h-full m-0 data-[state=active]:flex flex-col">
                        <HabitsView />
                    </TabsContent>

                    <TabsContent value="focus" className="h-full m-0 data-[state=active]:flex flex-col">
                        <FocusView />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

export default function ActionsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
            <ActionsPageContent />
        </Suspense>
    );
}
