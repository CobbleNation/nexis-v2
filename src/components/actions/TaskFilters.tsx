'use client';

import { useData } from '@/lib/store';
import { Check, Folder, Calendar as CalendarIcon, ChevronDown, ChevronRight, X, SlidersHorizontal, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useState } from 'react';

interface TaskFiltersProps {
    selectedAreas: string[];
    setSelectedAreas: (areas: string[]) => void;
    selectedProjects: string[];
    setSelectedProjects: (projects: string[]) => void;
    selectedDates: Date[];
    setSelectedDates: (dates: Date[]) => void;
    hasActiveFilters: boolean;
    clearFilters: () => void;
}

export function TaskFilters({
    selectedAreas,
    setSelectedAreas,
    selectedProjects,
    setSelectedProjects,
    selectedDates,
    setSelectedDates,
    hasActiveFilters,
    clearFilters
}: TaskFiltersProps) {
    const { state } = useData();
    const [areasOpen, setAreasOpen] = useState(true);
    const [projectsOpen, setProjectsOpen] = useState(true);
    const [datesOpen, setDatesOpen] = useState(false);

    const toggleArea = (id: string) => {
        if (selectedAreas.includes(id)) setSelectedAreas(selectedAreas.filter(a => a !== id));
        else setSelectedAreas([...selectedAreas, id]);
    };

    const toggleProject = (id: string) => {
        if (selectedProjects.includes(id)) setSelectedProjects(selectedProjects.filter(p => p !== id));
        else setSelectedProjects([...selectedProjects, id]);
    };

    const activeCount = selectedAreas.length + selectedProjects.length + selectedDates.length;

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-card/50 rounded-2xl border border-slate-200/80 dark:border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-muted-foreground" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-foreground">Фільтри</span>
                    {activeCount > 0 && (
                        <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {activeCount}
                        </span>
                    )}
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-slate-400 dark:text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                        Скинути
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* ─── Areas Section ─── */}
                <div className="border-b border-slate-100 dark:border-border">
                    <button
                        onClick={() => setAreasOpen(!areasOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-secondary/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {areasOpen
                                ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-muted-foreground" />
                                : <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-muted-foreground" />
                            }
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                                Сфери
                            </span>
                        </div>
                        {selectedAreas.length > 0 && (
                            <span className="text-[10px] font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                                {selectedAreas.length}
                            </span>
                        )}
                    </button>
                    {areasOpen && (
                        <div className="px-2 pb-2 space-y-0.5">
                            {state.areas.map(area => (
                                <button
                                    key={area.id}
                                    onClick={() => toggleArea(area.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                        selectedAreas.includes(area.id)
                                            ? "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary/30"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: area.color?.startsWith('#') || area.color?.startsWith('rgb') ? area.color : undefined }}
                                        />
                                        <span className="truncate text-left">{area.title}</span>
                                    </div>
                                    {selectedAreas.includes(area.id) && (
                                        <Check className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 shrink-0" />
                                    )}
                                </button>
                            ))}
                            {state.areas.length === 0 && (
                                <p className="text-xs text-muted-foreground px-3 py-2">Немає сфер</p>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Projects Section ─── */}
                <div className="border-b border-slate-100 dark:border-border">
                    <button
                        onClick={() => setProjectsOpen(!projectsOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-secondary/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {projectsOpen
                                ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-muted-foreground" />
                                : <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-muted-foreground" />
                            }
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                                Проекти
                            </span>
                        </div>
                        {selectedProjects.length > 0 && (
                            <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                                {selectedProjects.length}
                            </span>
                        )}
                    </button>
                    {projectsOpen && (
                        <div className="px-2 pb-2 space-y-0.5">
                            {state.projects.filter(p => p.status !== 'completed').map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => toggleProject(project.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all",
                                        selectedProjects.includes(project.id)
                                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-secondary/30"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <Folder className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                        <span className="truncate text-left">{project.title}</span>
                                    </div>
                                    {selectedProjects.includes(project.id) && (
                                        <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                                    )}
                                </button>
                            ))}
                            {state.projects.filter(p => p.status !== 'completed').length === 0 && (
                                <p className="text-xs text-muted-foreground px-3 py-2">Немає активних проектів</p>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Dates Section ─── */}
                <div>
                    <button
                        onClick={() => setDatesOpen(!datesOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-secondary/30 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {datesOpen
                                ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-muted-foreground" />
                                : <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-muted-foreground" />
                            }
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                                Дати
                            </span>
                        </div>
                        {selectedDates.length > 0 && (
                            <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                {selectedDates.length}
                            </span>
                        )}
                    </button>
                    {datesOpen && (
                        <div className="px-2 pb-3">
                            <Calendar
                                mode="multiple"
                                selected={selectedDates}
                                onSelect={(dates) => setSelectedDates(dates as Date[])}
                                locale={uk}
                                className="rounded-xl border border-slate-100 dark:border-border bg-white dark:bg-secondary/20"
                            />
                            {selectedDates.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                                    {selectedDates.map(d => (
                                        <span
                                            key={d.toISOString()}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
                                        >
                                            {format(d, 'dd.MM', { locale: uk })}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const dateStr = format(d, 'yyyy-MM-dd');
                                                    setSelectedDates(selectedDates.filter(sd => format(sd, 'yyyy-MM-dd') !== dateStr));
                                                }}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
