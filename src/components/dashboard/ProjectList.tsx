'use client';

import { MoreHorizontal, Plus, Folder, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/store';
import Link from 'next/link';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function ProjectList() {
    const { state, dispatch } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [areaId, setAreaId] = useState('');
    const [deadline, setDeadline] = useState('');

    // Sort projects by newest first and take top 5
    const projects = [...(state.projects || [])]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const handleCreate = () => {
        if (!title.trim()) return;

        const project: Project = {
            id: uuidv4(),
            title: title.trim(),
            areaId: areaId || undefined,
            status: 'active',
            deadline: deadline || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        dispatch({ type: 'ADD_PROJECT', payload: project });
        setTitle('');
        setAreaId('');
        setDeadline('');
        setIsOpen(false);
    };

    return (
        <div className="bg-white dark:bg-card p-6 rounded-[2rem] shadow-sm border border-border/50 dark:border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Проєкти</h3>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors"
                >
                    <Plus className="w-3 h-3" /> Новий
                </button>
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

            {/* Create Project Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white dark:bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Новий проєкт</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Назва</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Назва проєкту..."
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Сфера</label>
                            <select
                                value={areaId}
                                onChange={(e) => setAreaId(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 transition-all"
                            >
                                <option value="">Без сфери</option>
                                {(state.areas || []).map(area => (
                                    <option key={area.id} value={area.id}>{area.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Дедлайн</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 transition-all"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!title.trim()}
                                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Створити
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
