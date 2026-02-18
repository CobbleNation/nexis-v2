'use client';

import { useData } from '@/lib/store';
import Link from 'next/link';
import { Plus, Folder, MoreHorizontal, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
    const { state } = useData();
    const projects = state.projects || [];

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Проєкти</h2>
                    <p className="text-muted-foreground mt-1">Керуйте всіма вашими проєктами в одному місці.</p>
                </div>
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> Новий Проєкт
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project: any) => (
                    <Link href={`/projects/${project.id}`} key={project.id} className="group">
                        <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner",
                                    "bg-primary/5 text-primary" // Use theme variables
                                )}>
                                    {project.icon || <Folder className="w-6 h-6" />}
                                </div>
                                <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 relative z-10">
                                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                    {project.title || "Untitled Project"}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                    {project.description || "No description provided."}
                                </p>

                                {/* Progress Bar (Mock for now) */}
                                <div className="space-y-1.5 mb-4">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-muted-foreground">Прогрес</span>
                                        <span className="text-primary">0%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-0 rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-border/40 relative z-10 mt-auto">
                                <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString('uk-UA') : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex -space-x-2">
                                    {/* Mock Avatars */}
                                    {[1, 2].map((i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white dark:border-card flex items-center justify-center text-[8px] font-bold text-gray-500">
                                            U{i}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Add New Card (Empty State) */}
                <button className="group h-full min-h-[250px] border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">Створити Проєкт</span>
                </button>
            </div>
        </div>
    );
}
