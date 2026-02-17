'use client';

import React from 'react';
import { useData } from "@/lib/store";
import { useRouter, usePathname } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Hash } from 'lucide-react';

export function MobileContextControls() {
    const { state, dispatch } = useData();
    const router = useRouter();
    const pathname = usePathname();

    const handleAreaChange = (val: string) => {
        const isAreaPage = pathname.startsWith('/areas/');

        if (isAreaPage) {
            if (val === 'all') {
                router.push('/overview');
                dispatch({ type: 'SET_AREA', payload: 'all' });
            } else {
                router.push(`/areas/${val}`);
            }
        } else {
            dispatch({ type: 'SET_AREA', payload: val });
        }
    };

    return (
        <div className="md:hidden flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide px-1">
            <Select
                value={state.period}
                onValueChange={(val: string) => dispatch({ type: 'SET_PERIOD', payload: val as any })}
            >
                <SelectTrigger className="w-[120px] h-9 bg-white dark:bg-secondary/50 border-input shadow-sm rounded-full text-xs font-bold text-foreground">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Період" />
                </SelectTrigger>
                <SelectContent className="border-none shadow-xl rounded-xl p-1">
                    <SelectItem value="year">Рік</SelectItem>
                    <SelectItem value="month">Місяць</SelectItem>
                    <SelectItem value="week">Тиждень</SelectItem>
                    <SelectItem value="day">День</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={state.selectedAreaId}
                onValueChange={handleAreaChange}
            >
                <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-secondary/50 border-input shadow-sm rounded-full text-xs font-bold text-foreground">
                    <Hash className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Сфера" />
                </SelectTrigger>
                <SelectContent className="border-none shadow-xl rounded-xl p-1">
                    <SelectItem value="all">Усі Сфери</SelectItem>
                    {state.areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                            <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${area.color}`} />
                                {area.title}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
