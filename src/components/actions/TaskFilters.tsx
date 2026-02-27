'use client';

import { useData } from '@/lib/store';
import { Check, Folder, ChevronDown, ChevronRight, X, SlidersHorizontal, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useState } from 'react';

interface TaskFiltersProps {
    selectedAreas: string[];
    setSelectedAreas: (areas: string[]) => void;
    selectedProjects: string[];
    setSelectedProjects: (projects: string[]) => void;
    dateFrom: Date | null;
    setDateFrom: (date: Date | null) => void;
    dateTo: Date | null;
    setDateTo: (date: Date | null) => void;
    hasActiveFilters: boolean;
    clearFilters: () => void;
}

export function TaskFilters({
    selectedAreas,
    setSelectedAreas,
    selectedProjects,
    setSelectedProjects,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
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

    const selectAllAreas = () => {
        const allIds = state.areas.map(a => a.id);
        if (selectedAreas.length === allIds.length) {
            setSelectedAreas([]);
        } else {
            setSelectedAreas(allIds);
        }
    };

    const activeProjects = state.projects.filter(p => p.status !== 'completed');
    const selectAllProjects = () => {
        const allIds = activeProjects.map(p => p.id);
        if (selectedProjects.length === allIds.length) {
            setSelectedProjects([]);
        } else {
            setSelectedProjects(allIds);
        }
    };

    const hasDateFilter = dateFrom !== null || dateTo !== null;
    const activeCount = selectedAreas.length + selectedProjects.length + (hasDateFilter ? 1 : 0);

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-card/50 rounded-2xl border border-slate-200/80 dark:border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-border flex items-center justify-between shrink-0">
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
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-secondary/30 transition-colors"
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
                        <div className="px-2 pb-1.5 space-y-0 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {/* Select All */}
                            {state.areas.length > 0 && (
                                <button
                                    onClick={selectAllAreas}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all mb-2 border",
                                        selectedAreas.length === state.areas.length
                                            ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                                            : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-secondary/50 shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCheck className="w-4 h-4" />
                                        <span>{selectedAreas.length === state.areas.length ? 'Зняти всі' : 'Обрати всі'}</span>
                                    </div>
                                </button>
                            )}
                            {state.areas.map(area => (
                                <button
                                    key={area.id}
                                    onClick={() => toggleArea(area.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-lg transition-all",
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
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-secondary/30 transition-colors"
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
                        <div className="px-2 pb-1.5 space-y-0 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {/* Select All */}
                            {activeProjects.length > 0 && (
                                <button
                                    onClick={selectAllProjects}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all mb-2 border",
                                        selectedProjects.length === activeProjects.length
                                            ? "bg-blue-500 text-white border-blue-600 shadow-sm"
                                            : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-secondary/50 shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCheck className="w-4 h-4" />
                                        <span>{selectedProjects.length === activeProjects.length ? 'Зняти всі' : 'Обрати всі'}</span>
                                    </div>
                                </button>
                            )}
                            {activeProjects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => toggleProject(project.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-lg transition-all",
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
                            {activeProjects.length === 0 && (
                                <p className="text-xs text-muted-foreground px-3 py-2">Немає активних проектів</p>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Dates Section ─── */}
                <div>
                    <button
                        onClick={() => setDatesOpen(!datesOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-secondary/30 transition-colors"
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
                        {hasDateFilter && (
                            <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                ✓
                            </span>
                        )}
                    </button>
                    {datesOpen && (
                        <div className="px-3 pb-3 space-y-3 overflow-hidden">
                            {/* Date From */}
                            <div className="space-y-1.5 w-full">
                                <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground pl-0.5">
                                    З
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
                                    className="w-full min-w-0 flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 focus:border-orange-400 dark:focus:border-primary transition-all"
                                />
                            </div>

                            {/* Date To */}
                            <div className="space-y-1.5 w-full">
                                <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground pl-0.5">
                                    По
                                </label>
                                <input
                                    type="date"
                                    value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
                                    min={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined}
                                    className="w-full min-w-0 flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 focus:border-orange-400 dark:focus:border-primary transition-all"
                                />
                            </div>

                            {/* Summary + Clear */}
                            {hasDateFilter && (
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                        {dateFrom && dateTo
                                            ? `${format(dateFrom, 'dd.MM.yy', { locale: uk })} — ${format(dateTo, 'dd.MM.yy', { locale: uk })}`
                                            : dateFrom
                                                ? `З ${format(dateFrom, 'dd.MM.yy', { locale: uk })}`
                                                : `По ${format(dateTo!, 'dd.MM.yy', { locale: uk })}`
                                        }
                                    </span>
                                    <button
                                        onClick={() => { setDateFrom(null); setDateTo(null); }}
                                        className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
