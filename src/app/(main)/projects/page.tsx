'use client';

import { useData } from '@/lib/store';
import Link from 'next/link';
import { Plus, Folder, Calendar, Clock, Layers, Search, SlidersHorizontal, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useMemo } from 'react';
import { QuickAddModal } from '@/components/features/QuickAddModal';
import { ProjectActionsMenu } from '@/components/projects/ProjectActionsMenu';
import { motion, AnimatePresence } from 'framer-motion';

type SortOption = 'created_desc' | 'created_asc' | 'progress_desc' | 'progress_asc' | 'tasks_desc' | 'title';

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-slate-100 dark:bg-secondary text-slate-600 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-secondary/80'
            )}
        >
            {label}
        </button>
    );
}

function ProjectsContent() {
    const { state } = useData();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'active';

    // Filter state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('created_desc');
    const [hasTasksFilter, setHasTasksFilter] = useState(false);
    const [hasDeadlineFilter, setHasDeadlineFilter] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const projects = state.projects || [];
    const activeProjects = projects.filter(p => !p.status || p.status === 'active');
    const plannedProjects = projects.filter(p => p.status === 'planned');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const deferredProjects = projects.filter(p => p.status === 'deferred');

    const applyFilters = (items: any[]) => {
        let result = items;

        if (search.trim()) {
            const s = search.toLowerCase();
            result = result.filter(p =>
                (p.title || '').toLowerCase().includes(s) ||
                (p.description || '').toLowerCase().includes(s)
            );
        }

        if (hasTasksFilter) {
            result = result.filter(p => state.actions.some(a => a.projectId === p.id && !a.completed));
        }

        if (hasDeadlineFilter) {
            result = result.filter(p => !!p.deadline);
        }

        result = [...result].sort((a, b) => {
            const aTasks = state.actions.filter(x => x.projectId === a.id && !x.completed).length;
            const bTasks = state.actions.filter(x => x.projectId === b.id && !x.completed).length;
            if (sortBy === 'created_desc') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            if (sortBy === 'created_asc') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            if (sortBy === 'progress_desc') return (b.progress || 0) - (a.progress || 0);
            if (sortBy === 'progress_asc') return (a.progress || 0) - (b.progress || 0);
            if (sortBy === 'tasks_desc') return bTasks - aTasks;
            if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '', 'uk');
            return 0;
        });

        return result;
    };

    const activeFiltersCount = [hasTasksFilter, hasDeadlineFilter].filter(Boolean).length + (search ? 1 : 0);

    const clearFilters = () => {
        setSearch('');
        setHasTasksFilter(false);
        setHasDeadlineFilter(false);
        setSortBy('created_desc');
    };

    // Helper to render project list
    const ProjectList = ({ items }: { items: any[] }) => {
        const filtered = applyFilters(items);
        if (filtered.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                    <Folder className="h-10 w-10 text-slate-300 dark:text-muted-foreground mb-3" />
                    <p className="font-bold text-foreground">
                        {items.length === 0 ? 'Немає проектів' : 'Нічого не знайдено'}
                    </p>
                    {activeFiltersCount > 0 && items.length > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                            <X className="h-3.5 w-3.5 mr-1.5" /> Скинути фільтри
                        </Button>
                    )}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((project: any) => {
                    const tasksCount = state.actions.filter(a => a.projectId === project.id && !a.completed).length;

                    return (
                        <div 
                            key={project.id} 
                            onClick={() => router.push(`/projects/${project.id}`)}
                            className="group cursor-pointer"
                        >
                            <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner",
                                        "bg-primary/5 text-primary"
                                    )}>
                                        {project.icon || <Folder className="w-6 h-6" />}
                                    </div>
                                    <div className="z-20" onClick={(e) => e.stopPropagation()}>
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
                                        {tasksCount} завдань
                                    </div>

                                    {/* Deadline badge */}
                                    {project.deadline && (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md w-fit mb-3">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(project.deadline).toLocaleDateString('uk-UA')}
                                        </div>
                                    )}

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
                        </div>
                    );
                })}

                {/* Add New Card */}
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
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Проєкти</h2>
                    <p className="text-muted-foreground mt-1">Керуйте всіма вашими проєктами в одному місці.</p>
                </div>
            </div>

            {/* Search + Filter bar */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Пошук проектів..."
                            className="pl-9 h-9 rounded-xl bg-white dark:bg-card border-slate-200 dark:border-border text-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <Button
                        variant={showFilters ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowFilters(v => !v)}
                        className={cn('gap-1.5 rounded-xl shrink-0 h-9', showFilters && 'bg-primary text-primary-foreground')}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Фільтри
                        {activeFiltersCount > 0 && (
                            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                    {activeFiltersCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground h-9 px-2">
                            <X className="h-3.5 w-3.5 mr-1" /> Скинути
                        </Button>
                    )}
                </div>

                {/* Expanded Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white dark:bg-card border border-slate-100 dark:border-border rounded-2xl p-4 space-y-4">
                                {/* Quick toggles */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Швидкі фільтри</p>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip
                                            label="Є завдання"
                                            active={hasTasksFilter}
                                            onClick={() => setHasTasksFilter(v => !v)}
                                        />
                                        <FilterChip
                                            label="Є дедлайн"
                                            active={hasDeadlineFilter}
                                            onClick={() => setHasDeadlineFilter(v => !v)}
                                        />
                                    </div>
                                </div>

                                {/* Sort */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Сортування</p>
                                    <div className="flex flex-wrap gap-2">
                                        {([
                                            ['created_desc', 'Нові спочатку'],
                                            ['created_asc', 'Старі спочатку'],
                                            ['progress_desc', 'Прогрес ↓'],
                                            ['progress_asc', 'Прогрес ↑'],
                                            ['tasks_desc', 'Більше завдань'],
                                            ['title', 'Назва А-Я'],
                                        ] as [SortOption, string][]).map(([val, label]) => (
                                            <FilterChip key={val} label={label} active={sortBy === val} onClick={() => setSortBy(val)} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Tabs value={currentTab} onValueChange={(val) => router.push(`/projects?tab=${val}`)} className="space-y-6">
                <div className="overflow-x-auto no-scrollbar w-[calc(100%+1.5rem)] -mx-4 px-4 sm:w-full sm:mx-0 sm:px-0">
                    <TabsList className="bg-transparent p-0 gap-6 w-max justify-start pr-8 sm:pr-0">
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
                </div>

                <TabsContent value="active" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <ProjectList items={activeProjects} />
                </TabsContent>
                <TabsContent value="planned" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <ProjectList items={plannedProjects} />
                </TabsContent>
                <TabsContent value="completed" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <ProjectList items={completedProjects} />
                </TabsContent>
                <TabsContent value="deferred" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <ProjectList items={deferredProjects} />
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
