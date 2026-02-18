'use client';

import { Calendar, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Reminders() {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-foreground">Reminders</h3>
                <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>

            <div>
                <h4 className="text-base font-semibold text-foreground mb-1">Meeting with Arc Company</h4>
                <p className="text-sm text-muted-foreground mb-6">Time: 02.00 pm - 04.00 pm</p>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full py-6 text-sm shadow-lg shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                <Video className="w-4 h-4 mr-2" />
                Start Meeting
            </Button>
        </div>
    );
}
