'use client';

import { useData } from '@/lib/store';
import { getActivityFeed } from '@/lib/activity-utils';
import { Activity, Calendar, Filter, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function ActivityPage() {
    const { state } = useData();
    const { selectedAreaId, period } = state; // We use global state filters from Header

    // Fetch feed based on global selectedAreaId (which defaults to 'all')
    // We pass 'all' explicitly if selectedAreaId is 'all', or the specific ID
    const feed = getActivityFeed(selectedAreaId, state);

    // Apply Period Filter locally (simple filter by date)
    const filteredFeed = feed.filter(item => {
        // period is typed as 'day' | 'week' | 'month' | 'year' in AppState
        // If we ever add 'all', we need to update the type definition first.

        const itemDate = new Date(item.date);
        const now = new Date();

        if (period === 'day') {
            return itemDate.toDateString() === now.toDateString();
        }
        if (period === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= oneWeekAgo;
        }
        if (period === 'month') {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= oneMonthAgo;
        }
        if (period === 'year') {
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return itemDate >= oneYearAgo;
        }
        return true;
    });

    // Group by Day
    const groupedFeed = filteredFeed.reduce((acc, item) => {
        const dateKey = format(item.date, 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {} as Record<string, typeof feed>);

    const sortedDates = Object.keys(groupedFeed).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <Activity className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Історія Активності</h1>
                    <p className="text-muted-foreground">Хронологія ваших досягнень та змін.</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-8 relative">
                {/* Timeline Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border z-0" />

                {sortedDates.length > 0 ? (
                    sortedDates.map(dateKey => {
                        const items = groupedFeed[dateKey];
                        const dateObj = new Date(dateKey);
                        const isCurrentYear = dateObj.getFullYear() === new Date().getFullYear();
                        const dateFormat = isCurrentYear ? 'EEEE, d MMMM' : 'EEEE, d MMMM yyyy';

                        const dateLabel = format(dateObj, dateFormat, { locale: uk });
                        const isToday = dateObj.toDateString() === new Date().toDateString();

                        return (
                            <div key={dateKey} className="relative z-10 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-3 w-3 rounded-full border-2 ml-[22px]",
                                        isToday ? "bg-primary border-primary/20 ring-2 ring-primary/10 dark:ring-primary/20" : "bg-muted-foreground/30 border-card"
                                    )} />
                                    <h3 className={cn("text-sm font-bold uppercase tracking-wider", isToday ? "text-primary" : "text-muted-foreground")}>
                                        {isToday ? 'Сьогодні' : dateLabel}
                                    </h3>
                                </div>

                                <div className="space-y-3 pl-12">
                                    {items.map(item => (
                                        <div key={item.id} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start gap-4 hover:shadow-md transition-all group">
                                            {/* Icon/Circle based on Type */}
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground shadow-sm",
                                                item.areaColor || "bg-muted-foreground"
                                            )}>
                                                {item.type === 'goal' && <Target className="h-5 w-5" />}
                                                {item.type === 'metric' && <Filter className="h-5 w-5" />}
                                                {item.type === 'checkin' && <Calendar className="h-5 w-5" />}
                                                {item.type === 'focus' && <Users className="h-5 w-5" />}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full">
                                                        {format(item.date, 'HH:mm')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg mt-2 border border-border">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border ml-12">
                        <Activity className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">Історія порожня</h3>
                        <p className="text-muted-foreground">Тут з'являтимуться ваші дії.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
