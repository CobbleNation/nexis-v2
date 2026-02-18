'use client';

import { Calendar, Video, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store';
import Link from 'next/link';

export function Reminders() {
    const { state } = useData();

    // Find next upcoming action with a due date
    const upcomingAction = state.actions
        ?.filter((a: any) => a.dueDate && !a.completed)
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-foreground">Нагадування</h3>
                <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>

            {upcomingAction ? (
                <div>
                    <h4 className="text-base font-semibold text-foreground mb-1 line-clamp-2">{upcomingAction.title}</h4>
                    <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {upcomingAction.dueDate ? new Date(upcomingAction.dueDate).toLocaleDateString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                </div>
            ) : (
                <div className="text-sm text-muted-foreground mb-6">
                    Немає майбутніх нагадувань
                </div>
            )}

            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-6 text-sm shadow-lg shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                <Link href="/actions">
                    <Video className="w-4 h-4 mr-2" />
                    Переглянути всі
                </Link>
            </Button>
        </div>
    );
}
