'use client';

import { MoreHorizontal, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/store';
import Link from 'next/link';

export function ProjectList() {
    const { state } = useData();

    // Sort projects by newest first and take top 5
    const projects = [...(state.projects || [])]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-card p-6 rounded-[2rem] shadow-sm border border-border/50 dark:border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Проєкти</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                {projects.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                        Немає активних проєктів
                    </div>
                ) : (
                    projects.map((project: any, index: number) => (
                        <Link href={`/projects/${project.id}`} key={project.id || index}>
                            <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-muted/10 p-2 rounded-xl transition-colors">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg bg-primary/10 text-primary")}>
                                    {project.icon || <Folder className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-foreground truncate">{project.title || "Untitled Project"}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Створено: {project.createdAt ? new Date(project.createdAt).toLocaleDateString('uk-UA') : 'Unknown'}
                                    </p>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-foreground transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

