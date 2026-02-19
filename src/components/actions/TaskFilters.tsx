'use client';

import { useData } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X, Check, Folder, Target, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

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

    const toggleArea = (id: string) => {
        if (selectedAreas.includes(id)) setSelectedAreas(selectedAreas.filter(a => a !== id));
        else setSelectedAreas([...selectedAreas, id]);
    };

    const toggleProject = (id: string) => {
        if (selectedProjects.includes(id)) setSelectedProjects(selectedProjects.filter(p => p !== id));
        else setSelectedProjects([...selectedProjects, id]);
    };

    const toggleDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const existing = selectedDates.find(d => format(d, 'yyyy-MM-dd') === dateStr);
        if (existing) {
            setSelectedDates(selectedDates.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
        } else {
            setSelectedDates([...selectedDates, date]);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-2 mr-2 text-sm font-medium text-slate-500">
                <Filter className="w-4 h-4" />
                Фільтри:
            </div>

            {/* Areas Filter */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 rounded-full border-dashed", selectedAreas.length > 0 && "border-solid bg-orange-50 border-orange-200 text-orange-700")}>
                        Сфери {selectedAreas.length > 0 && `(${selectedAreas.length})`}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {state.areas.map(area => (
                            <button
                                key={area.id}
                                onClick={() => toggleArea(area.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-secondary/50 transition-colors",
                                    selectedAreas.includes(area.id) && "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-primary/20 dark:text-primary"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", area.color)} />
                                    <span>{area.title}</span>
                                </div>
                                {selectedAreas.includes(area.id) && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                        {state.areas.length === 0 && <p className="text-xs text-muted-foreground p-2">Немає сфер</p>}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Projects Filter */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 rounded-full border-dashed", selectedProjects.length > 0 && "border-solid bg-blue-50 border-blue-200 text-blue-700")}>
                        Проекти {selectedProjects.length > 0 && `(${selectedProjects.length})`}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {state.projects.filter(p => p.status !== 'completed').map(project => (
                            <button
                                key={project.id}
                                onClick={() => toggleProject(project.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-secondary/50 transition-colors",
                                    selectedProjects.includes(project.id) && "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-primary/20 dark:text-primary"
                                )}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Folder className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                    <span className="truncate">{project.title}</span>
                                </div>
                                {selectedProjects.includes(project.id) && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                        {state.projects.length === 0 && <p className="text-xs text-muted-foreground p-2">Немає активних проектів</p>}
                    </div>
                </PopoverContent>
            </Popover>

            {/* Dates Filter */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("h-8 rounded-full border-dashed", selectedDates.length > 0 && "border-solid bg-emerald-50 border-emerald-200 text-emerald-700")}>
                        Дати {selectedDates.length > 0 && `(${selectedDates.length})`}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={(dates) => setSelectedDates(dates as Date[])}
                        locale={uk}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 rounded-full px-3 text-slate-500 hover:text-slate-800"
                >
                    Скинути все
                    <X className="w-3.5 h-3.5 ml-1" />
                </Button>
            )}
        </div>
    );
}

