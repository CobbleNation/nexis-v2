'use client';

import { useFilteredData, useData } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle2, Circle, Clock, ArrowRight, Folder, ChevronRight, Plus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoalDetailsModal } from '@/components/goals/GoalDetailsModal';
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
                        <GoalsList goals={activeGoals} areas={areas} openDetails={openDetails} />
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
        </div>
    );
}

// Helper Component for List Rendering
const GoalsList = ({ goals, areas, openDetails }: { goals: Goal[], areas: any[], openDetails: (g: Goal) => void }) => {
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
                        onClick={() => openDetails(goal)}
                        className={cn(
                            "rounded-3xl p-8 shadow-sm border flex flex-col justify-between min-h-[340px] cursor-pointer transition-all duration-300 group hover:shadow-xl hover:-translate-y-1",
                            isSuccess ? "bg-emerald-50/20 border-emerald-100" :
                                isPartial ? "bg-amber-50/20 border-amber-100" :
                                    isAbandoned ? "bg-slate-50 border-slate-200 opacity-80" :
                                        "bg-white dark:bg-card border-transparent dark:border-border"
                        )}
                    >
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn(
                                    "p-3 rounded-2xl shadow-sm transition-colors duration-300",
                                    isSuccess ? "bg-emerald-100 text-emerald-600" :
                                        isPartial ? "bg-amber-100 text-amber-600" :
                                            "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white"
                                )}>
                                    <Target className="h-6 w-6" />
                                </div>
                                {area && (
                                    <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground")}>
                                        {area.title}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors leading-tight">{goal.title}</h3>

                            <div className="mb-8 mt-6">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
                                    <span>Прогрес</span>
                                    <span className="text-foreground">{goal.progress}%</span>
                                </div>
                                <Progress value={goal.progress} className="h-2 rounded-full bg-slate-100 dark:bg-secondary" indicatorClassName="bg-primary" />
                            </div>

                            <div className="space-y-2">
                                {goal.subGoals?.slice(0, 2).map((sg: { id: string; title: string; completed: boolean }) => (
                                    <div key={sg.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        {sg.completed ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                        )}
                                        <span className={cn("truncate", sg.completed && "line-through opacity-50")}>
                                            {sg.title}
                                        </span>
                                    </div>
                                ))}
                                {goal.subGoals && goal.subGoals.length > 2 && (
                                    <div className="text-xs text-muted-foreground pl-7">+ {goal.subGoals.length - 2} ще</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 flex items-center justify-between text-xs font-medium text-muted-foreground">
                            {goal.deadline && (
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-secondary/50 px-3 py-1.5 rounded-lg shrink-0">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                                    <span>{new Date(goal.deadline).toLocaleDateString("uk-UA", { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )}
                            <div className="ml-auto text-orange-600 dark:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-5 w-5" />
                            </div>
                        </div>
                    </motion.div>
                )
            })}
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
