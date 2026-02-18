import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/lib/store';
import { Project } from '@/types';
import { toast } from 'sonner';

interface EditProjectDialogProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
    const { state, dispatch } = useData();
    const [title, setTitle] = useState(project.title);
    const [description, setDescription] = useState(project.description || '');
    const [status, setStatus] = useState<Project['status']>(project.status);
    const [areaId, setAreaId] = useState(project.areaId || 'none');
    const [startDate, setStartDate] = useState(project.startDate || '');
    const [deadline, setDeadline] = useState(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');

    // Reset form when project changes
    useEffect(() => {
        if (open) {
            setTitle(project.title);
            setDescription(project.description || '');
            setStatus(project.status);
            setAreaId(project.areaId || 'none');
            setStartDate(project.startDate || '');
            setDeadline(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
        }
    }, [project, open]);

    const handleSave = () => {
        if (!title.trim()) {
            toast.error("Project title is required");
            return;
        }

        const updatedProject: Project = {
            ...project,
            title,
            description,
            status,
            areaId: areaId === 'none' ? undefined : areaId,
            startDate: startDate || undefined,
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
            updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
        toast.success("Project updated successfully");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="title" className="text-sm font-medium">Title</label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Project title"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="description" className="text-sm font-medium">Description</label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Project description"
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="status" className="text-sm font-medium">Status</label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                    <SelectItem value="deferred">Deferred</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="area" className="text-sm font-medium">Area</label>
                            <Select value={areaId} onValueChange={setAreaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select area" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Area</SelectItem>
                                    {state.areas.map(area => (
                                        <SelectItem key={area.id} value={area.id}>
                                            {area.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="deadline" className="text-sm font-medium">Deadline</label>
                            <Input
                                id="deadline"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
