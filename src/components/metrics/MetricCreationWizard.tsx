'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/lib/store';
import {
    ChevronRight, ChevronLeft, Loader2,
    Hash, Scale, ToggleLeft, List,
    TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { MetricDefinition } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MetricCreationWizardProps {
    initialTitle?: string;
    initialAreaId?: string;
    initialUnit?: string;
    initialTarget?: number;
    initialDirection?: 'increase' | 'decrease' | 'neutral';
    onComplete: (metricId?: string) => void;
    onCancel: () => void;
}

// --- CONFIGURATION ---

const VALUE_TYPES = [
    { id: 'numeric', label: 'Numeric', icon: Hash, desc: 'Countable numbers' },
    { id: 'scale', label: 'Scale', icon: Scale, desc: 'Range (e.g., 1-10)' },
    { id: 'boolean', label: 'Boolean', icon: ToggleLeft, desc: 'Yes / No' },
    { id: 'enum', label: 'Status', icon: List, desc: 'Select from list' },
] as const;

const UNIT_GROUPS = [
    {
        label: 'Валюта (Currency)',
        units: ['₴', '$', '€', '£', 'PLN', 'у.о.']
    },
    {
        label: 'Час (Time)',
        units: ['хв', 'год', 'дні', 'тижні', 'місяці', 'роки']
    },
    {
        label: 'Фізичні (Physics)',
        units: ['кг', 'г', 'км', 'м', 'кроки', 'л', 'мл']
    },
    {
        label: 'Кількість (Count)',
        units: ['раз', 'од', 'сесії', 'події', 'сторінки']
    },
    {
        label: 'Відсотки (Percent)',
        units: ['%', 'частка']
    },
    {
        label: 'Здоровʼя (Health)',
        units: ['bpm', 'ккал', 'годин сну']
    },
    {
        label: 'Інше (Other)',
        units: ['бали', 'rating']
    }
];

// --- COMPONENT ---

export function MetricCreationWizard({ initialTitle, initialAreaId, initialUnit, initialTarget, initialDirection, onComplete, onCancel }: MetricCreationWizardProps) {
    const { state, dispatch } = useData();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // --- FORM STATE ---
    const [name, setName] = useState(initialTitle || '');
    const [areaId, setAreaId] = useState(initialAreaId || '');
    const [frequency, setFrequency] = useState('daily');

    // Config
    const [valueType, setValueType] = useState<MetricDefinition['valueType']>('numeric');
    const [unit, setUnit] = useState(initialUnit || '');
    const [direction, setDirection] = useState<MetricDefinition['direction']>(initialDirection || 'increase');

    // Details
    const [baseline, setBaseline] = useState<string>('');
    const [target, setTarget] = useState<string>(initialTarget?.toString() || '');
    const [description, setDescription] = useState('');

    const handleNext = () => {
        if (step === 1) {
            if (!name.trim()) { toast.error("Введіть назву метрики"); return; }
            if (!areaId) { toast.error("Оберіть сферу"); return; }
        }
        if (step === 2) {
            if (valueType !== 'boolean' && valueType !== 'enum' && !unit.trim()) {
                toast.error("Вкажіть одиницю вимірювання (або оберіть 'без одиниці')");
                return;
            }
        }
        setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const newMetricId = uuidv4();
            const newMetric: MetricDefinition = {
                id: newMetricId,
                userId: 'current',
                areaId,
                name,
                valueType,
                type: valueType === 'numeric' ? 'number' : valueType === 'scale' ? 'scale' : 'boolean', // Legacy mapping
                unit: valueType === 'boolean' || valueType === 'enum' ? undefined : unit,
                direction,
                frequency,
                baseline: baseline ? Number(baseline) : undefined,
                target: target ? Number(target) : undefined,
                description,
                createdAt: new Date()
            };

            dispatch({ type: 'ADD_METRIC_DEF', payload: newMetric });
            toast.success("Метрику успішно створено!");
            onComplete(newMetricId);
        } catch (e) {
            console.error(e);
            toast.error("Помилка створення метрики");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">
            {/* Header */}
            <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm px-8 py-5 border-b border-slate-100 dark:border-border flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground">Нова Метрика</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">Крок {step} з 3</p>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={cn("h-1.5 w-8 rounded-full transition-all duration-500", i <= step ? "bg-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-none" : "bg-slate-200 dark:bg-secondary")} />
                    ))}
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto min-h-0 max-w-2xl mx-auto w-full">

                {/* STEP 1: BASIC INFO */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="space-y-4">
                            <Label className="text-base">1. Назва Метрики</Label>
                            <Input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Напр. Вага, Годин сну, Виручка..."
                                className="h-12 text-lg font-semibold bg-white dark:bg-secondary/20 shadow-sm dark:text-foreground border-slate-200 dark:border-border"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Сфера</Label>
                                <Select value={areaId} onValueChange={setAreaId}>
                                    <SelectTrigger className="h-11 bg-white dark:bg-secondary/20 shadow-sm dark:text-foreground border-slate-200 dark:border-border"><SelectValue placeholder="Оберіть..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">📥 Вхідні (General)</SelectItem>
                                        {state.areas.map(a => (
                                            <SelectItem key={a.id} value={a.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", a.color)} /> {a.title}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Частота оновлення</Label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger className="h-11 bg-white dark:bg-secondary/20 shadow-sm dark:text-foreground border-slate-200 dark:border-border"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Щодня</SelectItem>
                                        <SelectItem value="weekly">Щотижня</SelectItem>
                                        <SelectItem value="monthly">Щомісяця</SelectItem>
                                        <SelectItem value="manual">За потреби (Вручну)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: CONFIGURATION */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">

                        {/* Value Type */}
                        <div className="space-y-3">
                            <Label className="text-base block">2. Тип Значення</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {VALUE_TYPES.map(vt => (
                                    <div
                                        key={vt.id}
                                        onClick={() => setValueType(vt.id as any)}
                                        className={cn(
                                            "cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 hover:bg-slate-50 dark:hover:bg-secondary/30",
                                            valueType === vt.id ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500" : "border-slate-100 dark:border-border bg-white dark:bg-card"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-full", valueType === vt.id ? "bg-white dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-sm" : "bg-slate-100 dark:bg-secondary text-slate-400 dark:text-muted-foreground")}>
                                            <vt.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={cn("font-bold text-sm", valueType === vt.id ? "text-indigo-900 dark:text-indigo-200" : "text-slate-700 dark:text-foreground")}>{vt.label}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium leading-tight mt-0.5">{vt.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Unit Selector (Hidden for Boolean/Enum) */}
                        {(valueType === 'numeric' || valueType === 'scale') && (
                            <div className="space-y-3">
                                <Label className="text-base block">Одиниця вимірювання</Label>
                                <div className="bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-border shadow-sm space-y-4">
                                    <Input
                                        value={unit}
                                        onChange={e => setUnit(e.target.value)}
                                        placeholder="Введіть свою або оберіть нижче (кг, %, хв)..."
                                        className="h-10 text-sm font-medium border-slate-200 dark:border-border bg-slate-50 dark:bg-secondary/20 focus:bg-white dark:focus:bg-secondary/40 transition-colors"
                                    />

                                    <div className="space-y-4">
                                        {UNIT_GROUPS.map(group => (
                                            <div key={group.label} className="space-y-1.5">
                                                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">{group.label}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.units.map(u => (
                                                        <button
                                                            key={u}
                                                            onClick={() => setUnit(u)}
                                                            className={cn(
                                                                "px-2.5 py-1 text-xs font-semibold rounded-md border transition-all",
                                                                unit === u
                                                                    ? "bg-slate-900 dark:bg-primary text-white dark:text-primary-foreground border-slate-900 dark:border-primary shadow-md transform scale-105"
                                                                    : "bg-white dark:bg-secondary/20 text-slate-600 dark:text-muted-foreground border-slate-200 dark:border-border hover:border-slate-300 dark:hover:border-border/80 hover:bg-slate-50 dark:hover:bg-secondary/40"
                                                            )}
                                                        >
                                                            {u}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Direction */}
                        <div className="space-y-3">
                            <Label className="text-base block">Напрямок Зміни</Label>
                            <p className="text-xs text-muted-foreground -mt-2 mb-2">Що вважається "успіхом"?</p>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setDirection('increase')}
                                    className={cn("p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all", direction === 'increase' ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400" : "border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-secondary/20 dark:text-muted-foreground")}
                                >
                                    <TrendingUp className="w-5 h-5" />
                                    <span className="text-xs font-bold">Більше = Краще</span>
                                </button>
                                <button
                                    onClick={() => setDirection('decrease')}
                                    className={cn("p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all", direction === 'decrease' ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : "border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-secondary/20 dark:text-muted-foreground")}
                                >
                                    <TrendingDown className="w-5 h-5" />
                                    <span className="text-xs font-bold">Менше = Краще</span>
                                </button>
                                <button
                                    onClick={() => setDirection('neutral')}
                                    className={cn("p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all", direction === 'neutral' ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" : "border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-secondary/20 dark:text-muted-foreground")}
                                >
                                    <Minus className="w-5 h-5" />
                                    <span className="text-xs font-bold">Нейтрально</span>
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* STEP 3: DETAILS */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-slate-100 dark:border-border shadow-sm space-y-4">
                            <Label className="text-base">Цільові показники (Опціонально)</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-slate-400">Початкове (Baseline)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={baseline}
                                        onChange={e => setBaseline(e.target.value)}
                                        className="bg-slate-50 dark:bg-secondary/20 dark:text-foreground font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-slate-400">Цільове (Target)</Label>
                                    <Input
                                        type="number"
                                        placeholder="100"
                                        value={target}
                                        onChange={e => setTarget(e.target.value)}
                                        className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Опис / Контекст</Label>
                            <Textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Для чого ця метрика? Як її вимірювати?"
                                className="min-h-[100px] bg-white dark:bg-card dark:text-foreground resize-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-border p-5 bg-white dark:bg-card flex justify-between shrink-0 items-center z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                {step === 1 ? (
                    <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-red-600 dark:text-muted-foreground dark:hover:text-red-400">Скасувати</Button>
                ) : (
                    <Button variant="ghost" onClick={handleBack} className="dark:text-muted-foreground dark:hover:text-foreground"><ChevronLeft className="w-4 h-4 mr-1" /> Назад</Button>
                )}

                {step < 3 ? (
                    <Button onClick={handleNext} className="bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground hover:bg-slate-800 dark:hover:bg-primary/90 min-w-[100px]">Далі <ChevronRight className="w-4 h-4 ml-1" /></Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 min-w-[140px]"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Створити
                    </Button>
                )}
            </div>

        </div>
    );
}
