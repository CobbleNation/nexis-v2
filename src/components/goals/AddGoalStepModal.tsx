import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Action } from '@/types/index';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '@/lib/store';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { CalendarIcon, Target } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AddGoalStepModal({
    open,
    onOpenChange,
    goalId,
    areaId,
    projectId,
    onStepAdded
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goalId: string;
    areaId?: string;
    projectId?: string;
    onStepAdded: (action: Action) => void;
}) {
    const { state, dispatch } = useData();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Explicit Date management instead of just string to integrate with Calendar
    const [date, setDate] = useState<Date>(new Date());

    React.useEffect(() => {
        if (open) {
            setTitle('');
            setDescription('');
            setDate(new Date());
        }
    }, [open]);

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error("Введіть назву кроку");
            return;
        }

        const newId = uuidv4();
        const now = new Date().toISOString();
        const formattedDate = format(date, 'yyyy-MM-dd');

        const newTask: Action = {
            id: newId,
            userId: state.user.name !== 'User' ? 'current-user' : 'user',
            title,
            description,
            type: 'task',
            status: 'pending',
            completed: false,
            priority: 'medium', // Default priority
            date: formattedDate,
            duration: 15, // Default duration
            linkedGoalId: goalId,
            areaId: areaId || 'general',
            projectId: projectId || undefined,
            createdAt: now,
            updatedAt: now,
        };

        dispatch({ type: 'ADD_ACTION', payload: newTask });
        onStepAdded(newTask);

        toast.success("Крок додано до цілі");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        Додати новий крок
                    </DialogTitle>
                    <DialogDescription>
                        Цей крок буде одразу прив'язано до вашої цілі та додано до списку завдань.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Назва кроку *</label>
                        <Input
                            placeholder="Що потрібно зробити?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Опис (опціонально)</label>
                        <Textarea
                            placeholder="Деталі або нотатки..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-20 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Дата виконання</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal border-slate-200 dark:border-slate-800",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                    {date ? format(date, "d MMMM", { locale: uk }) : <span>Оберіть дату</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => {
                                        if (newDate) setDate(newDate)
                                    }}
                                    initialFocus
                                    locale={uk}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Скасувати
                    </Button>
                    <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Додати крок
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
