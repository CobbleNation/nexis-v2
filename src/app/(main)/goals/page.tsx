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

    const activeGoals = filteredGoals.filter(g => g.status === 'active' || g.status === 'paused' || !g.status);
    const historyGoals = filteredGoals.filter(g => ['achieved', 'not_achieved', 'abandoned', 'completed'].includes(g.status));

    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // History Filter State
    const [historyFilter, setHistoryFilter] = useState<'all' | 'achieved' | 'not_achieved' | 'abandoned'>('all');

    const filteredHistoryGoals = historyGoals.filter(g => {
        if (historyFilter === 'all') return true;
        if (historyFilter === 'achieved') return g.status === 'achieved' || g.status === 'completed';
        return g.status === historyFilter;
    });

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
                <TabsList id="goals-list" className="bg-transparent p-0 gap-6">
                    <TabsTrigger value="goals" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-orange-600 dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground">
                        Активні Цілі
                        <span className="bg-slate-100 dark:bg-primary-foreground/20 text-slate-600 dark:text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {activeGoals.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-orange-600 dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground">
                        Проекти
                        <span className="bg-slate-100 dark:bg-primary-foreground/20 text-slate-600 dark:text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {filteredProjects.filter(p => p.status !== 'completed').length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-orange-600 dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground">Історія (Архів)</TabsTrigger>
                </TabsList>

                <TabsContent value="goals" className="space-y-8">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeGoals.map((goal, index) => {
                                const area = areas.find(a => a.id === goal.areaId);

                                return (
                                    <motion.div
                                        key={goal.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => openDetails(goal)}
                                        className="bg-white dark:bg-card rounded-3xl p-8 shadow-sm border border-transparent dark:border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between min-h-[340px] cursor-pointer"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-2xl text-orange-600 dark:text-orange-400 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
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
                    )}
                </TabsContent>

                <TabsContent value="projects">
                    {filteredProjects.filter(p => p.status !== 'completed').length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Немає активних проектів. Почніть зі створення цілі та розбийте її на проекти.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.filter(p => p.status !== 'completed').map((project, idx) => {
                                const area = areas.find(a => a.id === project.areaId);
                                const tasksCount = state.actions.filter(a => a.projectId === project.id && !a.completed).length;

                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                        className="bg-white dark:bg-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-border hover:shadow-lg hover:border-orange-100 dark:hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[220px]"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                    <Folder className="h-5 w-5 fill-current" />
                                                </div>
                                                {area && (
                                                    <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground">
                                                        {area.title}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-bold mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-2">{project.title}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">{project.description || "Без опису"}</p>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-border flex items-center justify-between text-xs">
                                            <div className="font-medium text-slate-600 dark:text-muted-foreground bg-slate-50 dark:bg-secondary/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                <Layers className="h-3.5 w-3.5 text-slate-400 dark:text-muted-foreground/70" />
                                                {tasksCount} завдань
                                            </div>

                                            {project.deadline && (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{new Date(project.deadline).toLocaleDateString("uk-UA", { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Tabs defaultValue="history-goals" className="space-y-6">
                        <TabsList className="bg-slate-100/50 dark:bg-secondary/50 p-1 rounded-xl inline-flex">
                            <TabsTrigger value="history-goals" className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-orange-600 dark:data-[state=active]:text-primary text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground">Цілі</TabsTrigger>
                            <TabsTrigger value="completed-projects" className="rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-orange-600 dark:data-[state=active]:text-primary text-slate-500 dark:text-muted-foreground hover:text-slate-700 dark:hover:text-foreground">Проекти</TabsTrigger>
                        </TabsList>

                        <TabsContent value="history-goals" className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
                            {/* Filter Pills */}
                            <div className="flex gap-2 pb-2 overflow-x-auto">
                                <button
                                    onClick={() => setHistoryFilter('all')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                        historyFilter === 'all'
                                            ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                                            : "bg-white dark:bg-card text-slate-500 border-slate-200 dark:border-border hover:border-slate-300"
                                    )}
                                >
                                    Всі
                                </button>
                                <button
                                    onClick={() => setHistoryFilter('achieved')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                        historyFilter === 'achieved'
                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            : "bg-white dark:bg-card text-slate-500 border-slate-200 dark:border-border hover:border-emerald-200 hover:text-emerald-600"
                                    )}
                                >
                                    Досягнуто
                                </button>
                                <button
                                    onClick={() => setHistoryFilter('not_achieved')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                        historyFilter === 'not_achieved'
                                            ? "bg-amber-100 text-amber-700 border-amber-200"
                                            : "bg-white dark:bg-card text-slate-500 border-slate-200 dark:border-border hover:border-amber-200 hover:text-amber-600"
                                    )}
                                >
                                    Не повністю
                                </button>
                                <button
                                    onClick={() => setHistoryFilter('abandoned')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                        historyFilter === 'abandoned'
                                            ? "bg-red-100 text-red-700 border-red-200"
                                            : "bg-white dark:bg-card text-slate-500 border-slate-200 dark:border-border hover:border-red-200 hover:text-red-600"
                                    )}
                                >
                                    Зупинено
                                </button>
                            </div>

                            {filteredHistoryGoals.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground bg-slate-50/50 dark:bg-card/20 rounded-2xl border-2 border-dashed border-slate-100 dark:border-border">
                                    Історія порожня.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredHistoryGoals.map((goal, index) => {
                                        const area = areas.find(a => a.id === goal.areaId);
                                        const isSuccess = goal.status === 'achieved' || goal.status === 'completed';
                                        const isPartial = goal.status === 'not_achieved';
                                        const isAbandoned = goal.status === 'abandoned';

                                        return (
                                            <div
                                                key={goal.id}
                                                onClick={() => openDetails(goal)}
                                                className={cn(
                                                    "rounded-3xl p-8 border shadow-sm flex flex-col justify-between min-h-[300px] cursor-pointer transition-all hover:shadow-md",
                                                    isSuccess ? "bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-900/20 hover:bg-emerald-50/80" :
                                                        isPartial ? "bg-amber-50/30 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-900/20 hover:bg-amber-50/80" :
                                                            "bg-slate-50/50 dark:bg-card/40 border-slate-200/60 dark:border-border grayscale hover:grayscale-0"
                                                )}>
                                                <div>
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className={cn(
                                                            "p-3 rounded-2xl",
                                                            isSuccess ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                                isPartial ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                                                    "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                                        )}>
                                                            {isSuccess ? <CheckCircle2 className="h-6 w-6" /> :
                                                                isPartial ? <Target className="h-6 w-6" /> :
                                                                    <Circle className="h-6 w-6" />}
                                                        </div>
                                                        {area && (
                                                            <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground">
                                                                {area.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className={cn("text-xl font-bold mb-2", isAbandoned && "line-through text-muted-foreground decoration-slate-300")}>{goal.title}</h3>
                                                    <div className="mb-6 mt-4">
                                                        <div className={cn("flex justify-between text-xs font-bold uppercase tracking-wider mb-2",
                                                            isSuccess ? "text-emerald-600" : isPartial ? "text-amber-600" : "text-slate-500"
                                                        )}>
                                                            <span>{isSuccess ? "Досягнуто" : isPartial ? "Неповний" : "Зупинено"}</span>
                                                            <span>{goal.progress}%</span>
                                                        </div>
                                                        <Progress value={goal.progress} className="h-2 rounded-full bg-slate-200 dark:bg-secondary"
                                                            indicatorClassName={cn(
                                                                isSuccess ? "bg-emerald-500" : isPartial ? "bg-amber-500" : "bg-slate-400"
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-xs font-medium text-slate-400 dark:text-muted-foreground/60 flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Завершено: {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : "Невідомо"}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="completed-projects" className="animate-in fade-in slide-in-from-right-4 duration-300">
                            {filteredProjects.filter(p => p.status === 'completed').length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground bg-slate-50/50 dark:bg-card/20 rounded-2xl border-2 border-dashed border-slate-100 dark:border-border">
                                    Ще немає завершених проектів.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProjects.filter(p => p.status === 'completed').map((project) => {
                                        const area = areas.find(a => a.id === project.areaId);
                                        return (
                                            <div
                                                key={project.id}
                                                onClick={() => router.push(`/projects/${project.id}`)}
                                                className="bg-slate-50 dark:bg-card/40 rounded-3xl p-6 border border-slate-200/60 dark:border-border opacity-75 hover:opacity-100 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px] grayscale-[0.3] hover:grayscale-0"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        </div>
                                                        {area && (
                                                            <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground">
                                                                {area.title}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-bold mb-1 text-slate-600 dark:text-muted-foreground line-through decoration-slate-300 dark:decoration-slate-700 group-hover:text-foreground transition-colors">{project.title}</h3>
                                                </div>

                                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-border flex items-center justify-between text-xs">
                                                    <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                                        Виконано
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-muted-foreground/60">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString("uk-UA") : '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
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

export default function GoalsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Завантаження цілей...</div>}>
            <GoalsContent />
        </Suspense>
    );
}
