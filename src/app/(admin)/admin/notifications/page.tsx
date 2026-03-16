'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { toast } from 'sonner';
import { Megaphone, Send, AlertCircle, Info, Star, Trash2, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('announcement');
    const [link, setLink] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/admin/notifications/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (err) {
            toast.error('Не вдалося завантажити історію');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleDeleteBroadcast = async (item: any) => {
        if (!confirm(`Видалити сповіщення "${item.title}" у всіх користувачів?`)) return;

        try {
            const params = new URLSearchParams({
                title: item.title,
                message: item.message,
                type: item.type
            });
            const res = await fetch(`/api/admin/notifications/history?${params.toString()}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Сповіщення успішно видалено');
                fetchHistory(); // refresh
            } else {
                const err = await res.json();
                toast.error(err.error || 'Помилка видалення');
            }
        } catch (err) {
            toast.error('Сталася помилка при видаленні');
        }
    };

    const handleBroadcast = async () => {
        if (!title || !message) {
            toast.error('Будь ласка, заповніть заголовок та повідомлення');
            return;
        }

        if (!confirm('Ви впевнені, що хочете надіслати це сповіщення ВСІМ користувачам?')) {
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch('/api/admin/notifications/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, content, type, link })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Успішно надіслано ${data.count} користувачам!`);
                setTitle('');
                setMessage('');
                setContent('');
                setLink('');
                fetchHistory(); // Refresh history automatically
            } else {
                const err = await res.json();
                toast.error(err.error || 'Помилка при розсилці');
            }
        } catch (err) {
            toast.error('Критична помилка при розсилці');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <Megaphone className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Оголошення системи</h1>
                    <p className="text-muted-foreground">Надсилайте важливі повідомлення всім користувачам Zynorvia</p>
                </div>
            </div>

            <Tabs defaultValue="new" onValueChange={(val) => { if (val === 'history') fetchHistory(); }}>
                <TabsList className="mb-6 bg-slate-100 dark:bg-slate-900 border-none p-1 rounded-xl">
                    <TabsTrigger value="new" className="rounded-lg px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                        Створити
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                        Історія
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="space-y-6">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Нове сповіщення
                    </CardTitle>
                    <CardDescription>
                        Це повідомлення з'явиться в розділі "Сповіщення" у кожного зареєстрованого користувача.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Заголовок</label>
                        <Input 
                            placeholder="Наприклад: Велике оновлення системи! 🚀" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-11 rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Коротке повідомлення (для списку)</label>
                        <Input 
                            placeholder="Короткий опис на 1-2 рядки..." 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="h-11 rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Повний контент (Патчноут) <span className="text-muted-foreground font-normal ml-1">(Опціонально)</span></label>
                        <RichTextEditor 
                            content={content} 
                            onChange={setContent} 
                            placeholder="Детальний опис оновлення, який відкриється при натисканні..." 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Тип сповіщення</label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Оберіть тип" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="announcement">📢 Оголошення (Виділено)</SelectItem>
                                    <SelectItem value="info">ℹ️ Інформація</SelectItem>
                                    <SelectItem value="warning">⚠️ Увага</SelectItem>
                                    <SelectItem value="success">✅ Успіх</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Посилання (необов'язково)</label>
                            <Input 
                                placeholder="/actions або https://..." 
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button 
                            onClick={handleBroadcast} 
                            disabled={isSending}
                            size="lg"
                            className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition-all shadow-lg shadow-orange-600/20"
                        >
                            {isSending ? (
                                <>
                                    <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                                    Надсилаємо...
                                </>
                            ) : (
                                <>
                                    <Megaphone className="w-4 h-4 mr-2" />
                                    Опублікувати для всіх
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Попередній перегляд (Preview)</h3>
                <div className={`p-4 rounded-2xl border-2 transition-all ${
                    type === 'announcement' 
                    ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-500/30' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}>
                    <div className="flex gap-3">
                        <div className={`p-2 rounded-full h-fit ${
                            type === 'announcement' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                            {type === 'announcement' ? <Star className="w-4 h-4 fill-current" /> : <Info className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <h4 className={`text-sm font-bold ${type === 'announcement' ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                                    {title || 'Ваш заголовок тут'}
                                </h4>
                                <span className="text-[10px] text-muted-foreground">12:00</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {message || 'Тут буде ваше повідомлення, яке побачать користувачі...'}
                            </p>
                            {content && (
                                <p className="text-[11px] font-semibold text-primary/80 mt-1 cursor-pointer hover:underline">
                                    Натисніть, щоб прочитати детальніше
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </TabsContent>

            <TabsContent value="history">
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Історія Розсилок
                        </CardTitle>
                        <CardDescription>
                            Список раніше відправлених сповіщень. Ви можете їх видалити, що прибере їх у всіх користувачів.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingHistory ? (
                            <div className="p-10 text-center text-muted-foreground flex flex-col items-center">
                                <AlertCircle className="w-6 h-6 animate-pulse mb-3" />
                                Завантаження історії...
                            </div>
                        ) : history.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground flex flex-col items-center">
                                <Info className="w-8 h-8 opacity-20 mb-3" />
                                Ще немає надісланих сповіщень
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {history.map((item, idx) => (
                                    <div key={idx} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <div className="flex gap-3 min-w-0">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 h-fit">
                                                {item.type === 'announcement' ? <Star className="w-4 h-4 text-orange-500 fill-orange-500" /> : <Info className="w-4 h-4 text-blue-500" />}
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-sm truncate">{item.title}</h4>
                                                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                                                        {item.count} користувачам
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(item.createdAt), { locale: uk, addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                                            onClick={() => handleDeleteBroadcast(item)}
                                            title="Видалити у всіх користувачів"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
        </div>
    );
}
