'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, Trash2, X, Info, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useData } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

export function NotificationsPopover() {
    const { state, dispatch } = useData();
    const { notifications } = state;
    const [isOpen, setIsOpen] = React.useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAllRead = () => {
        dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: { ids: [] } });
    };

    const handleClearAll = () => {
        dispatch({ type: 'CLEAR_NOTIFICATIONS', payload: undefined });
    };

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: { ids: [id] } });
    };

    // --- Simulation removed as per user request ---

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <AlertOctagon className="h-4 w-4 text-rose-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="relative text-muted-foreground hover:text-foreground dark:hover:bg-slate-800 rounded-full h-10 w-10">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-orange-500 border-2 border-background rounded-full animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[380px] p-0 mr-4 rounded-2xl shadow-xl border-border/50 bg-background/95 backdrop-blur-xl" align="end">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h4 className="font-semibold text-sm">Сповіщення</h4>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="xs" onClick={handleMarkAllRead} className="h-7 text-xs text-muted-foreground hover:text-primary">
                                <Check className="h-3 w-3 mr-1" />
                                Відмітити все
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button variant="ghost" size="icon" onClick={handleClearAll} className="h-7 w-7 text-muted-foreground hover:text-rose-500">
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Немає сповіщень</p>
                            <p className="text-xs text-muted-foreground mt-1">Ми повідомимо вас про важливі події.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-3 p-4 border-b border-border/40 hover:bg-muted/30 transition-colors relative group",
                                        !notification.read && "bg-primary/5 hover:bg-primary/10"
                                    )}
                                >
                                    <div className={cn("mt-1 p-1.5 rounded-full bg-background border shadow-sm h-fit",
                                        !notification.read && "border-primary/20"
                                    )}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read && "text-primary dark:text-orange-400")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: uk })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleMarkRead(notification.id, e)}
                                        >
                                            <span className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="sr-only">Mark as read</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
