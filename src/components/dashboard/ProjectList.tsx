'use client';

import { MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const projects = [
    { name: 'Develop API Endpoints', date: 'Nov 26, 2024', icon: '⚡', color: 'bg-blue-100 text-blue-600' },
    { name: 'Onboarding Flow', date: 'Nov 28, 2024', icon: '🟢', color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Build Dashboard', date: 'Nov 30, 2024', icon: '📊', color: 'bg-orange-100 text-orange-600' },
    { name: 'Optimize Page Load', date: 'Dec 5, 2024', icon: '🚀', color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Cross-Browser Testing', date: 'Dec 6, 2024', icon: '🌐', color: 'bg-purple-100 text-purple-600' },
];

export function ProjectList() {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Project</h3>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors">
                    <Plus className="w-3 h-3" /> New
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                {projects.map((project, index) => (
                    <div key={index} className="flex items-center gap-4 group cursor-pointer">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg", project.color)}>
                            {project.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">{project.name}</h4>
                            <p className="text-xs text-muted-foreground">Due date: {project.date}</p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-foreground transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
