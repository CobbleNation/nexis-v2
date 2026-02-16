'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('habit');
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchItems(activeTab);
    }, [activeTab]);

    async function fetchItems(type: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/system-defaults?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (error) {
            toast.error('Failed to load items');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!newItemTitle) return;
        try {
            const res = await fetch('/api/admin/system-defaults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: activeTab,
                    title: newItemTitle,
                    frequency: 'daily', // Default for habit
                    status: 'active'
                })
            });

            if (res.ok) {
                toast.success('System Default Created');
                setNewItemTitle('');
                setIsDialogOpen(false);
                fetchItems(activeTab);
            } else {
                toast.error('Failed to create');
            }
        } catch (error) {
            toast.error('Error creating item');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Content Defaults</h1>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                            <Plus className="h-4 w-4" />
                            Add Default {activeTab === 'habit' ? 'Habit' : 'Goal'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Add System Default {activeTab === 'habit' ? 'Habit' : 'Goal'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                    placeholder="e.g. Drink Water"
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <Button onClick={handleCreate} className="w-full bg-orange-600 hover:bg-orange-700">
                                Create
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="habit" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="habit">Habits</TabsTrigger>
                    <TabsTrigger value="goal">Goals</TabsTrigger>
                    <TabsTrigger value="project">Projects</TabsTrigger>
                </TabsList>

                <TabsContent value="habit" className="mt-4">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle>Global Default Habits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div>Loading...</div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-800">
                                            <TableHead className="text-slate-400">Title</TableHead>
                                            <TableHead className="text-slate-400">Frequency</TableHead>
                                            <TableHead className="text-right text-slate-400">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium">{item.title}</TableCell>
                                                <TableCell><Badge variant="outline">{item.frequency || 'Daily'}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Delete</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-slate-500">No defaults found</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="goal" className="mt-4">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle>Global Default Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <div>Loading...</div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-800">
                                            <TableHead className="text-slate-400">Title</TableHead>
                                            <TableHead className="text-right text-slate-400">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="font-medium">{item.title}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">Delete</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {items.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-8 text-slate-500">No defaults found</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="project" className="mt-4">
                    <div className="p-8 text-center text-slate-500">Project templates coming soon.</div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
