'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CheckSquare, Target, Folder, FileText, LayoutGrid, ArrowRight, Clock, Hash } from 'lucide-react';
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Using Dialog for a centralized command palette feel or Popover for inline. 
// User asked for "in the topbar", so an inline expanding search or a popover attached to the input is best.
// I'll simulate a Popover behavior but with a custom container for better control over the "expanded" state.

type SearchCategory = 'all' | 'actions' | 'goals' | 'projects' | 'notes' | 'areas';

export function GlobalSearch() {
    const router = useRouter();
    const { state } = useData();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<SearchCategory>('all');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const results = useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        const allResults: { type: string; data: any; score: number }[] = [];

        // Actions
        if (category === 'all' || category === 'actions') {
            state.actions.filter(i => !i.completed && i.title.toLowerCase().includes(lowerQuery))
                .forEach(i => allResults.push({ type: 'task', data: i, score: 1 }));
        }

        // Goals
        if (category === 'all' || category === 'goals') {
            state.goals.filter(i => i.title.toLowerCase().includes(lowerQuery))
                .forEach(i => allResults.push({ type: 'goal', data: i, score: 2 }));
        }

        // Projects
        if (category === 'all' || category === 'projects') {
            state.projects.filter(i => i.title.toLowerCase().includes(lowerQuery))
                .forEach(i => allResults.push({ type: 'project', data: i, score: 2 }));
        }

        // Notes (Content)
        if (category === 'all' || category === 'notes') {
            state.notes.filter(i => i.title.toLowerCase().includes(lowerQuery))
                .forEach(i => allResults.push({ type: 'note', data: i, score: 1 }));
        }

        // Areas
        if (category === 'all' || category === 'areas') {
            state.areas.filter(i => i.title.toLowerCase().includes(lowerQuery))
                .forEach(i => allResults.push({ type: 'area', data: i, score: 3 }));
        }

        // Sort by priority/relevance (simple score here) then alphabetic
        return allResults.sort((a, b) => b.score - a.score);
    }, [query, category, state]);

    const handleSelect = (result: any) => {
        setIsOpen(false);
        setQuery('');

        switch (result.type) {
            case 'task':
                // Ideally open task modal, for now navigate to actions
                router.push('/actions?taskId=' + result.data.id);
                break;
            case 'goal':
                router.push('/goals?tab=goals&id=' + result.data.id); // Assuming query param support or just page
                break;
            case 'project':
                router.push('/projects/' + result.data.id);
                break;
            case 'note':
                router.push('/content?tab=notes&id=' + result.data.id);
                break;
            case 'area':
                router.push('/areas/' + result.data.id);
                break;
        }
    };

    const categories: { id: SearchCategory; label: string; icon: React.ElementType }[] = [
        { id: 'all', label: 'Все', icon: LayoutGrid },
        { id: 'actions', label: 'Завдання', icon: CheckSquare },
        { id: 'goals', label: 'Цілі', icon: Target },
        { id: 'projects', label: 'Проекти', icon: Folder },
        { id: 'notes', label: 'Нотатки', icon: FileText },
    ];

    return (
        <div ref={containerRef} className="relative flex-1 max-w-2xl mx-2 md:mx-12">
            <div className={cn(
                "relative group transition-all duration-300",
                isOpen ? "z-50" : "z-10"
            )}>
                {/* Glow Effect */}
                <div className={cn(
                    "absolute inset-0 bg-primary/20 rounded-2xl blur-xl transition-opacity duration-500",
                    isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                )} />

                {/* Search Bar */}
                <div className={cn(
                    "relative flex items-center bg-white/90 dark:bg-secondary/50 border border-slate-200/50 dark:border-border/50 backdrop-blur-xl transition-all overflow-hidden",
                    isOpen ? "rounded-t-2xl shadow-lg border-b-0 bg-white dark:bg-card" : "rounded-2xl shadow-sm hover:shadow-md h-12"
                )}>
                    <Search className={cn(
                        "ml-4 h-5 w-5 transition-colors",
                        isOpen ? "text-primary" : "text-muted-foreground group-focus-within:text-primary"
                    )} />

                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!isOpen) setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Пошук (Цілі, Нотатки, Завдання)..."
                        className="h-12 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 text-base"
                    />

                    {/* Quick Category Toggle (Visible when open or if category selected) */}
                    {(isOpen || category !== 'all') && (
                        <div className="flex pr-2 gap-1">
                            {category !== 'all' && !isOpen && (
                                <Badge variant="secondary" className="mr-2" onClick={() => { setIsOpen(true); }}>
                                    {categories.find(c => c.id === category)?.label}
                                    <X className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" onClick={(e) => {
                                        e.stopPropagation();
                                        setCategory('all');
                                    }} />
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Dropdown Results */}
                {isOpen && (
                    <div className="absolute top-12 left-0 right-0 bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-t-0 border-border/50 rounded-b-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Categories Bar */}
                        <div className="flex items-center gap-1 p-2 border-b border-border/40 overflow-x-auto no-scrollbar">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted dark:hover:bg-white/5 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Results Area */}
                        <ScrollArea className="h-[max(300px,50vh)] max-h-[500px]">
                            <div className="p-2 space-y-1">
                                {results.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground">
                                        {query ? (
                                            <>
                                                <p className="font-medium text-foreground">Нічого не знайдено</p>
                                                <p className="text-sm">Спробуйте змінити запит або категорію</p>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 opacity-60">
                                                <Search className="h-8 w-8" />
                                                <p className="text-sm">Введіть запит для пошуку...</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    results.map((result, idx) => (
                                        <div
                                            key={`${result.type}-${result.data.id}-${idx}`}
                                            onClick={() => handleSelect(result)}
                                            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-border/50 shadow-sm",
                                                result.type === 'task' && "bg-blue-500/10 text-blue-500",
                                                result.type === 'goal' && "bg-purple-500/10 text-purple-500",
                                                result.type === 'project' && "bg-orange-500/10 text-orange-500",
                                                result.type === 'note' && "bg-emerald-500/10 text-emerald-500",
                                                result.type === 'area' && "bg-slate-500/10 text-slate-500",
                                            )}>
                                                {result.type === 'task' && <CheckSquare className="h-5 w-5" />}
                                                {result.type === 'goal' && <Target className="h-5 w-5" />}
                                                {result.type === 'project' && <Folder className="h-5 w-5" />}
                                                {result.type === 'note' && <FileText className="h-5 w-5" />}
                                                {result.type === 'area' && <Hash className="h-5 w-5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground truncate">{result.data.title}</span>
                                                    {result.type === 'task' && result.data.completed && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Done</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    <Badge variant="outline" className="h-4 px-1 rounded-[4px] text-[9px] uppercase tracking-wider font-semibold border-border/40 bg-background/50">
                                                        {result.type === 'task' ? 'Завдання' :
                                                            result.type === 'goal' ? 'Ціль' :
                                                                result.type === 'project' ? 'Проект' :
                                                                    result.type === 'note' ? 'Нотатка' : 'Сфера'}
                                                    </Badge>

                                                    {result.data.date && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(result.data.date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>

                        {/* Footer (Stats) */}
                        <div className="bg-muted/30 p-2 text-center border-t border-border/50">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">
                                {results.length} результатів
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
