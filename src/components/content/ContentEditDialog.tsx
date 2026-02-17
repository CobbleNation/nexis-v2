import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Note, JournalEntry, FileAsset, LibraryItem } from "@/types";
import { useData } from "@/lib/store";
import { toast } from "sonner";
import { Trash2, Save, ExternalLink, Calendar, BookOpen, FileText, HardDrive, Folder } from "lucide-react";

type ContentType = 'note' | 'journal' | 'file' | 'library';

interface ContentEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: ContentType;
    initialData: Note | JournalEntry | FileAsset | LibraryItem | null;
}

export function ContentEditDialog({ open, onOpenChange, type, initialData }: ContentEditDialogProps) {
    const { dispatch, state } = useData();
    const { areas } = state;
    const [title, setTitle] = React.useState('');
    const [content, setContent] = React.useState('');
    const [metadata, setMetadata] = React.useState<any>({});

    // Initialize state when data changes
    React.useEffect(() => {
        if (initialData) {
            if (type === 'note') {
                const note = initialData as Note;
                setTitle(note.title);
                setContent(note.content);
                setTitle(note.title);
                setContent(note.content);
                setMetadata({ date: note.date, tags: note.tags, relatedAreaIds: note.relatedAreaIds || [] });
            } else if (type === 'journal') {
                const journal = initialData as JournalEntry;
                // Journal often doesn't have a title, but we can synthesize one or just use content
                setTitle(new Date(journal.date).toLocaleDateString());
                setContent(journal.content);
                setMetadata({ mood: journal.mood, date: journal.date });
            } else if (type === 'file') {
                const file = initialData as FileAsset;
                setTitle(file.title);
                setMetadata({ type: file.type, url: file.url });
            } else if (type === 'library') {
                const item = initialData as LibraryItem;
                setTitle(item.title);
                setMetadata({
                    type: item.type,
                    author: item.author,
                    url: item.url,
                    status: item.status,
                    rating: item.rating
                });
            }
        }
    }, [initialData, type]);

    const handleSave = () => {
        if (!initialData) return;

        try {
            if (type === 'note') {
                const note = initialData as Note;
                const updatedNote: Note = {
                    ...note,
                    title,
                    content,
                    relatedAreaIds: metadata.relatedAreaIds, // Save selected areas
                    updatedAt: new Date().toISOString()
                };
                dispatch({ type: 'UPDATE_NOTE', payload: updatedNote });
                toast.success("Нотатку оновлено");
            } else if (type === 'journal') {
                const journal = initialData as JournalEntry;
                const updatedJournal: JournalEntry = {
                    ...journal,
                    content,
                    mood: metadata.mood || journal.mood
                };
                dispatch({ type: 'UPDATE_JOURNAL', payload: updatedJournal });
                toast.success("Запис оновлено");
            } else if (type === 'library') {
                const item = initialData as LibraryItem;
                const updatedItem: LibraryItem = {
                    ...item,
                    title,
                    author: metadata.author,
                    url: metadata.url,
                    status: metadata.status || item.status
                };
                dispatch({ type: 'UPDATE_LIBRARY_ITEM', payload: updatedItem });
                toast.success("Ресурс оновлено");
            } else if (type === 'file') {
                const file = initialData as FileAsset;
                const updatedFile: FileAsset = {
                    ...file,
                    title
                };
                dispatch({ type: 'UPDATE_FILE', payload: updatedFile });
                toast.success("Файл оновлено");
            }
            onOpenChange(false);
        } catch (e) {
            toast.error("Помилка збереження");
        }
    };

    const handleDelete = () => {
        if (!initialData) return;
        if (confirm("Ви впевнені, що хочете видалити цей елемент?")) {
            if (type === 'note') dispatch({ type: 'DELETE_NOTE', payload: { id: initialData.id } });
            if (type === 'journal') dispatch({ type: 'DELETE_JOURNAL', payload: { id: initialData.id } });
            if (type === 'library') dispatch({ type: 'DELETE_LIBRARY_ITEM', payload: { id: initialData.id } });
            if (type === 'file') dispatch({ type: 'DELETE_FILE', payload: { id: initialData.id } });

            toast.success("Видалено");
            onOpenChange(false);
        }
    };

    if (!initialData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:max-w-[700px] h-[80vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-card border-none ring-1 ring-slate-900/5 dark:ring-border shadow-2xl">

                {/* Header */}
                <DialogHeader className="p-4 border-b border-slate-100 dark:border-border flex flex-row items-center justify-between space-y-0 bg-slate-50/50 dark:bg-card/50">
                    <div className="flex items-center gap-2">
                        {type === 'note' && <FileText className="h-5 w-5 text-blue-500" />}
                        {type === 'journal' && <BookOpen className="h-5 w-5 text-purple-500" />}
                        {type === 'library' && <HardDrive className="h-5 w-5 text-emerald-500" />}
                        {type === 'file' && <Folder className="h-5 w-5 text-orange-500" />}
                        <DialogTitle className="text-lg font-bold">
                            {type === 'journal' ? 'Запис в журнал' : 'Редагування'}
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleSave} className="gap-2 bg-slate-900 dark:bg-primary text-white hover:bg-slate-800 rounded-lg">
                            <Save className="h-4 w-4" /> Зберегти
                        </Button>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Title (Except Journal) */}
                    {type !== 'journal' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Назва</label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="text-lg font-bold border-none shadow-none p-0 focus-visible:ring-0 bg-transparent placeholder:text-slate-300"
                                    placeholder="Title..."
                                />
                            </div>

                            {/* Area Selector for Notes */}
                            {type === 'note' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Сфера</label>
                                    <Select
                                        value={metadata.relatedAreaIds?.[0] || 'none'}
                                        onValueChange={(val) => setMetadata({ ...metadata, relatedAreaIds: val === 'none' ? [] : [val] })}
                                    >
                                        <SelectTrigger className="w-full h-8 bg-slate-50 dark:bg-secondary/20 border-none text-xs">
                                            <SelectValue placeholder="Обрати сферу..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Без сфери</SelectItem>
                                            {areas.map(area => (
                                                <SelectItem key={area.id} value={area.id}>{area.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Metadata Section */}
                    {type === 'journal' && (
                        <div className="flex gap-4 p-4 bg-slate-50 dark:bg-secondary/20 rounded-xl">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Дата</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    {new Date(metadata.date).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Настрій</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500"
                                            style={{ width: `${(metadata.mood || 5) * 10}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-purple-600">{metadata.mood || 5}/10</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'library' && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-secondary/20 rounded-xl">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Автор</label>
                                <Input
                                    value={metadata.author || ''}
                                    onChange={e => setMetadata({ ...metadata, author: e.target.value })}
                                    className="h-8 bg-white dark:bg-card border-slate-200 dark:border-border"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Статус</label>
                                <Select
                                    value={metadata.status}
                                    onValueChange={v => setMetadata({ ...metadata, status: v })}
                                >
                                    <SelectTrigger className="h-8 bg-white dark:bg-card border-slate-200 dark:border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="to_consume">У Планах</SelectItem>
                                        <SelectItem value="consuming">В процесі</SelectItem>
                                        <SelectItem value="consumed">Завершено</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400">Посилання</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={metadata.url || ''}
                                        onChange={e => setMetadata({ ...metadata, url: e.target.value })}
                                        className="h-8 bg-white dark:bg-card border-slate-200 dark:border-border font-mono text-xs"
                                    />
                                    {metadata.url && (
                                        <a href={metadata.url} target="_blank" rel="noreferrer" className="flex items-center justify-center p-2 bg-slate-100 dark:bg-secondary rounded-md hover:bg-slate-200 dark:hover:bg-accent transition-colors">
                                            <ExternalLink className="h-4 w-4 text-slate-500" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* File Preview */}
                    {type === 'file' && (
                        <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-card overflow-hidden min-h-[300px] flex items-center justify-center relative group">
                            {metadata.type === 'image' || (metadata.url && metadata.url.match(/\.(jpeg|jpg|gif|png)$/)) ? (
                                <img src={metadata.url} alt={title} className="max-w-full max-h-[500px] object-contain" />
                            ) : (
                                <div className="flex flex-col items-center gap-4 p-8 text-center">
                                    <div className="h-20 w-20 bg-slate-200 dark:bg-secondary rounded-2xl flex items-center justify-center">
                                        <Folder className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-700 dark:text-foreground">Попередній перегляд недоступний</p>
                                        <p className="text-sm text-slate-400">Файл: {metadata.url || 'Локальний файл'}</p>
                                    </div>
                                    {metadata.url && (
                                        <Button variant="outline" asChild>
                                            <a href={metadata.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" /> Відкрити в новому вікні
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Editor */}
                    <div className="flex-1 min-h-[200px]">
                        {/* Audio Player for Notes */}
                        {type === 'note' && (initialData as Note).audioUrl && (
                            <div className="mb-4 p-3 bg-slate-50 dark:bg-secondary/20 rounded-lg border border-slate-100 dark:border-border">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 block">Аудіозапис</span>
                                <audio controls src={(initialData as Note).audioUrl} className="w-full h-8" />
                            </div>
                        )}

                        {type === 'note' ? (
                            <RichTextEditor
                                content={content}
                                onChange={setContent}
                                className="min-h-[300px] border-none focus-visible:ring-0"
                            />
                        ) : type === 'journal' ? (
                            // Read-Only Display for Journal
                            <div className="bg-white dark:bg-card p-6 rounded-xl border border-slate-100 dark:border-border">
                                <p className="whitespace-pre-wrap text-lg leading-relaxed text-slate-800 dark:text-foreground font-serif">
                                    {content}
                                </p>
                            </div>
                        ) : null}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
