'use client';

import { Action, DayLog } from '@/types';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TodayFocusProps {
    log: DayLog;
    actions: Action[];
}

export function TodayFocus({ log, actions }: TodayFocusProps) {
    const [focusItems, setFocusItems] = useState(log.focus);
    const [newItem, setNewItem] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const addFocus = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        if (focusItems.length >= 3) {
            toast.error('Limit reached', { description: 'You can only have 3 main focus items per day.' });
            return;
        }

        setFocusItems([...focusItems, newItem]);
        setNewItem('');
        setIsAdding(false);
        toast.success('Focus added');
    };

    const removeFocus = (index: number) => {
        setFocusItems(focusItems.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Focus of the Day</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 hover:bg-accent rounded-full text-primary transition-colors"
                >
                    <Plus className={cn("h-5 w-5 transition-transform", isAdding && "rotate-45")} />
                </button>
            </div>

            <div className="space-y-3">
                {focusItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/50 group">
                        <div className="h-6 w-6 rounded-full border-2 border-primary/50 flex items-center justify-center text-xs font-medium text-primary/50">
                            {index + 1}
                        </div>
                        <span className="font-medium text-foreground flex-1">{item}</span>
                        <button
                            onClick={() => removeFocus(index)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {isAdding && (
                    <form onSubmit={addFocus} className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                        <input
                            autoFocus
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="What is your focus?"
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button type="submit" className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                            Add
                        </button>
                    </form>
                )}

                {focusItems.length === 0 && !isAdding && (
                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                        No focus items set for today.
                    </div>
                )}

                <div className="pt-4 border-t border-border/50">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Suggested from Actions</h3>
                    {actions.filter(a => a.type === 'task' && !a.completed).slice(0, 3).map((action) => (
                        <div key={action.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group" onClick={() => {
                            if (focusItems.length < 3) {
                                setFocusItems([...focusItems, action.title]);
                                toast.success('Added from suggestions');
                            } else {
                                toast.error('Focus limit reached');
                            }
                        }}>
                            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            <span className="text-sm text-foreground/80">{action.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex gap-2">
                {['Note', 'Action', 'Event'].map(type => (
                    <button key={type} className="flex-1 py-2 text-xs font-medium bg-primary/5 text-primary rounded-md hover:bg-primary/10 transition-colors border border-primary/10 hover:border-primary/20">
                        + {type}
                    </button>
                ))}
            </div>
        </div>
    );
}
