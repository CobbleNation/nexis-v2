import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths
} from "date-fns"
import { uk } from "date-fns/locale" // Using Ukrainian locale as noticed in other files
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type BasicCalendarProps = {
    selected?: Date
    onSelect?: (date: Date) => void
    completedDays?: Date[] // new prop for passing completed habit days directly
    className?: string
}

export function BasicCalendar({
    selected,
    onSelect,
    completedDays = [],
    className
}: BasicCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())

    // Memoize calendar days generation
    const calendarDays = React.useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { locale: uk })
        const endDate = endOfWeek(monthEnd, { locale: uk })

        return eachDayOfInterval({
            start: startDate,
            end: endDate,
        })
    }, [currentMonth])

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const isCompleted = (date: Date) => {
        return completedDays.some(d => isSameDay(d, date))
    }

    const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]

    return (
        <div className={cn("p-3 w-full max-w-[320px] mx-auto", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold capitalize">
                    {format(currentMonth, "LLLL yyyy", { locale: uk })}
                </span>
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-transparent border-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                        onClick={prevMonth}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-transparent border-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                        onClick={nextMonth}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                    <div key={day} className="text-[0.8rem] font-medium text-muted-foreground text-center py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, dayIdx) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isDateCompleted = isCompleted(day)
                    const isTodayDate = isToday(day)

                    return (
                        <div key={day.toString()} className="relative w-full pt-[100%]">
                            <div
                                className={cn(
                                    "absolute inset-0 m-auto flex items-center justify-center rounded-md text-sm transition-all",
                                    "w-8 h-8", // Fixed size for roundness consistency
                                    !isCurrentMonth && "text-muted-foreground opacity-30",
                                    isDateCompleted && "bg-emerald-500 text-white font-bold",
                                    !isDateCompleted && isTodayDate && "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-semibold",
                                    // Removed hover effects and pointer cursor since it's not clickable
                                    "cursor-default"
                                )}
                            >
                                {format(day, "d")}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
