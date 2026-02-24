'use client';

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, X, Info, CheckCircle, AlertTriangle, AlertOctagon, ArrowLeft } from 'lucide-react';
import { useData } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Notification } from '@/types';

export function NotificationsPopover() {
    const { state, dispatch } = useData();
    const { notifications } = state;
    const [isOpen, setIsOpen] = React.useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Lock body scroll on mobile when open (iOS Safari compatible)
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    const handleMarkAllRead = () => {
        dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: { ids: [] } });
    };

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: { ids: [id] } });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'error': return <AlertOctagon className="h-4 w-4 text-rose-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    // Group notifications by date
    const groupedNotifications = useMemo(() => {
        const groups: { [key: string]: Notification[] } = {};

        // Sort notifications from newest to oldest first
        const sorted = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        sorted.forEach(notification => {
            const date = new Date(notification.date);
            let groupLabel = '';

            if (isToday(date)) {
                groupLabel = `Сьогодні, ${format(date, 'd MMMM', { locale: uk })}`;
            } else if (isYesterday(date)) {
                groupLabel = `Вчора, ${format(date, 'd MMMM', { locale: uk })}`;
            } else {
                groupLabel = format(date, 'd MMMM yyyy', { locale: uk });
            }

            if (!groups[groupLabel]) {
                groups[groupLabel] = [];
            }
            groups[groupLabel].push(notification);
        });

        return groups;
    }, [notifications]);

    const notificationsList = (
        <>
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
                    {Object.entries(groupedNotifications).map(([groupLabel, groupNotifs]) => (
                        <div key={groupLabel} className="mb-2">
                            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 px-4 border-y border-border/50 first:border-t-0 shadow-sm">
                                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {groupLabel}
                                </h5>
                            </div>
                            <div className="flex flex-col">
                                {groupNotifs.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex gap-3 p-4 border-b border-border/40 hover:bg-muted/30 transition-colors relative group",
                                            !notification.read && "bg-primary/5 hover:bg-primary/10"
                                        )}
                                    >
                                        <div className={cn("mt-1 p-1.5 rounded-full bg-background border shadow-sm h-fit shrink-0",
                                            !notification.read && "border-primary/20"
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={cn("text-sm font-medium leading-none truncate", !notification.read && "text-primary dark:text-orange-400")}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                                    {format(new Date(notification.date), 'HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed break-words">
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
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    return (
        <>
            {/* Trigger Button */}
            <Button
                size="icon"
                variant="ghost"
                className="relative text-muted-foreground hover:text-foreground dark:hover:bg-slate-800 rounded-full h-10 w-10"
                onClick={() => setIsOpen(true)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-orange-500 border-2 border-background rounded-full animate-pulse" />
                )}
            </Button>

            {/* Mobile: Fullscreen overlay */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div className="md:hidden fixed inset-0 z-[9000] bg-background flex flex-col h-[100dvh] w-screen overflow-hidden overscroll-none touch-none animate-in fade-in duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsOpen(false)} className="p-1.5 -ml-1 rounded-full text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <h4 className="font-semibold text-base">Сповіщення</h4>
                            {unreadCount > 0 && (
                                <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1">
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-8 text-xs text-muted-foreground hover:text-primary">
                                    <Check className="h-3 w-3 mr-1" />
                                    Все
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y relative">
                        {notificationsList}
                    </div>
                </div>
                , document.body)}

            {/* Desktop: Popover */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    {/* Hidden trigger for desktop popover positioning */}
                    <span className="hidden md:inline-block absolute" />
                </PopoverTrigger>
                <PopoverContent className="hidden md:block w-[380px] p-0 mr-4 rounded-2xl shadow-xl border-border/50 bg-background/95 backdrop-blur-xl shrink-0" align="end">
                    <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
                        <h4 className="font-semibold text-sm">Сповіщення</h4>
                        <div className="flex gap-1">
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="xs" onClick={handleMarkAllRead} className="h-7 text-xs text-muted-foreground hover:text-primary">
                                    <Check className="h-3 w-3 mr-1" />
                                    Відмітити все
                                </Button>
                            )}
                        </div>
                    </div>
                    <ScrollArea className="h-[400px]">
                        {notificationsList}
                    </ScrollArea>
                </PopoverContent>
            </Popover>
        </>
    );
}
