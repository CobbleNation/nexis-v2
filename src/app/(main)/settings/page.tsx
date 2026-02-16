'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { User, Bell, Palette, Trash2, LogOut, Save, Moon, Sun, Smartphone, Upload, Shield, AlertTriangle, ShieldAlert, BarChart, CreditCard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useData } from '@/lib/store';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, updateProfile, deleteAccount, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { state, dispatch } = useData();
    const { notificationSettings } = state;
    const { startOnboarding } = useOnboarding();
    const router = useRouter();

    // Local state for profile form
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state with user data on load
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || user.name?.split(' ')[0] || '');
            setLastName(user.lastName || user.name?.split(' ')[1] || '');
            setBio(user.bio || '');
            setAvatarUrl(user.avatar || '');
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                firstName,
                lastName,
                bio,
                avatar: avatarUrl
            });
            toast.success("Зміни успішно збережено");
        } catch (e) {
            toast.error("Не вдалося зберегти зміни");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetData = async () => {
        if (confirm('УВАГА: Це видалить ВСІ ваші цілі, завдання, нотатки та інші дані. Акаунт залишиться, але він буде пустим. Цю дію НЕМОЖЛИВО скасувати. Ви впевнені?')) {
            const toastId = toast.loading('Скидання даних...');
            try {
                const res = await fetch('/api/auth/reset-data', { method: 'POST' });
                if (!res.ok) throw new Error('Помилка скидання');

                toast.success('Акаунт успішно очищено', { id: toastId });
                localStorage.removeItem('nexis-data');
                // Reload to refresh state
                window.location.reload();
            } catch (e) {
                toast.error('Не вдалося скинути дані', { id: toastId });
            }
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            const toastId = toast.loading('Завантаження аватару...');

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Upload failed');

                const data = await res.json();
                setAvatarUrl(data.url);

                // Immediately update profile to persist change
                await updateProfile({ avatar: data.url });

                toast.success('Аватар оновлено', { id: toastId });
            } catch (error) {
                console.error(error);
                toast.error('Не вдалося завантажити фото', { id: toastId });
            }
        }
    }

    if (!user) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Налаштування</h2>
                <p className="text-muted-foreground">Керуйте своїм профілем та налаштуваннями.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 shrink-0">
                        <TabsList className="flex flex-col h-auto bg-transparent space-y-2 p-0 justify-start w-full">
                            <TabsTrigger value="profile" className="w-full justify-start px-4 py-3 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/20 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400 !shadow-none rounded-xl font-bold transition-all hover:bg-muted">
                                <User className="mr-3 h-4 w-4" /> Профіль
                            </TabsTrigger>
                            <TabsTrigger value="appearance" className="w-full justify-start px-4 py-3 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/20 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400 !shadow-none rounded-xl font-bold transition-all hover:bg-muted">
                                <Palette className="mr-3 h-4 w-4" /> Вигляд
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="w-full justify-start px-4 py-3 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/20 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400 !shadow-none rounded-xl font-bold transition-all hover:bg-muted">
                                <Bell className="mr-3 h-4 w-4" /> Сповіщення
                            </TabsTrigger>
                            <TabsTrigger value="subscription" className="w-full justify-start px-4 py-3 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/20 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400 !shadow-none rounded-xl font-bold transition-all hover:bg-muted">
                                <CreditCard className="mr-3 h-4 w-4" /> Підписка
                            </TabsTrigger>
                            <TabsTrigger value="data" className="w-full justify-start px-4 py-3 data-[state=active]:bg-rose-50 dark:data-[state=active]:bg-rose-950/20 data-[state=active]:text-rose-700 dark:data-[state=active]:text-rose-400 !shadow-none rounded-xl font-bold transition-all text-destructive/70 hover:text-destructive hover:bg-rose-50/50">
                                <Trash2 className="mr-3 h-4 w-4" /> Дані та Акаунт
                            </TabsTrigger>
                            <div className="pt-4 mt-4 border-t border-border w-full">
                                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => logout()}>
                                    <LogOut className="mr-3 h-4 w-4" /> Вийти
                                </Button>
                            </div>
                        </TabsList>
                    </aside>

                    <div className="flex-1 min-w-0">
                        <TabsContent value="profile" className="space-y-6 mt-0">
                            <Card className="border-none shadow-sm bg-card rounded-3xl">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Інформація профілю</CardTitle>
                                            <CardDescription>Оновіть своє фото та особисті дані.</CardDescription>
                                        </div>
                                        <div className={cn(
                                            "uppercase text-xs font-bold px-3 py-1 rounded-full border tracking-wide",
                                            user.subscriptionTier === 'pro'
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800"
                                                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        )}>
                                            {user.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="flex items-center gap-6">
                                        <Avatar className="h-24 w-24 border-4 border-card shadow-sm ring-1 ring-border">
                                            <AvatarImage src={avatarUrl} className="object-cover" />
                                            <AvatarFallback className="text-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                                                {user.name?.substring(0, 2).toUpperCase() || 'Я'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                                                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors shadow-sm text-sm font-semibold text-foreground">
                                                    <Upload className="w-4 h-4" /> Змінити аватар
                                                </div>
                                                <Input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-2 ml-1">Підтримується JPG, PNG до 2MB</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Ім&apos;я</Label>
                                            <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-xl bg-muted/50 dark:bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-primary text-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Прізвище</Label>
                                            <Input value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-xl bg-muted/50 dark:bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-primary text-foreground" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Електронна пошта</Label>
                                        <Input value={user.email} disabled className="rounded-xl bg-muted/30 border-none text-muted-foreground" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Про себе</Label>
                                        <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Продуктивна людина." className="rounded-xl bg-muted/50 dark:bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-primary text-foreground" />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end pt-2 pb-6 px-6">
                                    <Button onClick={handleSaveProfile} disabled={isSaving} className="rounded-full shadow-lg shadow-orange-500/20 dark:shadow-none bg-orange-600 hover:bg-orange-700 px-8 text-white">
                                        {isSaving ? 'Збереження...' : 'Зберегти зміни'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="appearance" className="space-y-6 mt-0">
                            <Card className="border-none shadow-sm bg-white dark:bg-card rounded-3xl">
                                <CardHeader>
                                    <CardTitle>Зовнішній вигляд</CardTitle>
                                    <CardDescription>Налаштуйте, як виглядає Nexis.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <Label>Тема інтерфейсу</Label>
                                        <div className="grid grid-cols-3 gap-6">
                                            <button
                                                onClick={() => setTheme('light')}
                                                className={cn(
                                                    "border-2 rounded-2xl p-3 space-y-3 cursor-pointer shadow-sm transition-all bg-white dark:bg-secondary hover:scale-[1.02]",
                                                    theme === 'light' ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-foreground/20"
                                                )}
                                            >
                                                <div className="h-24 bg-slate-100 dark:bg-white rounded-xl flex items-center justify-center">
                                                    <Sun className="w-8 h-8 text-slate-500" />
                                                </div>
                                                <div className="text-center font-bold text-sm text-foreground">Світла</div>
                                            </button>
                                            <button
                                                onClick={() => setTheme('dark')}
                                                className={cn(
                                                    "border-2 rounded-2xl p-3 space-y-3 cursor-pointer shadow-sm transition-all bg-slate-950 hover:scale-[1.02]",
                                                    theme === 'dark' ? "border-primary ring-4 ring-primary/10" : "border-slate-800 hover:border-slate-700"
                                                )}
                                            >
                                                <div className="h-24 bg-slate-900 rounded-xl flex items-center justify-center">
                                                    <Moon className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <div className="text-center font-bold text-sm text-white">Темна</div>
                                            </button>
                                            <button
                                                onClick={() => setTheme('system')}
                                                className={cn(
                                                    "border-2 rounded-2xl p-3 space-y-3 cursor-pointer shadow-sm transition-all bg-white dark:bg-slate-900 hover:scale-[1.02]",
                                                    theme === 'system' ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-foreground/20"
                                                )}
                                            >
                                                <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center">
                                                    <Smartphone className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <div className="text-center font-bold text-sm text-foreground">Системна</div>
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="space-y-6 mt-0">
                            <Card className="border-none shadow-sm bg-white dark:bg-card rounded-3xl">
                                <CardHeader>
                                    <CardTitle>Сповіщення</CardTitle>
                                    <CardDescription>Налаштуйте, як і коли ви хочете отримувати сповіщення.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Увімкнути сповіщення</Label>
                                            <p className="text-xs text-muted-foreground">Призупинити всі сповіщення без втрати налаштувань.</p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.enabled}
                                            onCheckedChange={(checked) => dispatch({ type: 'UPDATE_SETTINGS', payload: { enabled: checked } })}
                                        />
                                    </div>
                                    <div className="border-t border-border" />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Звукові ефекти</Label>
                                                <p className="text-xs text-muted-foreground">Відтворювати звук при завершенні завдання або таймера.</p>
                                            </div>
                                            <Switch
                                                disabled={!notificationSettings.enabled}
                                                checked={notificationSettings.sound}
                                                onCheckedChange={(checked) => dispatch({ type: 'UPDATE_SETTINGS', payload: { sound: checked } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Нагадування про події</Label>
                                                <p className="text-xs text-muted-foreground">Повідомляти за 15 хвилин до початку події.</p>
                                            </div>
                                            <Switch
                                                disabled={!notificationSettings.enabled}
                                                checked={notificationSettings.reminders}
                                                onCheckedChange={(checked) => dispatch({ type: 'UPDATE_SETTINGS', payload: { reminders: checked } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Щоденний дайджест</Label>
                                                <p className="text-xs text-muted-foreground">Отримувати підсумок дня на пошту.</p>
                                            </div>
                                            <Switch
                                                disabled={!notificationSettings.enabled}
                                                checked={notificationSettings.email}
                                                onCheckedChange={(checked) => dispatch({ type: 'UPDATE_SETTINGS', payload: { email: checked } })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Push-сповіщення</Label>
                                                <p className="text-xs text-muted-foreground">Отримувати сповіщення браузера про важливі події.</p>
                                            </div>
                                            <Switch
                                                disabled={!notificationSettings.enabled}
                                                checked={notificationSettings.push}
                                                onCheckedChange={(checked) => dispatch({ type: 'UPDATE_SETTINGS', payload: { push: checked } })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="subscription" className="space-y-6 mt-0">
                            <Card className="border-none shadow-sm bg-white dark:bg-card rounded-3xl overflow-hidden">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>Підписка</CardTitle>
                                            <CardDescription>Керуйте своїм планом та платіжними даними.</CardDescription>
                                        </div>
                                        <div className={cn(
                                            "uppercase text-xs font-bold px-3 py-1 rounded-full border tracking-wide",
                                            user.subscriptionTier === 'pro'
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800"
                                                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                        )}>
                                            {user.subscriptionTier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {user.subscriptionTier === 'pro' ? (
                                        <>
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="p-5 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                            <CreditCard className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm">
                                                                {user.cardLast4 ? `Monobank ending in ${user.cardLast4}` : 'Card linked'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {user.cardToken ? 'Active for billing' : 'No active card'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => router.push('/payment')}>
                                                        Оновити метод оплати
                                                    </Button>
                                                </div>

                                                <div className="p-5 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-center">
                                                    <div className="text-sm font-medium text-muted-foreground">Наступне списання</div>
                                                    <div className="text-2xl font-bold text-foreground">₴199.00</div>
                                                    <div className="text-xs text-muted-foreground">14 Лютого 2026</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-5 border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 rounded-xl">
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-rose-800 dark:text-rose-400 text-sm">Скасувати підписку</h4>
                                                    <p className="text-xs text-rose-700/70 dark:text-rose-400/70 leading-relaxed max-w-sm">
                                                        Ви втратите доступ до Pro функцій в кінці поточного періоду.
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={isSaving}
                                                    onClick={async () => {
                                                        if (confirm('Ви впевнені, що хочете скасувати підписку?')) {
                                                            setIsSaving(true);
                                                            try {
                                                                const res = await fetch('/api/billing/cancel', { method: 'POST' });
                                                                if (!res.ok) throw new Error('Failed');
                                                                toast.success('Підписку скасовано. Ви переведені на Free план.');
                                                                setTimeout(() => window.location.reload(), 1500);
                                                            } catch (e) {
                                                                toast.error('Не вдалося скасувати підписку');
                                                                setIsSaving(false);
                                                            }
                                                        }
                                                    }}
                                                    className="rounded-full shadow-lg shadow-rose-500/20 px-6 font-bold"
                                                >
                                                    {isSaving ? 'Обробка...' : 'Скасувати'}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12 space-y-6">
                                            <div className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                                                <Shield className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="max-w-md mx-auto space-y-2">
                                                <h3 className="text-xl font-bold">Отримайте більше з Pro</h3>
                                                <p className="text-muted-foreground text-sm">
                                                    Розблокуйте просунуту аналітику, необмежені звички та AI-інсайти.
                                                </p>
                                            </div>
                                            <Button className="rounded-full px-8 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-lg shadow-orange-500/20" asChild>
                                                <a href="/pricing">Перейти на Pro</a>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="data" className="space-y-6 mt-0">
                            <Card className="border-none shadow-sm bg-white dark:bg-card rounded-3xl overflow-hidden">
                                <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 pb-6">
                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                                        <Shield className="w-5 h-5" />
                                        <span className="font-bold uppercase tracking-wider text-xs">Небезпечна зона</span>
                                    </div>
                                    <CardTitle>Керування даними</CardTitle>
                                    <CardDescription>Керуйте даними свого акаунту обережно.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-8">
                                    <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-orange-50/30 dark:bg-orange-950/10">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground text-sm">Скинути акаунт</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                                                Видаляє <strong>всі створені вами дані</strong> (цілі, задачі, нотатки), але залишає сам акаунт. Ви почнете з чистого листа.
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleResetData} className="hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200 dark:hover:bg-orange-950/30 dark:hover:text-orange-400 border-border font-medium text-foreground">Скинути дані</Button>
                                    </div>

                                    <div className="flex items-center justify-between p-5 border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/10 rounded-xl">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-rose-800 dark:text-rose-400 text-sm">Видалити акаунт</h4>
                                            <p className="text-xs text-rose-700/70 dark:text-rose-400/70 leading-relaxed max-w-sm">
                                                Назавжди видаляє ваш акаунт та всі <strong>синхронізовані дані</strong>. Цю дію неможливо скасувати.
                                            </p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={deleteAccount} className="rounded-full shadow-lg shadow-rose-500/20 px-6 font-bold">Видалити акаунт</Button>
                                    </div>

                                    <div className="flex items-center justify-between p-5 border border-border rounded-xl bg-orange-50/30 dark:bg-orange-950/10">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                <h4 className="font-bold text-foreground text-sm">Перезапустити туторіал</h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                                                Пройти навчання з початку, щоб згадати всі функції Nexis.
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={startOnboarding}
                                            className="hover:bg-orange-100 hover:text-orange-700 hover:border-orange-200 dark:hover:bg-orange-950/30 dark:hover:text-orange-400 border-border font-medium text-foreground"
                                        >
                                            Запустити
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
