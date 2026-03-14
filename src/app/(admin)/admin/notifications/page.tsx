'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Megaphone, Send, AlertCircle, Info, Star } from 'lucide-react';

export default function AdminNotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('announcement');
    const [link, setLink] = useState('');
    const [isSending, setIsSending] = useState(false);

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
                body: JSON.stringify({ title, message, type, link })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Успішно надіслано ${data.count} користувачам!`);
                setTitle('');
                setMessage('');
                setLink('');
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
                        <label className="text-sm font-semibold">Повідомлення</label>
                        <Textarea 
                            placeholder="Опишіть деталі оновлення або новини..." 
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="rounded-xl resize-none"
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

            {/* Preview Card */}
            <div className="space-y-3">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
