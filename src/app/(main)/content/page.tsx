'use client';

import { Folder, FileText, Search, Plus, BookOpen, HardDrive, MoreVertical, Image as ImageIcon, Grid, List as ListIcon, Calendar as CalendarIcon, Link as LinkIcon, Video, Type, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useData } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { ContentEditDialog } from '@/components/content/ContentEditDialog';
import { Note, JournalEntry, FileAsset, LibraryItem } from '@/types';
import { useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Lock } from 'lucide-react';
import { UpgradeModal } from '@/components/common/UpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';
import { LIMITS, SUBSCRIPTION_PLAN } from '@/lib/limits';

type ContentType = 'note' | 'journal' | 'file' | 'library';

import { Suspense } from 'react';

function ContentPageContent() {
    const { state, dispatch } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isPro, tier } = useSubscription();
    const [upgradeOpen, setUpgradeOpen] = useState(false);

    const currentTab = searchParams.get('tab') || 'notes';

    const handleTabChange = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', val);
        params.delete('id'); // Clear ID when switching tabs
        router.push(`/content?${params.toString()}`);
    };

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<ContentType>('note');
    const [selectedItem, setSelectedItem] = useState<Note | JournalEntry | FileAsset | LibraryItem | null>(null);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchTerm, setSearchTerm] = useState('');

    // Handle URL Params for Deep Linking
    useEffect(() => {
        const id = searchParams.get('id');
        const tab = searchParams.get('tab');

        if (id && tab) {
            let item: any = null;
            if (tab === 'notes') item = state.notes.find(n => n.id === id);
            else if (tab === 'journal') item = state.journal.find(j => j.id === id);
            else if (tab === 'files') item = state.files.find(f => f.id === id);
            else if (tab === 'library') item = state.library.find(l => l.id === id);

            if (item) {
                setSelectedItem(item);
                setSelectedType(tab === 'notes' ? 'note' : tab === 'files' ? 'file' : tab === 'library' ? 'library' : 'journal');
                setDialogOpen(true);
            }
        }
    }, [searchParams, state]);

    const handleItemClick = (type: ContentType, item: any) => {
        setSelectedItem(item);
        setSelectedType(type);
        setDialogOpen(true);
        // Optional: Update URL without full reload if desired, but for now just open dialog
        // router.push(`/content?tab=${type === 'note' ? 'notes' : type === 'file' ? 'files' : type}&id=${item.id}`, { scroll: false });
    };

    // Filter Logic
    const filteredNotes = state.notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredJournal = state.journal.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const filteredLibrary = state.library.filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredFiles = state.files.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));


    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Контент</h2>
                    <p className="text-muted-foreground">Ваш другий мозок. Думайте, не виконуйте.</p>
                </div>

                {/* Note Trigger is default unless in other tabs */}
                <div className="flex gap-2">
                </div>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col space-y-6">
                <div className="flex justify-between items-center bg-white/50 dark:bg-card/50 p-2 rounded-2xl border border-slate-100 dark:border-border backdrop-blur-sm">
                    <TabsList id="content-tabs" className="bg-transparent p-0 gap-1 md:gap-2 overflow-x-auto no-scrollbar flex-nowrap">
                        <TabsTrigger value="notes" className="shrink-0 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-3 md:px-4 py-2 transition-all text-slate-600 dark:text-muted-foreground whitespace-nowrap">
                            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Нотатки</span>
                            <span className="bg-slate-100 dark:bg-primary-foreground/20 text-slate-600 dark:text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {state.notes.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="journal" className="shrink-0 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-3 md:px-4 py-2 transition-all text-slate-600 dark:text-muted-foreground whitespace-nowrap">
                            <BookOpen className="h-4 w-4" /> <span className="hidden sm:inline">Журнал</span>
                            <span className="bg-slate-100 dark:bg-primary-foreground/20 text-slate-600 dark:text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {state.journal.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="files" className="shrink-0 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-3 md:px-4 py-2 transition-all text-slate-600 dark:text-muted-foreground whitespace-nowrap">
                            <Folder className="h-4 w-4" /> <span className="hidden sm:inline">Файли</span>
                            <span className="bg-slate-100 dark:bg-primary-foreground/20 text-slate-600 dark:text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {state.files.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="library" className="shrink-0 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-xl px-3 md:px-4 py-2 transition-all text-slate-600 dark:text-muted-foreground whitespace-nowrap">
                            <HardDrive className="h-4 w-4" /> <span className="hidden sm:inline">Бібліотека</span>
                            <span className="bg-slate-100 dark:bg-primary-foreground/20 text-slate-600 dark:text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                {state.library.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="hidden md:flex gap-2 items-center pr-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            {tier === SUBSCRIPTION_PLAN.FREE && !LIMITS[SUBSCRIPTION_PLAN.FREE].HAS_SEARCH ? (
                                <div
                                    onClick={() => setUpgradeOpen(true)}
                                    className="relative cursor-pointer"
                                >
                                    <Input
                                        disabled
                                        placeholder="Пошук (Pro)..."
                                        className="pl-9 h-9 rounded-xl bg-slate-50 dark:bg-card/50 border-slate-200 dark:border-border cursor-pointer opacity-75"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500">
                                        <Lock className="h-3 w-3" />
                                    </div>
                                </div>
                            ) : (
                                <Input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Пошук..."
                                    className="pl-9 h-9 rounded-xl bg-white dark:bg-background border-slate-200 dark:border-border focus-visible:ring-1 transition-all"
                                />
                            )}
                        </div>
                        <UpgradeModal
                            open={upgradeOpen}
                            onOpenChange={setUpgradeOpen}
                            title="Пошук по нотатках"
                            description="Знаходьте будь-яку думку за секунди. Pro відкриває глобальний пошук та теги."
                        />
                    </div>
                </div>

                <TabsContent value="notes" className="flex-1 space-y-6">
                    {filteredNotes.length === 0 ? (
                        <div className="text-center p-16 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20 flex flex-col items-center">
                            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-lg text-foreground">Тут будуть ваші ідеї</h3>
                            <p className="max-w-sm mt-2">Використовуйте кнопку <span className="font-bold text-primary">+ Додати</span> зверху, щоб створити нотатку.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredNotes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => handleItemClick('note', note)}
                                    className="bg-white dark:bg-card rounded-3xl p-6 hover:shadow-lg transition-all cursor-pointer shadow-sm group border border-slate-100 dark:border-border flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        {note.audioUrl && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                <Mic className="h-3 w-3" /> Audio
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-lg truncate mb-2 text-foreground">{note.title}</h4>

                                    {/* Rich Text Preview */}
                                    <div
                                        className="text-sm text-slate-500 dark:text-muted-foreground mb-4 h-[4.5em] overflow-hidden relative prose prose-sm max-w-none prose-p:my-0 prose-headings:my-1 text-left dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: note.content || '<p class="text-slate-300 dark:text-slate-600 italic">Empty note...</p>' }}
                                    >
                                    </div>

                                    {note.audioUrl && (
                                        <div className="mb-4 pt-2">
                                            <audio controls src={note.audioUrl} className="w-full h-8" />
                                        </div>
                                    )}

                                    <div className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium pt-4 border-t border-slate-50 dark:border-border mt-auto">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="journal" className="flex-1 space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Хронологія Думок</h3>
                    </div>

                    {filteredJournal.length === 0 ? (
                        <div className="text-center p-16 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20 flex flex-col items-center">
                            <div className="h-16 w-16 bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-4">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-lg text-foreground">Журнал пустий</h3>
                            <p className="max-w-sm mt-2">Використовуйте кнопку <span className="font-bold text-primary">+ Додати</span> зверху, щоб створити запис.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 relative pl-8 border-l-2 border-slate-100 dark:border-border ml-4">
                            {filteredJournal.map(entry => (
                                <div key={entry.id} className="relative cursor-pointer" onClick={() => handleItemClick('journal', entry)}>
                                    <div className="absolute -left-[41px] top-0 h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900 border-4 border-white dark:border-background ring-1 ring-slate-200 dark:ring-border" />
                                    <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-border hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </span>
                                            {entry.mood && <span className="text-xs font-medium text-slate-400 dark:text-muted-foreground">Настрій: {entry.mood}/10</span>}
                                        </div>
                                        <p className="text-slate-700 dark:text-foreground leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="files" className="flex-1 space-y-6">
                    <div className="flex justify-end mb-4">
                    </div>

                    {filteredFiles.length === 0 ? (
                        <div className="text-center p-16 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20 flex flex-col items-center">
                            <div className="h-16 w-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4">
                                <Folder className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-lg text-foreground">Немає файлів</h3>
                            <p className="max-w-sm mt-2">Використовуйте кнопку <span className="font-bold text-primary">+ Додати</span> зверху, щоб завантажити файл.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredFiles.map(file => (
                                <div
                                    key={file.id}
                                    onClick={() => handleItemClick('file', file)}
                                    className="bg-white dark:bg-card p-4 rounded-2xl border border-slate-100 dark:border-border flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                                        file.type === 'document' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400" :
                                            file.type === 'image' ? "bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400" : "bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground"
                                    )}>
                                        {file.type === 'document' && <FileText className="h-6 w-6" />}
                                        {file.type === 'image' && <ImageIcon className="h-6 w-6" />}
                                        {file.type === 'other' && <Folder className="h-6 w-6" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-sm truncate text-foreground">{file.title}</h4>
                                        <p className="text-xs text-slate-400 dark:text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="library" className="flex-1 space-y-6">
                    <div className="flex justify-end mb-4">
                    </div>

                    {filteredLibrary.length === 0 ? (
                        <div className="text-center p-16 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-border rounded-3xl bg-slate-50/50 dark:bg-card/20 flex flex-col items-center">
                            <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
                                <HardDrive className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-700 dark:text-foreground">Бібліотека порожня</h3>
                            <p className="max-w-sm mt-2">Використовуйте кнопку <span className="font-bold text-orange-600 dark:text-orange-400">+ Додати</span> зверху, щоб додати ресурс.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredLibrary.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        if (item.url) {
                                            window.open(item.url, '_blank');
                                        } else {
                                            handleItemClick('library', item);
                                        }
                                    }}
                                    className="bg-white dark:bg-card rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-border hover:shadow-lg transition-all cursor-pointer flex flex-col h-full group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                            {item.type === 'book' && <BookOpen className="h-5 w-5" />}
                                            {item.type === 'video' && <Video className="h-5 w-5" />}
                                            {item.type === 'article' && <FileText className="h-5 w-5" />}
                                            {(item.type === 'course' || item.type === 'link') && <LinkIcon className="h-5 w-5" />}
                                        </div>
                                        <span className={cn("text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                                            item.status === 'consumed' ? 'bg-slate-100 dark:bg-secondary text-slate-500 dark:text-muted-foreground' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                        )}>
                                            {item.status === 'to_consume' ? 'У планах' : 'Вивчено'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-lg leading-tight mb-1 text-foreground">{item.title}</h4>
                                    {item.author && <p className="text-sm text-slate-500 dark:text-muted-foreground mb-4">{item.author}</p>}

                                    <div className="mt-auto pt-4 border-t border-slate-50 dark:border-border flex items-center justify-between text-xs text-slate-400 dark:text-muted-foreground">
                                        <span>Додано: {new Date(item.createdAt).toLocaleDateString()}</span>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleItemClick('library', item)}>
                                                        Редагувати
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600 dark:text-red-400"
                                                        onClick={() => {
                                                            if (confirm('Видалити цей елемент?')) {
                                                                dispatch({ type: 'DELETE_LIBRARY_ITEM', payload: { id: item.id } });
                                                            }
                                                        }}
                                                    >
                                                        Видалити
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <ContentEditDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        // Clear URL params on close
                        router.push('/content');
                    }
                }}
                type={selectedType}
                initialData={selectedItem}
            />
        </div>
    );
}

export default function ContentPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading content...</div>}>
            <ContentPageContent />
        </Suspense>
    );
}
