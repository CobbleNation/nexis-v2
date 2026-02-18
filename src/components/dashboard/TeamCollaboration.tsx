'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const members = [
    { name: 'Alexandra Deff', task: 'Working on Github Project Repository', status: 'Completed', avatar: '/avatars/1.png' },
    { name: 'Edwin Adenike', task: 'Working on Integrate User Authentication System', status: 'In Progress', avatar: '/avatars/2.png' },
    { name: 'Isaac Oluwatemilorun', task: 'Working on Develop Search and Filter Functionality', status: 'Pending', avatar: '/avatars/3.png' },
    { name: 'David Oshodi', task: 'Working on Responsive Layout for Homepage', status: 'In Progress', avatar: '/avatars/4.png' },
];

export function TeamCollaboration() {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Team Collaboration</h3>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors">
                    <Plus className="w-3 h-3" /> Add Member
                </button>
            </div>

            <div className="flex-1 space-y-4">
                {members.map((member, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 border border-border shadow-sm">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground">{member.name}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">{member.task}</p>
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap",
                            member.status === 'Completed' ? "bg-green-100 text-green-700" :
                                member.status === 'In Progress' ? "bg-orange-100 text-orange-700" :
                                    "bg-red-100 text-red-700"
                        )}>
                            {member.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
