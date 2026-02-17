'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Inbox, List, RefreshCw, Zap, Plus, Settings, Calendar, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useData } from '@/lib/store';
import { InboxView } from '@/components/actions/InboxView';
import { TasksView } from '@/components/actions/TasksView';
import { RoutinesView } from '@/components/actions/RoutinesView';
import { FocusView } from '@/components/actions/FocusView';
import { HabitsView } from '@/components/actions/HabitsView';
import { useRouter, useSearchParams } from 'next/navigation';


// Note: AddActionDialog might need updates, but for now we focus on the structure.

export default function ActionsPage() {
    const { state } = useData();
    const activeArea = state.areas.find(a => a.id === state.selectedAreaId);
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'tasks';

    const handleTabChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', val);
        router.push(`/actions?${params.toString()}`);
    };
    const [taskFilter, setTaskFilter] = useState<'current' | 'active' | 'completed' | 'deferred'>('current');

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
                        {activeArea ? (
                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium border border-transparent", activeArea.color.replace('bg-', 'bg-').replace('500', '100'), activeArea.color.replace('bg-', 'text-').replace('500', '700'))}>
                                <Layers className="w-3.5 h-3.5" />
                                <span>{activeArea.title}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 dark:bg-secondary/50 text-slate-600 dark:text-muted-foreground text-sm font-medium border border-slate-200/50 dark:border-border">
                                <Layers className="w-3.5 h-3.5" />
                                <span>Всі Сфери</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Global Quick Add is handled by Cmd+K basically, but we can have local add */}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col space-y-6">
                <div className="flex flex-col sticky top-0 z-20 bg-slate-50/95 dark:bg-background/95 backdrop-blur-sm -mx-4 px-4 md:-mx-8 md:px-8 border-b border-slate-200/50 dark:border-border">
                    <div className="flex justify-between items-center py-4">
                        <TabsList id="tasks-tabs" className="bg-white dark:bg-card p-1.5 gap-2 shadow-sm border border-slate-200 dark:border-border rounded-2xl h-auto overflow-x-auto justify-start w-full md:w-auto no-scrollbar">
                            <TabsTrigger value="inbox" className="gap-2 px-5 py-2.5 text-base font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-orange-500/20">
                                <Inbox className="h-4 w-4" /> Вхідні
                                <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                    {inboxCount}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="tasks" className="gap-2 px-5 py-2.5 text-base font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-orange-500/20">
                                <List className="h-4 w-4" /> Завдання
                                <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                    {activeTasksCount}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="routines" className="gap-2 px-5 py-2.5 text-base font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-orange-500/20">
                                <RefreshCw className="h-4 w-4" /> Рутина
                                <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                    {routinesCount}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="habits" className="gap-2 px-5 py-2.5 text-base font-medium data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-orange-500/20">
                                <Zap className="h-4 w-4" /> Звички
                                <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                    {activeHabitsCount}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="focus" className="gap-2 px-5 py-2.5 text-base font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:text-muted-foreground dark:data-[state=active]:text-primary-foreground rounded-xl transition-all data-[state=active]:shadow-md shadow-slate-900/20">
                                <Zap className="h-4 w-4" /> Фокус
                                <span className="bg-white/20 text-current text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                    {focusCount}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Secondary Navigation (Sub-tabs) for Tasks */}
                    {activeTab === 'tasks' && (
                        <div className="flex pb-4 gap-4 overflow-x-auto no-scrollbar md:pl-12">
                            {[
                                { id: 'current', label: 'Поточні' },
                                { id: 'active', label: 'Активні' },
                                { id: 'completed', label: 'Виконані' },
                                { id: 'deferred', label: 'Відкладені' },
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
                    )}
                </div>

                <TabsContent value="inbox" className="flex-1 min-h-0 pt-4">
                    <InboxView />
                </TabsContent>

                <TabsContent value="tasks" className="flex-1 min-h-0 pt-4">
                    <TasksView filter={taskFilter} />
                </TabsContent>

                <TabsContent value="routines" className="flex-1 min-h-0 pt-4">
                    <RoutinesView />
                </TabsContent>

                <TabsContent value="habits" className="flex-1 min-h-0 pt-4">
                    <HabitsView />
                </TabsContent>

                <TabsContent value="focus" className="flex-1 min-h-0 pt-4">
                    <FocusView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
