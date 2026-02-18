'use client';

import { useFilteredData, useData } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle2, Circle, Clock, ArrowRight, Folder, ChevronRight, Plus, Layers, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoalDetailsModal } from '@/components/goals/GoalDetailsModal';
import { QuickAddModal } from '@/components/features/QuickAddModal';
import { Goal } from '@/types';
import { useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function GoalsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'goals';

    const { filteredGoals, filteredProjects, areas } = useFilteredData();
    const { state } = useData();

    const activeGoals = filteredGoals.filter(g => g.status === 'active' || !g.status);
    const achievedGoals = filteredGoals.filter(g => g.status === 'achieved' || g.status === 'completed');
    const partialGoals = filteredGoals.filter(g => g.status === 'not_achieved');
    const stoppedGoals = filteredGoals.filter(g => g.status === 'paused' || g.status === 'abandoned');

    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);



    const openDetails = (goal: Goal) => {
        setSelectedGoal(goal);
        setIsDetailsOpen(true);
    };

    return (
        <div id="goals-container" className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">Цілі та Проекти</h1>
                    <p className="text-muted-foreground">Перетворюйте бачення на реальність.</p>
                </div>
            </div>

            <Tabs value={currentTab} onValueChange={(val) => router.push(`/goals?tab=${val}`)} className="space-y-6">
                <TabsList id="goals-list" className="bg-transparent p-0 gap-6 overflow-x-auto scrollbar-hide w-full justify-start">
                    <TabsTrigger value="active" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Активні
                        <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {activeGoals.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="achieved" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Досягнуті
                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {achievedGoals.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="partial" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Не повністю
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {partialGoals.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="paused" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Зупинені
                        <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {stoppedGoals.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    {activeGoals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            <div className="h-16 w-16 bg-white dark:bg-card rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                <Target className="h-8 w-8 text-slate-300 dark:text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Немає Активних Цілей</h3>
                            <p className="text-muted-foreground max-w-md mt-2 mb-6">
                                Ви ще не встановили цілей. Визначте, як виглядає успіх.
                                <br />
                                <span className="text-xs mt-2 block">Натисніть (+), щоб створити першу ціль.</span>
                            </p>
                        </div>
                    ) : (
                        <GoalsList goals={activeGoals} areas={areas} openDetails={openDetails} onCreate={() => setShowCreateModal(true)} />
                    )}
                </TabsContent>

                <TabsContent value="achieved" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {achievedGoals.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Ще немає досягнутих цілей. Продовжуйте працювати!
                        </div>
                    ) : (
                        <GoalsList goals={achievedGoals} areas={areas} openDetails={openDetails} />
                    )}
                </TabsContent>

                <TabsContent value="partial" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {partialGoals.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Немає цілей, виконаних частково.
                        </div>
                    ) : (
                        <GoalsList goals={partialGoals} areas={areas} openDetails={openDetails} />
                    )}
                </TabsContent>

                <TabsContent value="paused" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {stoppedGoals.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Немає зупинених або архівних цілей.
                        </div>
                    ) : (
                        <GoalsList goals={stoppedGoals} areas={areas} openDetails={openDetails} />
                    )}
                </TabsContent>


            </Tabs>

            <GoalDetailsModal
                goal={selectedGoal}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
            />

            <QuickAddModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                defaultTab="goal"
            />
        </div>
    );
}

// Helper Component for List Rendering
const GoalsList = ({ goals, areas, openDetails, onCreate }: { goals: Goal[], areas: any[], openDetails: (g: Goal) => void, onCreate?: () => void }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => {
                const area = areas.find(a => a.id === goal.areaId);
                const isSuccess = goal.status === 'achieved' || goal.status === 'completed';
                const isPartial = goal.status === 'not_achieved';
                const isAbandoned = goal.status === 'abandoned' || goal.status === 'paused';

                return (
                    <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "rounded-[2rem] p-6 shadow-sm border flex flex-col justify-between min-h-[300px] cursor-pointer transition-all duration-300 group hover:shadow-md relative bg-white dark:bg-card",
                            "hover:border-primary/20",
                            isSuccess ? "bg-emerald-50/20 border-emerald-100 dark:border-emerald-900/20" :
                                isPartial ? "bg-amber-50/20 border-amber-100 dark:border-amber-900/20" :
                                    isAbandoned ? "bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800 opacity-80" :
                                        "bg-white dark:bg-card border-slate-100 dark:border-border"
                        )}
                        onClick={() => openDetails(goal)}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                                    isSuccess ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                        isPartial ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                            isAbandoned ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400" :
                                                "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    {area?.icon && <span>{area.icon}</span>}
                                    <span>{area?.name || 'General'}</span>
                                </div>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                    isSuccess ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-slate-50 text-slate-400 dark:bg-slate-800"
                                )}>
                                    {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 dark:text-foreground mb-3 line-clamp-2 leading-tight">
                                {goal.title}
                            </h3>

                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-muted-foreground mb-6">
                                {goal.targetMetricId ? (
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-secondary/50 px-2 py-1 rounded-md">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>{goal.metricCurrentValue ?? 0} / {goal.metricTargetValue ?? 100}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-secondary/50 px-2 py-1 rounded-md">
                                        <Target className="w-3.5 h-3.5" />
                                        <span>{goal.progress || 0}%</span>
                                    </div>
                                )}

                                {goal.deadline && (
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-secondary/50 px-2 py-1 rounded-md">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date(goal.deadline).toLocaleDateString('uk-UA')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full bg-slate-100 dark:bg-secondary h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500",
                                        isSuccess ? "bg-emerald-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${goal.progress || 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/50 flex items-center justify-between text-slate-400 dark:text-muted-foreground text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <span className="font-medium">Переглянути деталі</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                );
            })}

            {/* Dashed Create Card */}
            {onCreate && (
                <button
                    onClick={onCreate}
                    className="group min-h-[340px] border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                    <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">Створити Ціль</span>
                </button>
            )}
        </div>
    );
};

export default function GoalsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Завантаження цілей...</div>}>
            <GoalsContent />
        </Suspense>
    );
}
