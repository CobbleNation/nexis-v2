'use client';

import { useData } from '@/lib/store';
import Link from 'next/link';
import { Plus, Folder, MoreHorizontal, Calendar, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { QuickAddModal } from '@/components/features/QuickAddModal';
import { ProjectActionsMenu } from '@/components/projects/ProjectActionsMenu';

function ProjectsContent() {
    const { state } = useData();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'active';

    const projects = state.projects || [];

    const activeProjects = projects.filter(p => !p.status || p.status === 'active');
    const plannedProjects = projects.filter(p => p.status === 'planned');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const deferredProjects = projects.filter(p => p.status === 'deferred');

    // Helper to render project list
    const ProjectList = ({ items }: { items: any[] }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((project: any) => {
                const tasksCount = state.actions.filter(a => a.projectId === project.id && !a.completed).length;

                return (
                    <Link href={`/projects/${project.id}`} key={project.id} className="group">
                        <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner",
                                    "bg-primary/5 text-primary"
                                )}>
                                    {project.icon || <Folder className="w-6 h-6" />}
                                </div>
                                <div className="z-20">
                                    <ProjectActionsMenu project={project} />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 relative z-10">
                                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                    {project.title || "Untitled Project"}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                    {project.description || "No description provided."}
                                </p>

                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md w-fit mb-3">
                                    <Layers className="w-3.5 h-3.5" />
                                    {tasksCount} tasks
                                </div>

                                {/* Progress Section or Empty State */}
                                {(() => {
                                    const totalTasks = state.actions.filter(a => a.projectId === project.id).length;
                                    const totalMetrics = (project.metricIds || []).length;
                                    const hasItems = totalTasks > 0 || totalMetrics > 0;

                                    if (!hasItems) {
                                        return (
                                            <div className="mb-4 py-2 px-3 bg-slate-100 dark:bg-secondary/30 rounded-lg border border-dashed border-slate-300 dark:border-border text-center">
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    Порожньо. Додайте задачі або метрики.
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-muted-foreground">Прогрес</span>
                                                <span className="text-primary">{(project.progress || 0)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                                    style={{ width: `${project.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-border/40 relative z-10 mt-auto">
                                <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString('uk-UA') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                )
            })}

            {/* Add New Card (Only shown in Active tab usually, or always) */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="group h-full min-h-[250px] border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
                <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">Створити Проєкт</span>
            </button>
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Проєкти</h2>
                    <p className="text-muted-foreground mt-1">Керуйте всіма вашими проєктами в одному місці.</p>
                </div>

            </div>

            <Tabs value={currentTab} onValueChange={(val) => router.push(`/projects?tab=${val}`)} className="space-y-6">
                <TabsList className="bg-transparent p-0 gap-6 overflow-x-auto scrollbar-hide w-full justify-start">
                    <TabsTrigger value="active" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Активні
                        <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {activeProjects.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="planned" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Заплановані
                        <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {plannedProjects.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Виконані
                        <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {completedProjects.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="deferred" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                        Відкладені
                        <span className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {deferredProjects.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    {activeProjects.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Немає активних проектів.
                        </div>
                    ) : <ProjectList items={activeProjects} />}
                </TabsContent>

                <TabsContent value="planned" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {plannedProjects.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Немає запланованих проектів.
                        </div>
                    ) : <ProjectList items={plannedProjects} />}
                </TabsContent>

                <TabsContent value="completed" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {completedProjects.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Немає виконаних проектів.
                        </div>
                    ) : <ProjectList items={completedProjects} />}
                </TabsContent>

                <TabsContent value="deferred" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    {deferredProjects.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                            Немає відкладених проектів.
                        </div>
                    ) : <ProjectList items={deferredProjects} />}
                </TabsContent>
            </Tabs>
            <QuickAddModal open={showCreateModal} onOpenChange={setShowCreateModal} defaultTab="project" />
        </div>
    );
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Завантаження проектів...</div>}>
            <ProjectsContent />
        </Suspense>
    );
}
