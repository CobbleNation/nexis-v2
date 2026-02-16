'use client';

import { useState } from 'react';
import { useData } from '@/lib/store';
import { Routine, Action } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Play, Settings, MoreHorizontal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isSameDay, parseISO } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ItemEditDialog } from '@/components/shared/ItemEditDialog';

export function RoutinesView() {
    const { state, dispatch } = useData();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const startRoutine = (routine: Routine) => {
        // Create an instance for today
        const newTask: Action = {
            id: uuidv4(),
            userId: 'current',
            title: routine.title,
            type: 'routine_instance',
            fromRoutineId: routine.id,
            areaId: routine.areaId,
            status: 'pending',
            completed: false,
            date: new Date().toISOString().split('T')[0], // Today's task
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        dispatch({ type: 'ADD_ACTION', payload: newTask });

        // Update routine stats (optional: update lastGeneratedDate)
        dispatch({
            type: 'UPDATE_ROUTINE',
            payload: { ...routine, lastGeneratedDate: new Date().toISOString() }
        });

        toast.success(`Розпочато: ${routine.title}`);
    };

    return (
        <div className="space-y-8 w-full h-full p-4 md:p-8">
            <div className="flex items-center justify-between py-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-foreground">
                        <RefreshCw className="w-6 h-6 text-orange-500" />
                        Рутина
                    </h2>
                    <p className="text-muted-foreground text-sm">Шаблони дій, які ви виконуєте регулярно.</p>
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.routines.map(routine => {
                    const area = state.areas.find(a => a.id === routine.areaId);
                    const isExecutedToday = routine.lastGeneratedDate && isSameDay(parseISO(routine.lastGeneratedDate), new Date());

                    return (
                        <motion.div
                            key={routine.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-card p-5 rounded-2xl border border-slate-100 dark:border-border shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-[180px]"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    {area ? (
                                        <Badge variant="outline" className={cn("text-xs font-medium border-0", area.color.replace('bg-', 'bg-').replace('500', '100'), area.color.replace('bg-', 'text-').replace('500', '700'))}>
                                            {area.title}
                                        </Badge>
                                    ) : <Badge variant="secondary" className="dark:bg-secondary dark:text-muted-foreground">Загальне</Badge>}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-slate-300 dark:text-muted-foreground/50 hover:text-slate-600 dark:hover:text-foreground">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="dark:bg-card">
                                            <DropdownMenuItem onClick={() => { setEditTarget(routine.id); setIsEditOpen(true); }}>
                                                Редагувати
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setEditTarget(routine.id); setIsEditOpen(true); }} className="text-rose-600 focus:text-rose-700">
                                                Видалити
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-foreground leading-snug">{routine.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">{routine.frequency === 'manual' ? 'Вручну (за потреби)' : routine.frequency}</p>
                            </div>

                            {isExecutedToday ? (
                                <Button
                                    disabled
                                    className="w-full mt-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 opacity-100 disabled:opacity-100"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Виконано сьогодні
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => startRoutine(routine)}
                                    className="w-full mt-4 bg-slate-900 dark:bg-primary text-white hover:bg-slate-800 dark:hover:bg-primary/90 rounded-xl shadow-md dark:shadow-none transition-all active:scale-95"
                                >
                                    <Play className="w-4 h-4 mr-2" /> Виконати сьогодні
                                </Button>
                            )}
                        </motion.div>
                    );
                })}

                <ItemEditDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    itemId={editTarget}
                    type="routine"
                />

                {state.routines.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50/50 dark:bg-card/50 rounded-3xl border border-dashed border-slate-200 dark:border-border">
                        <RefreshCw className="w-10 h-10 mx-auto opacity-20 mb-3" />
                        <p>Ще немає рутин. Створіть першу!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function CreateRoutineForm({ onClose }: { onClose: () => void }) {
    const { state, dispatch } = useData();
    const [title, setTitle] = useState('');
    const [areaId, setAreaId] = useState('all');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'manual'>('daily');

    const handleSubmit = () => {
        if (!title.trim()) return;
        const newRoutine: Routine = {
            id: uuidv4(),
            userId: 'current',
            title,
            areaId: areaId === 'all' ? undefined : areaId,
            frequency,
            createdAt: new Date(),
        };
        dispatch({ type: 'ADD_ROUTINE', payload: newRoutine });
        toast.success("Рутину створено");
        onClose();
    };

    return (
        <div className="space-y-4">
            <DialogHeader>
                <DialogTitle>Нова Рутина</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label>Назва</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Напр. Ранкова йога..." />
                </div>
                <div className="space-y-1">
                    <Label>Сфера</Label>
                    <Select value={areaId} onValueChange={setAreaId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Загальне</SelectItem>
                            {state.areas.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>Частота</Label>
                    <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Щодня</SelectItem>
                            <SelectItem value="weekly">Щотижня</SelectItem>
                            <SelectItem value="manual">Вручну (Шаблон)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleSubmit} className="w-full bg-orange-600 hover:bg-orange-700 text-white">Створити</Button>
            </div>
        </div>
    )
}
