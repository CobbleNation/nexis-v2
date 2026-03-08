'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Settings, RotateCcw, ShieldCheck, Trash2, AlertTriangle, CreditCard, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LIMITS } from '@/lib/limits';

interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: string;
    invoiceId: string | null;
    createdAt: string;
}

interface UserDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    subscriptionTier: string;
    subscriptionExpiresAt: string | null;
    emailVerified: string | null;
    createdAt: string;
    lastActive: string | null;
    avatar: string | null;
    goalsCount: number;
    habitsCount: number;

}

// Numeric limit fields with labels and plan defaults
const NUMERIC_LIMITS = [
    { key: 'maxGoals', label: 'Максимум Цілей', descFree: '3', descPro: '∞', hint: 'Скільки активних цілей користувач може створювати одночасно.' },
    { key: 'maxTasks', label: 'Макс. Активних Завдань', descFree: '10', descPro: '∞', hint: 'Глобальний ліміт завдань. Впливає на можливість створення нових тасків.' },
    { key: 'maxJournalEntries', label: 'Макс. Записів у Журнал', descFree: '20', descPro: '∞', hint: 'Загальна кількість записів у щоденнику.' },
    { key: 'maxNotes', label: 'Максимум Нотаток', descFree: '20', descPro: '∞', hint: 'Максимальна кількість текстових нотаток у базі.' },
    { key: 'maxAiHints', label: 'ШІ Підказок/день', descFree: '2', descPro: '∞', hint: 'Примусовий ліміт запитів до AI протягом дня (не рахуючи глобальних).' },
] as const;

// Boolean feature flags with labels
const BOOL_LIMITS = [
    { key: 'hasSubgoals', label: 'Підцілі', hint: 'Дозволяє дробити великі цілі на дрібні кроки.' },
    { key: 'hasAiGoalBreakdown', label: 'ШІ Розбиття Цілей', hint: 'AI-генерація стратегії та покрокового плану цілі.' },
    { key: 'hasGoalAnalytics', label: 'Аналітика Цілей', hint: 'Розширені сторінки з графіками прогресу цілі.' },
    { key: 'hasTaskPriority', label: 'Пріоритет Завдань', hint: 'Можливість виставляти High/Medium/Low пріоритет таскам.' },
    { key: 'hasRecurringTasks', label: 'Регулярні Завдання', hint: 'Завдання, які повторюються щотижня або щомісяця.' },
    { key: 'hasSmartFilters', label: 'Розумні Фільтри', hint: 'Кастомні фільтри у списках (терміновість, дедлайни).' },
    { key: 'hasAutoPlanning', label: 'Автопланування', hint: 'AI-допомога у формуванні плану на день.' },
    { key: 'hasWeeklyView', label: 'Тижневий Перегляд', hint: 'Доступ до спеціальної сторінки тижневого огляду.' },
    { key: 'hasMonthlyView', label: 'Місячний Перегляд', hint: 'Доступ до перегляду календарного місяця.' },
    { key: 'hasTags', label: 'Теги', hint: 'Створення та використання кольорових тегів для групування.' },
    { key: 'hasSearch', label: 'Пошук', hint: 'Універсальний пошук по всьому додатку (завдання, нотатки).' },
    { key: 'hasAiSummaries', label: 'ШІ Підсумки', hint: 'Багатоденні та щотижневі автоматичні AI звіти та висновки.' },
    { key: 'hasHistoryAnalytics', label: 'Аналітика Історії', hint: 'Розширена аналітика (вплив на настрій, кореляції).' },
    { key: 'hasFullAi', label: 'Повний Доступ до ШІ', hint: 'Головний перемикач, відкриває всі AI-функції, зокрема Асистента проектів і Аналіз дня.' },
    { key: 'hasVoice', label: 'Голосовий Ввід', hint: 'Можливість надиктовувати завдання та нотатки (модуль розпізнавання).' },
] as const;

type NumericLimitKey = typeof NUMERIC_LIMITS[number]['key'];
type BoolLimitKey = typeof BOOL_LIMITS[number]['key'];

// null means "use plan default"
type LimitsForm = {
    [K in NumericLimitKey]: string;  // empty string = use plan default
} & {
    [K in BoolLimitKey]: boolean | null; // null = use plan default
} & { adminNote: string };

function getDefaultLimitsForm(): LimitsForm {
    const form: any = { adminNote: '' };
    NUMERIC_LIMITS.forEach(f => { form[f.key] = ''; });
    BOOL_LIMITS.forEach(f => { form[f.key] = null; });
    return form;
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [user, setUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingLimits, setSavingLimits] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);

    const [formData, setFormData] = useState({
        role: '',
        subscriptionTier: '',
        name: '',
        subscriptionExpiresAt: ''
    });
    const [limitsForm, setLimitsForm] = useState<LimitsForm>(getDefaultLimitsForm());
    const [limitsLoading, setLimitsLoading] = useState(true);

    async function fetchPayments() {
        try {
            const res = await fetch(`/api/admin/users/${id}/payments`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
            }
        } catch (err) {
            console.error('Failed to fetch payments', err);
        } finally {
            setPaymentsLoading(false);
        }
    }

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`/api/admin/users/${id}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setUser(data.user);
                setFormData({
                    role: data.user.role,
                    subscriptionTier: data.user.subscriptionTier,
                    name: data.user.name,
                    subscriptionExpiresAt: data.user.subscriptionExpiresAt ? data.user.subscriptionExpiresAt.split('T')[0] : ''
                });
            } catch (err) {
                toast.error('Failed to load user info');
                router.push('/admin/users');
            } finally {
                setLoading(false);
            }
        }

        async function fetchLimits() {
            try {
                const res = await fetch(`/api/admin/users/${id}/limits`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.limits) {
                        const newLimits: any = { adminNote: data.limits.adminNote || '' };
                        NUMERIC_LIMITS.forEach(f => {
                            newLimits[f.key] = data.limits[f.key] === null || data.limits[f.key] === undefined ? '' : String(data.limits[f.key]);
                        });
                        BOOL_LIMITS.forEach(f => {
                            newLimits[f.key] = data.limits[f.key];
                        });
                        setLimitsForm(newLimits);
                    }
                }
            } catch (err) {
                console.error('Fetch limits error:', err);
            } finally {
                setLimitsLoading(false);
            }
        }

        fetchUser();
        fetchLimits();
        fetchPayments();
    }, [id, router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success('User updated successfully');
                const data = await res.json();
                setUser(prev => prev ? ({ ...prev, ...data.user }) : null);
            } else {
                toast.error('Failed to update user');
            }
        } catch (error) {
            toast.error('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLimits = async () => {
        setSavingLimits(true);
        try {
            // Build payload: empty string -> null for numeric, already null for booleans
            const payload: any = { adminNote: limitsForm.adminNote || null };
            NUMERIC_LIMITS.forEach(f => {
                const v = limitsForm[f.key];
                payload[f.key] = v === '' ? null : parseInt(v, 10);
            });
            BOOL_LIMITS.forEach(f => {
                payload[f.key] = limitsForm[f.key]; // null | boolean
            });

            const res = await fetch(`/api/admin/users/${id}/limits`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toast.success('Custom limits saved');
            } else {
                toast.error('Failed to save limits');
            }
        } catch {
            toast.error('Error saving limits');
        } finally {
            setSavingLimits(false);
        }
    };

    const resetLimits = () => {
        setLimitsForm(getDefaultLimitsForm());
        toast.info('Limits reset to plan defaults (not saved yet)');
    };

    const handleDeletion = async (mode: 'data' | 'account') => {
        const confirmMessage = mode === 'data'
            ? 'Ви впевнені, що хочете видалити ВСІ дані користувача? Акаунт залишиться.'
            : 'УВАГА! Ви впевнені, що хочете ПОВНІСТЮ ТА НАЗАВЖДИ видалити цей акаунт? Цю дію неможливо скасувати.';

        if (!confirm(confirmMessage)) return;

        try {
            const res = await fetch(`/api/admin/users/${id}?mode=${mode}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success(mode === 'data' ? 'Дані користувача очищено' : 'Акаунт успішно видалено');
                if (mode === 'account') {
                    router.push('/admin/users');
                } else {
                    // Refresh data
                    window.location.reload();
                }
            } else {
                const data = await res.json();
                toast.error(data.error || 'Помилка при видаленні');
            }
        } catch (error) {
            toast.error('Сталась критична помилка');
        }
    };

    const planDefaults = LIMITS[formData.subscriptionTier === 'pro' ? 'pro' : 'free'];

    // Tri-state for boolean: null = plan default, true = enabled, false = disabled
    const cycleBoolLimit = (key: BoolLimitKey) => {
        setLimitsForm(prev => {
            const current = prev[key];
            let next: boolean | null;
            if (current === null) next = true;
            else if (current === true) next = false;
            else next = null;
            return { ...prev, [key]: next };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <h2 className="text-xl font-semibold text-slate-300">Користувача не знайдено</h2>
                <Button variant="outline" onClick={() => router.push('/admin/users')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Повернутися до Користувачів
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-slate-800">
                            <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                            <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <p className="text-slate-400">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={!!user.emailVerified ? 'outline' : 'destructive'} className={!!user.emailVerified ? "border-emerald-500 text-emerald-500" : ""}>
                        {!!user.emailVerified ? 'ВЕРИФІКОВАНО' : 'НЕВЕРИФІКОВАНО'}
                    </Badge>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize px-3 py-1 text-sm">
                        {user.role}
                    </Badge>
                    <Badge variant="outline" className={`px-3 py-1 text-sm ${user.subscriptionTier === 'pro' ? 'border-orange-500 text-orange-500' : 'text-slate-400'}`}>
                        {user.subscriptionTier.toUpperCase()}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 mb-6">
                    <TabsTrigger value="details" className="data-[state=active]:bg-slate-800 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Налаштування
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="data-[state=active]:bg-slate-800 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Фінанси
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Info & Edit */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                                <CardHeader>
                                    <CardTitle>Налаштування Акаунту</CardTitle>
                                    <CardDescription>Управління профілем та доступом</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Ім'я Відображення</Label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Роль</Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                                            >
                                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                    <SelectItem value="user">Користувач</SelectItem>
                                                    <SelectItem value="manager">Менеджер</SelectItem>
                                                    <SelectItem value="admin">Адміністратор</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Рівень Підписки</Label>
                                            <Select
                                                value={formData.subscriptionTier}
                                                onValueChange={(val) => setFormData({ ...formData, subscriptionTier: val })}
                                            >
                                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                    <SelectItem value="free">Безкоштовний</SelectItem>
                                                    <SelectItem value="pro">Pro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Термін дії підписки (тільки для Pro)</Label>
                                            <Input
                                                type="date"
                                                value={formData.subscriptionExpiresAt}
                                                onChange={(e) => setFormData({ ...formData, subscriptionExpiresAt: e.target.value })}
                                                disabled={formData.subscriptionTier !== 'pro'}
                                                className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-slate-700"
                                            />
                                            <p className="text-[10px] text-slate-500">Залиште порожнім для необмеженого доступу</p>
                                        </div>
                                    </div>


                                    <Separator className="bg-slate-800" />

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Збереження...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Зберегти Зміни
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Custom Limits Card */}
                            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Settings className="h-5 w-5 text-orange-500" />
                                                Власні Ліміти
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                Перевизначте індивідуальні ліміти для цього користувача. Залиште порожнім (—), щоб використовувати стандартні для плану.
                                                Поточний план: <span className="font-semibold text-orange-400">{formData.subscriptionTier.toUpperCase()}</span>
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={resetLimits}
                                            className="text-slate-400 hover:text-slate-200 shrink-0"
                                        >
                                            <RotateCcw className="h-4 w-4 mr-1" /> Скинути всі
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {limitsLoading ? (
                                        <div className="flex justify-center py-6">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        </div>
                                    ) : (
                                        <>
                                            {/* Numeric limits */}
                                            <div>
                                                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3">Ліміти Кількісні</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {NUMERIC_LIMITS.map(field => {
                                                        const planDefault = field.key === 'maxGoals'
                                                            ? planDefaults.MAX_GOALS
                                                            : field.key === 'maxTasks'
                                                                ? planDefaults.MAX_TASKS
                                                                : field.key === 'maxJournalEntries'
                                                                    ? planDefaults.MAX_JOURNAL_ENTRIES
                                                                    : field.key === 'maxNotes'
                                                                        ? planDefaults.MAX_NOTES
                                                                        : planDefaults.MAX_AI_HINTS;
                                                        const planDefaultStr = planDefault === Infinity ? '∞' : String(planDefault);
                                                        const isOverridden = limitsForm[field.key] !== '';

                                                        return (
                                                            <div key={field.key} className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-sm font-medium text-slate-300">{field.label}</label>
                                                                    <span className="text-xs text-slate-500">
                                                                        План: <span className="font-mono">{planDefaultStr}</span>
                                                                        {isOverridden && <span className="ml-1.5 text-orange-400 font-semibold">(власний)</span>}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-500 leading-tight mb-1">{field.hint}</p>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        placeholder={`— (замість: ${planDefaultStr})`}
                                                                        value={limitsForm[field.key]}
                                                                        onChange={e => setLimitsForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                                        className={`bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 ${isOverridden ? 'border-orange-500/50' : ''}`}
                                                                    />
                                                                    {isOverridden && (
                                                                        <button
                                                                            onClick={() => setLimitsForm(prev => ({ ...prev, [field.key]: '' }))}
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                                                                            title="Скинути до ліміту плану"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-800" />

                                            {/* Boolean feature overrides */}
                                            <div>
                                                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Функціональні Дозволи</h3>
                                                <p className="text-xs text-slate-600 mb-3">Клікніть для зміни: <span className="text-slate-400">— (план)</span> → <span className="text-emerald-500">✓ Дозволено</span> → <span className="text-rose-500">✗ Заборонено</span></p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {BOOL_LIMITS.map(field => {
                                                        const featureKey = ('HAS_' + field.key.replace('has', '').replace(/([A-Z])/g, '_$1').toUpperCase()).replace('HAS__', 'HAS_') as keyof typeof planDefaults;
                                                        const planDefault = planDefaults[featureKey];
                                                        const value = limitsForm[field.key];
                                                        const isOverridden = value !== null;

                                                        const stateColors = isOverridden
                                                            ? value
                                                                ? { bg: 'bg-emerald-950/30', border: 'border-emerald-600/50', text: 'text-emerald-400' }
                                                                : { bg: 'bg-rose-950/30', border: 'border-rose-600/50', text: 'text-rose-400' }
                                                            : { bg: 'bg-slate-950/50 hover:bg-slate-800/50', border: 'border-slate-800', text: 'text-slate-200' };

                                                        return (
                                                            <div
                                                                key={field.key}
                                                                onClick={() => cycleBoolLimit(field.key)}
                                                                className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer select-none transition-colors ${stateColors.bg} ${stateColors.border}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-sm font-medium ${stateColors.text}`}>
                                                                        {field.label}
                                                                    </span>
                                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-950/50">
                                                                        {value === null ? '— План' : value ? '✓ Дозволено' : '✗ Заборонено'}
                                                                    </span>
                                                                </div>
                                                                <p className={`text-[10px] leading-tight ${stateColors.text} opacity-70`}>{field.hint}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <Separator className="bg-slate-800" />

                                            {/* Admin note */}
                                            <div className="space-y-2">
                                                <Label className="text-slate-400">Нотатка Адміністратора (причина)</Label>
                                                <Textarea
                                                    placeholder="напр., Бета тестер, угода партнера, промо доступ..."
                                                    value={limitsForm.adminNote}
                                                    onChange={e => setLimitsForm(prev => ({ ...prev, adminNote: e.target.value }))}
                                                    className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 resize-none h-20"
                                                />
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-600 flex items-center gap-1">
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                    Зміни логуються
                                                </p>
                                                <Button
                                                    onClick={handleSaveLimits}
                                                    disabled={savingLimits}
                                                    className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                                                >
                                                    {savingLimits ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Збереження...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Зберегти Ліміти
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Danger Zone */}
                            <Card className="bg-slate-950 border-rose-900/30 text-slate-100 overflow-hidden">
                                <div className="bg-rose-500/10 px-6 py-3 border-b border-rose-900/30 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500">Небезпечна Зона</h3>
                                </div>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-rose-900/20 rounded-xl bg-slate-900/50">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-200">Видалити всі дані користувача</h4>
                                            <p className="text-xs text-slate-500 max-w-md">
                                                Це очистить всі цілі, проекти, нотатки та іншу активність користувача.
                                                Акаунт та налаштування підписки залишаться. <span className="text-rose-400 font-semibold">Ця дія незворотна.</span>
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="border-rose-900/50 hover:bg-rose-900/20 text-rose-400 hover:text-rose-300 shrink-0"
                                            onClick={() => handleDeletion('data')}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" /> Очистити Дані
                                        </Button>
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-rose-900/30 rounded-xl bg-rose-950/20">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-rose-400">Видалити акаунт назавжди</h4>
                                            <p className="text-xs text-rose-500/70 max-w-md">
                                                Повне видалення профілю користувача та всіх пов'язаних даних.
                                                Користувач втратить доступ до системи негайно. <span className="text-rose-500 font-bold italic underline">Відновити неможливо.</span>
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            className="bg-rose-700 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/50 shrink-0"
                                            onClick={() => handleDeletion('account')}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Видалити Акаунт
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                                <CardHeader>
                                    <CardTitle>Статистика Активності</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                                            <h4 className="text-2xl font-bold text-orange-500">{user.goalsCount}</h4>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Цілі</p>
                                        </div>
                                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                                            <h4 className="text-2xl font-bold text-blue-500">{user.habitsCount}</h4>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Звички</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900 border-slate-800 text-slate-100">
                                <CardHeader>
                                    <CardTitle>Метадані</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-400">ID Користувача</h4>
                                        <p className="text-xs font-mono text-slate-300 mt-1 break-all bg-slate-950 p-2 rounded border border-slate-800">{user.id}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-400">Дата Реєстрації</h4>
                                        <p className="text-sm text-slate-300 mt-1">
                                            {format(new Date(user.createdAt), 'PPpp')}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-400">Остання Активність</h4>
                                        <p className="text-sm text-slate-300 mt-1">
                                            {user.lastActive ? format(new Date(user.lastActive), 'PPpp') : 'Ніколи'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="finance">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-emerald-500" />
                                Історія Платежів
                            </CardTitle>
                            <CardDescription>Список транзакцій користувача</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {paymentsLoading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                                    <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    Платежів не знайдено
                                </div>
                            ) : (
                                <div className="rounded-md border border-slate-800 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Дата</th>
                                                <th className="px-4 py-3 text-left">Сума</th>
                                                <th className="px-4 py-3 text-left">Статус</th>
                                                <th className="px-4 py-3 text-left">ID Інвойсу</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {payments.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-800/30">
                                                    <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                                                        {format(new Date(p.createdAt), 'MMM d, yyyy HH:mm')}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        {(p.amount / 100).toFixed(2)} {p.currency}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                p.status === 'success' ? 'border-emerald-500 text-emerald-500' :
                                                                    p.status === 'failure' ? 'border-rose-500 text-rose-500' :
                                                                        'border-orange-500 text-orange-500'
                                                            }
                                                        >
                                                            {p.status.toUpperCase()}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                        {p.invoiceId || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
