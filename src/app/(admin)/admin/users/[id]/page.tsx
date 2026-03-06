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
import { ArrowLeft, Save, Loader2, Settings, RotateCcw, ShieldCheck } from 'lucide-react';
import { LIMITS } from '@/lib/limits';

interface UserDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    subscriptionTier: string;
    createdAt: string;
    lastActive: string | null;
    avatar: string | null;
    goalsCount: number;
    habitsCount: number;
    onboardingCompleted: boolean;
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
    const [formData, setFormData] = useState({
        role: '',
        subscriptionTier: '',
        name: '',
        onboardingCompleted: false
    });
    const [limitsForm, setLimitsForm] = useState<LimitsForm>(getDefaultLimitsForm());
    const [limitsLoading, setLimitsLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`/api/admin/users/${id}`);
                if (!res.ok) throw new Error('User not found');
                const data = await res.json();
                setUser(data.user);
                setFormData({
                    role: data.user.role,
                    subscriptionTier: data.user.subscriptionTier,
                    name: data.user.name,
                    onboardingCompleted: data.user.onboardingCompleted
                });
            } catch (error) {
                toast.error('Failed to load user');
            } finally {
                setLoading(false);
            }
        }

        async function fetchLimits() {
            try {
                const res = await fetch(`/api/admin/users/${id}/limits`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.limits) {
                    const form = getDefaultLimitsForm();
                    NUMERIC_LIMITS.forEach(f => {
                        const val = data.limits[f.key];
                        form[f.key] = val !== null && val !== undefined ? String(val) : '';
                    });
                    BOOL_LIMITS.forEach(f => {
                        const val = data.limits[f.key];
                        form[f.key] = val !== null && val !== undefined ? Boolean(val) : null;
                    });
                    form.adminNote = data.limits.adminNote || '';
                    setLimitsForm(form);
                }
            } catch {
                // No custom limits yet - use defaults
            } finally {
                setLimitsLoading(false);
            }
        }

        fetchUser();
        fetchLimits();
    }, [id]);

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
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize px-3 py-1 text-sm">
                        {user.role}
                    </Badge>
                    <Badge variant="outline" className={`px-3 py-1 text-sm ${user.subscriptionTier === 'pro' ? 'border-orange-500 text-orange-500' : 'text-slate-400'}`}>
                        {user.subscriptionTier.toUpperCase()}
                    </Badge>
                </div>
            </div>

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
                            </div>

                            <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950/50">
                                <div>
                                    <Label className="text-base">Онбординг Завершено</Label>
                                    <p className="text-sm text-slate-500">
                                        Перевизначити статус онбордингу
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.onboardingCompleted}
                                    onCheckedChange={(checked) => setFormData({ ...formData, onboardingCompleted: checked })}
                                />
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
                                                const planDefaultStr = planDefault ? 'Доступно' : 'Недоступно';

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
        </div >
    );
}
