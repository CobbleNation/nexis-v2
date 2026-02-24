'use client';

import { Bell, Plus, Clock, X, Check } from 'lucide-react';
import { useData } from '@/lib/store';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { AppEvent } from '@/types';

export function Reminders() {
    const { state, dispatch } = useData();
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    // Filter only reminder-type events, sorted by reminderAt ascending
    const reminders = (state.events || [])
        .filter((e: AppEvent) => e.type === 'reminder' && !e.reminderSent)
        .sort((a: AppEvent, b: AppEvent) => {
            const tA = a.reminderAt ? new Date(a.reminderAt).getTime() : 0;
            const tB = b.reminderAt ? new Date(b.reminderAt).getTime() : 0;
            return tA - tB;
        })
        .slice(0, 5);

    const handleCreate = () => {
        if (!title.trim() || !date) return;

        const reminderAt = time
            ? new Date(`${date}T${time}:00`).toISOString()
            : new Date(`${date}T09:00:00`).toISOString();

        const event: AppEvent = {
            id: uuidv4(),
            userId: state.user?.name || 'user',
            title: title.trim(),
            type: 'reminder',
            date: date,
            startTime: time || '09:00',
            reminderAt,
            reminderSent: false,
            createdAt: new Date().toISOString(),
        };

        dispatch({ type: 'ADD_EVENT', payload: event });
        setTitle('');
        setDate('');
        setTime('');
        setShowForm(false);
    };

    const handleDismiss = (id: string) => {
        const event = state.events.find((e: AppEvent) => e.id === id);
        if (event) {
            dispatch({ type: 'UPDATE_EVENT', payload: { ...event, reminderSent: true } as AppEvent });
        }
    };

    return (
        <div className="bg-white dark:bg-card p-5 rounded-[2rem] shadow-sm border border-border/50 dark:border-border flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    Нагадування
                </h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {showForm ? 'Скасувати' : 'Додати'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="mb-4 space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-secondary/30 border border-slate-200/50 dark:border-border">
                    <input
                        type="text"
                        placeholder="Назва нагадування..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 transition-all"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <input
                            type={date ? "date" : "text"}
                            onFocus={(e) => e.target.type = "date"}
                            onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
                            placeholder="Оберіть дату"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex-[3] min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 transition-all"
                        />
                        <input
                            type={time ? "time" : "text"}
                            onFocus={(e) => e.target.type = "time"}
                            onBlur={(e) => { if (!e.target.value) e.target.type = "text" }}
                            placeholder="Обр. час"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="flex-[2] min-w-0 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:focus:ring-primary/30 transition-all text-center"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim() || !date}
                        className="w-full py-2 text-sm font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Створити
                    </button>
                </div>
            )}

            {/* Reminders List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar">
                {reminders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                            <Bell className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">Немає нагадувань</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">Натисніть «Додати» щоб створити</p>
                    </div>
                ) : (
                    reminders.map((reminder: AppEvent) => (
                        <div
                            key={reminder.id}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-secondary/20 transition-colors group"
                        >
                            <button
                                onClick={() => handleDismiss(reminder.id)}
                                className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 hover:border-orange-500 hover:bg-orange-50 dark:hover:border-orange-400 dark:hover:bg-orange-500/10 transition-all"
                            >
                                <Check className="w-3 h-3 text-transparent group-hover:text-orange-500 dark:group-hover:text-orange-400" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{reminder.title}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {reminder.reminderAt
                                        ? formatDistanceToNow(new Date(reminder.reminderAt), { addSuffix: true, locale: uk })
                                        : reminder.date}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
