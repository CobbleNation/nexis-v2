'use client';

import { useData } from '@/lib/store';
import { useMemo } from 'react';
import { Folder, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import Link from 'next/link';

export function ActiveProjectsOverview() {
    const { state } = useData();

    // Get active projects sorted by last updated or creation date
    const activeProjects = useMemo(() => {
        return state.projects
            .filter(p => p.status !== 'completed' && p.status !== 'deferred')
            .map(project => {
                // Determine progress from checklist if available
                let progress = 0;

                // Fallback to related actions if no checklist
                const relatedActions = state.actions.filter(a => a.projectId === project.id);
                if (relatedActions.length > 0) {
                    const completed = relatedActions.filter(a => a.completed).length;
                    progress = Math.round((completed / relatedActions.length) * 100);
                }

                // Determine last activity dynamically
                // Simple logic: use the most recently edited task associated with this project as "last activity"
                // Or fallback to project updatedAt or createdAt
                let lastActivityDate = new Date(project.updatedAt || project.createdAt || new Date());

                // Get latest completed action date for this project
                const latestAction = relatedActions
                    .filter(a => a.completed && a.updatedAt)
                    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())[0];

                if (latestAction && latestAction.updatedAt) {
                    const actionDate = new Date(latestAction.updatedAt);
                    if (actionDate > lastActivityDate) {
                        lastActivityDate = actionDate;
                    }
                }

                return {
                    ...project,
                    progress,
                    lastActivityDate
                };
            })
            // Sort to show highest progress first
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3); // Take top 3 for the dashboard
    }, [state.projects, state.actions]);

    if (activeProjects.length === 0) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Активні Проєкти</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/50 rounded-2xl">
                    <Folder className="w-8 h-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Немає активних проєктів</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 tracking-tight flex justify-between items-center">
                <span>Активні Проєкти</span>
                <Link href="/projects" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
                    Всі
                </Link>
            </h3>

            <div className="flex flex-col gap-4">
                {activeProjects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="group flex flex-col p-4 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl transition-colors cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors truncate pr-2">
                                {project.title}
                            </h4>
                            <span className="font-mono text-xs font-bold text-foreground bg-white dark:bg-black/20 px-2 py-0.5 rounded-full border border-border/50 shrink-0">
                                {project.progress}%
                            </span>
                        </div>

                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                            <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-70" />
                            <span>
                                Останні зміни: {formatDistanceToNow(project.lastActivityDate, { addSuffix: true, locale: uk })}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
