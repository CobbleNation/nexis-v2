import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Clock, Trash2, CheckCircle, PlayCircle, Archive } from 'lucide-react';
import { Project } from '@/types';
import { useData } from '@/lib/store';
import { EditProjectDialog } from './EditProjectDialog';
import { toast } from 'sonner';

interface ProjectActionsMenuProps {
    project: Project;
}

export function ProjectActionsMenu({ project }: ProjectActionsMenuProps) {
    const { dispatch } = useData();
    const [showEdit, setShowEdit] = useState(false);

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
            dispatch({ type: 'DELETE_PROJECT', payload: { id: project.id } });
            toast.success("Project deleted");
        }
    };

    const handlePostpone = () => {
        dispatch({
            type: 'UPDATE_PROJECT',
            payload: { ...project, status: 'deferred', updatedAt: new Date().toISOString() }
        });
        toast.success("Project postponed");
    };

    const handleToggleStatus = () => {
        let newStatus: Project['status'] = project.status === 'completed' ? 'active' : 'completed';

        // If it was planned, start it
        if (project.status === 'planned') {
            newStatus = 'active';
        }

        // If it was deferred, activate it
        if (project.status === 'deferred') {
            newStatus = 'active';
        }

        dispatch({
            type: 'UPDATE_PROJECT',
            payload: { ...project, status: newStatus, updatedAt: new Date().toISOString() }
        });
        toast.success(`Project marked as ${newStatus}`);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setShowEdit(true)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Project
                    </DropdownMenuItem>

                    {project.status !== 'completed' && (
                        <DropdownMenuItem onClick={handleToggleStatus}>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Complete
                        </DropdownMenuItem>
                    )}

                    {project.status === 'completed' && (
                        <DropdownMenuItem onClick={handleToggleStatus}>
                            <PlayCircle className="w-4 h-4 mr-2 text-blue-500" /> Reactivate
                        </DropdownMenuItem>
                    )}

                    {project.status !== 'deferred' && project.status !== 'completed' && (
                        <DropdownMenuItem onClick={handlePostpone}>
                            <Clock className="w-4 h-4 mr-2 text-amber-500" /> Postpone
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleDelete} className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditProjectDialog
                project={project}
                open={showEdit}
                onOpenChange={setShowEdit}
            />
        </>
    );
}
