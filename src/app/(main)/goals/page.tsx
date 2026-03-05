'use client';

import { useFilteredData, useData } from '@/lib/store';
import { Target, CheckCircle2, Circle, Clock, ArrowRight, TrendingUp, Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { QuickAddModal } from '@/components/features/QuickAddModal';
import { Goal } from '@/types';
import { useState, useMemo } from 'react';
import { formatGoalMetricDisplay } from '@/lib/goal-utils';
import { Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const HORIZON_LABELS: Record<string, string> = {
    week: 'Тиждень',
    month: 'Місяць',
    quarter: 'Квартал',
    year: 'Рік',
    custom: 'Свій',
};

const GOAL_TYPE_LABELS: Record<string, string> = {
    vision: 'Довгострокова',
    strategic: 'Стратегічна',
    tactical: 'Тактична',
};

const PRIORITY_LABELS: Record<string, string> = {
    high: 'Високий',
    medium: 'Середній',
    low: 'Низький',
};

type SortOption = 'deadline' | 'progress_desc' | 'progress_asc' | 'title' | 'created';

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

function GoalsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'active';

    const { filteredGoals, areas } = useFilteredData();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [search, setSearch] = useState('');
    const [areaFilter, setAreaFilter] = useState<string>('');
    const [horizonFilter, setHorizonFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOption>('deadline');

    // Bucket goals by status tab
    const goalsByTab = useMemo(() => {
        const active = filteredGoals.filter(g => g.status === 'active' || !g.status);
        const achieved = filteredGoals.filter(g => g.status === 'achieved' || g.status === 'completed');
        const partial = filteredGoals.filter(g => g.status === 'not_achieved');
        const paused = filteredGoals.filter(g => g.status === 'paused' || g.status === 'abandoned');
        return { active, achieved, partial, paused };
    }, [filteredGoals]);

    // Apply local filters + sort
    const applyFilters = (goals: Goal[]) => {
        let result = goals;

        if (search.trim()) {
            const s = search.toLowerCase();
            result = result.filter(g =>
                g.title.toLowerCase().includes(s) ||
                (g.description || '').toLowerCase().includes(s)
            );
        }
        if (areaFilter) result = result.filter(g => g.areaId === areaFilter);
        if (horizonFilter) result = result.filter(g => g.horizon === horizonFilter);
        if (typeFilter) result = result.filter(g => g.type === typeFilter);
        if (priorityFilter) result = result.filter(g => g.priority === priorityFilter);

        result = [...result].sort((a, b) => {
            if (sortBy === 'deadline') {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            }
            if (sortBy === 'progress_desc') return (b.progress || 0) - (a.progress || 0);
            if (sortBy === 'progress_asc') return (a.progress || 0) - (b.progress || 0);
            if (sortBy === 'title') return a.title.localeCompare(b.title, 'uk');
            if (sortBy === 'created') {
                return new Date(b.createdAt as string || 0).getTime() - new Date(a.createdAt as string || 0).getTime();
            }
            return 0;
        });

        return result;
    };

    const activeCount = goalsByTab.active.length;
    const achievedCount = goalsByTab.achieved.length;
    const partialCount = goalsByTab.partial.length;
    const pausedCount = goalsByTab.paused.length;

    const openDetails = (goal: Goal) => router.push(`/goals/${goal.id}`);

    const activeFiltersCount = [areaFilter, horizonFilter, typeFilter, priorityFilter].filter(Boolean).length + (search ? 1 : 0);

    const clearFilters = () => {
        setSearch('');
        setAreaFilter('');
        setHorizonFilter('');
        setTypeFilter('');
        setPriorityFilter('');
        setSortBy('deadline');
    };

    return (
        <div id="goals-container" className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-foreground">Цілі та Проекти</h1>
                    <p className="text-muted-foreground">Перетворюйте бачення на реальність.</p>
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
                            placeholder="Пошук цілей..."
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
                                {/* Area filter */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Сфера</p>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip label="Всі" active={!areaFilter} onClick={() => setAreaFilter('')} />
                                        {areas.map(area => (
                                            <FilterChip
                                                key={area.id}
                                                label={area.title}
                                                active={areaFilter === area.id}
                                                onClick={() => setAreaFilter(areaFilter === area.id ? '' : area.id)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Horizon */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Горизонт</p>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip label="Всі" active={!horizonFilter} onClick={() => setHorizonFilter('')} />
                                        {Object.entries(HORIZON_LABELS).map(([val, label]) => (
                                            <FilterChip
                                                key={val}
                                                label={label}
                                                active={horizonFilter === val}
                                                onClick={() => setHorizonFilter(horizonFilter === val ? '' : val)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Type */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Тип</p>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip label="Всі" active={!typeFilter} onClick={() => setTypeFilter('')} />
                                        {Object.entries(GOAL_TYPE_LABELS).map(([val, label]) => (
                                            <FilterChip
                                                key={val}
                                                label={label}
                                                active={typeFilter === val}
                                                onClick={() => setTypeFilter(typeFilter === val ? '' : val)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Пріоритет</p>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip label="Всі" active={!priorityFilter} onClick={() => setPriorityFilter('')} />
                                        {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                                            <FilterChip
                                                key={val}
                                                label={label}
                                                active={priorityFilter === val}
                                                onClick={() => setPriorityFilter(priorityFilter === val ? '' : val)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Sort */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Сортування</p>
                                    <div className="flex flex-wrap gap-2">
                                        {([
                                            ['deadline', 'Дедлайн'],
                                            ['progress_desc', 'Прогрес ↓'],
                                            ['progress_asc', 'Прогрес ↑'],
                                            ['title', 'Назва А-Я'],
                                            ['created', 'Нові спочатку'],
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

            <Tabs value={currentTab} onValueChange={(val) => router.push(`/goals?tab=${val}`)} className="space-y-6">
                <div className="overflow-x-auto no-scrollbar w-[calc(100%+1.5rem)] -mx-4 px-4 sm:w-full sm:mx-0 sm:px-0">
                    <TabsList id="goals-list" className="bg-transparent p-0 gap-6 w-max justify-start pr-8 sm:pr-0">
                        <TabsTrigger value="active" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                            Активні
                            <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {activeCount}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="achieved" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                            Досягнуті
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {achievedCount}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="partial" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                            Не повністю
                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {partialCount}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="paused" className="gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary dark:data-[state=active]:border-primary rounded-none px-2 pb-3 transition-all text-muted-foreground hover:text-foreground">
                            Зупинені
                            <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {pausedCount}
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {(['active', 'achieved', 'partial', 'paused'] as const).map(tab => {
                    const source = tab === 'active' ? goalsByTab.active : tab === 'achieved' ? goalsByTab.achieved : tab === 'partial' ? goalsByTab.partial : goalsByTab.paused;
                    const filtered = applyFilters(source);
                    return (
                        <TabsContent key={tab} value={tab} className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20">
                                    <div className="h-16 w-16 bg-white dark:bg-card rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                        <Target className="h-8 w-8 text-slate-300 dark:text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        {source.length === 0 ? 'Немає цілей' : 'Нічого не знайдено'}
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mt-2 mb-6 text-sm">
                                        {source.length === 0
                                            ? 'Натисніть (+), щоб створити першу ціль.'
                                            : 'Спробуйте змінити або скинути фільтри.'}
                                    </p>
                                    {activeFiltersCount > 0 && (
                                        <Button variant="outline" size="sm" onClick={clearFilters}>
                                            <X className="h-3.5 w-3.5 mr-1.5" /> Скинути фільтри
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <GoalsList goals={filtered} areas={areas} openDetails={openDetails} onCreate={tab === 'active' ? () => setShowCreateModal(true) : undefined} />
                            )}
                        </TabsContent>
                    );
                })}
            </Tabs>

            <QuickAddModal open={showCreateModal} onOpenChange={setShowCreateModal} defaultTab="goal" />
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
                        transition={{ delay: index * 0.05 }}
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
                                    {area && <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", !area.color?.startsWith('#') && !area.color?.startsWith('rgb') && area.color)} style={(area.color?.startsWith('#') || area.color?.startsWith('rgb')) ? { backgroundColor: area.color } : undefined} />}
                                    <span>{area?.title || 'Загальне'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {goal.horizon && (
                                        <span className="text-[10px] font-bold text-muted-foreground bg-slate-50 dark:bg-secondary/50 px-2 py-0.5 rounded-full">
                                            {HORIZON_LABELS[goal.horizon] || goal.horizon}
                                        </span>
                                    )}
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                        isSuccess ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-slate-50 text-slate-400 dark:bg-slate-800"
                                    )}>
                                        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 dark:text-foreground mb-3 line-clamp-2 leading-tight">
                                {goal.title}
                            </h3>

                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-muted-foreground mb-6">
                                {goal.targetMetricId ? (
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-secondary/50 px-2 py-1 rounded-md">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>{formatGoalMetricDisplay(goal).current} / {formatGoalMetricDisplay(goal).target}</span>
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
