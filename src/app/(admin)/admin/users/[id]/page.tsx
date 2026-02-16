'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface UserDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    subscriptionTier: string;
    createdAt: string;
    lastActive: string | null;
    avatar: string | null;
    goalsCount: number;
    habitsCount: number;
    onboardingCompleted: boolean;
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [user, setUser] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        role: '',
        subscriptionTier: '',
        name: '',
        onboardingCompleted: false
    });

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`/api/admin/users/${id}`);
                if (!res.ok) throw new Error('User not found');
                const data = await res.json();
                setUser(data.user);
                setFormData({
                    role: data.user.role,
                    subscriptionTier: data.user.subscriptionTier,
                    name: data.user.name,
                    onboardingCompleted: data.user.onboardingCompleted
                });
            } catch (error) {
                toast.error('Failed to load user');
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('User updated successfully');
                const data = await res.json();
                // Update local state to reflect changes firmly
                setUser(prev => prev ? ({ ...prev, ...data.user }) : null);
            } else {
                toast.error('Failed to update user');
            }
        } catch (error) {
            toast.error('Error saving changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <h2 className="text-xl font-semibold text-slate-300">User not found</h2>
                <Button variant="outline" onClick={() => router.push('/admin/users')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/users')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-slate-800">
                            <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                            <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <p className="text-slate-400">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize px-3 py-1 text-sm">
                        {user.role}
                    </Badge>
                    <Badge variant="outline" className={`px-3 py-1 text-sm ${user.subscriptionTier === 'pro' ? 'border-orange-500 text-orange-500' : 'text-slate-400'}`}>
                        {user.subscriptionTier.toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info & Edit */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle>Account Settings</CardTitle>
                            <CardDescription>Manage user profile and access</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(val) => setFormData({ ...formData, role: val })}
                                    >
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Subscription Tier</Label>
                                    <Select
                                        value={formData.subscriptionTier}
                                        onValueChange={(val) => setFormData({ ...formData, subscriptionTier: val })}
                                    >
                                        <SelectTrigger className="bg-slate-950 border-slate-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950/50">
                                <div>
                                    <Label className="text-base">Onboarding Completed</Label>
                                    <p className="text-sm text-slate-500">
                                        Override onboarding status for testing
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.onboardingCompleted}
                                    onCheckedChange={(checked) => setFormData({ ...formData, onboardingCompleted: checked })}
                                />
                            </div>

                            <Separator className="bg-slate-800" />

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-orange-600 hover:bg-orange-700 min-w-[120px]"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle>Activity Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                                    <h4 className="text-2xl font-bold text-orange-500">{user.goalsCount}</h4>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Goals</p>
                                </div>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                                    <h4 className="text-2xl font-bold text-blue-500">{user.habitsCount}</h4>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Habits</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 text-slate-100">
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-slate-400">User ID</h4>
                                <p className="text-xs font-mono text-slate-300 mt-1 break-all bg-slate-950 p-2 rounded border border-slate-800">{user.id}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-400">Joined On</h4>
                                <p className="text-sm text-slate-300 mt-1">
                                    {format(new Date(user.createdAt), 'PPpp')}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-400">Last Active</h4>
                                <p className="text-sm text-slate-300 mt-1">
                                    {user.lastActive ? format(new Date(user.lastActive), 'PPpp') : 'Never'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
