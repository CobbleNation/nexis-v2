'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Brain, HeartPulse, Briefcase, Home, Target, Loader2, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { PROFILE_FIELDS, CATEGORY_META, ProfileData, type ProfileField } from '@/lib/ai/profileFields';

const CATEGORY_ORDER = ['health', 'work', 'lifestyle', 'values', 'personality'] as const;

const CATEGORY_ICONS: Record<string, any> = {
    health: HeartPulse,
    work: Briefcase,
    lifestyle: Home,
    values: Target,
    personality: Brain,
};

export function ProfileOnboardingModal() {
    const { user, updateProfile } = useAuth();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0); // step = category index
    const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData>({});

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener('open-ai-profile', handleOpen);
        return () => window.removeEventListener('open-ai-profile', handleOpen);
    }, []);

    const currentCategory = CATEGORY_ORDER[step];
    const categoryFields = PROFILE_FIELDS.filter(f => f.category === currentCategory);
    const meta = CATEGORY_META[currentCategory];
    const Icon = CATEGORY_ICONS[currentCategory] || Brain;
    const totalSteps = CATEGORY_ORDER.length;

    const updateField = (key: string, value: string) => {
        setProfileData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep(s => s + 1);
        } else {
            handleSave();
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileData })
            });

            if (res.ok) {
                if (user?.onboardingCompleted === false) {
                    await updateProfile({ onboardingCompleted: true });
                }
                toast.success('Профіль збережено! Nexis тепер знає вас набагато краще.');
                setOpen(false);
                window.dispatchEvent(new Event('open-assistant'));
            } else {
                toast.error('Не вдалося зберегти профіль');
            }
        } catch (error) {
            console.error(error);
            toast.error('Виникла помилка');
        } finally {
            setIsLoading(false);
        }
    };

    const renderField = (field: ProfileField) => {
        if (field.type === 'select' && field.options) {
            return (
                <div key={field.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{field.label}</label>
                    <select
                        value={profileData[field.key] || ''}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none"
                    >
                        <option value="">Оберіть...</option>
                        {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            );
        }
        if (field.type === 'textarea') {
            return (
                <div key={field.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{field.label}</label>
                    <Textarea
                        value={profileData[field.key] || ''}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-[80px] text-sm resize-none focus-visible:ring-primary bg-muted/50"
                    />
                </div>
            );
        }
        return (
            <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <Input
                    value={profileData[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="h-10 text-sm focus-visible:ring-primary bg-muted/50"
                />
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-border bg-card max-h-[90vh]">
                <div className="bg-primary/5 p-5 border-b border-border/50 flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-bold">Профіль Nexis AI</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm mt-0.5">
                            Чим більше ви розкажете, тим кращі рішення Nexis прийматиме
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    {/* Progress */}
                    <div className="mb-5 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-primary font-bold">
                            <Icon className="w-4 h-4" />
                            {meta.label}
                        </span>
                        <span className="text-muted-foreground font-medium">
                            {step + 1} / {totalSteps}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
                        <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                        />
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{meta.description}</p>

                    {/* Fields */}
                    <div className="space-y-4">
                        {categoryFields.map(renderField)}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-t border-border/50">
                    <Button 
                        variant="ghost" 
                        onClick={() => setStep(s => Math.max(0, s - 1))}
                        disabled={step === 0 || isLoading}
                        className="gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" /> Назад
                    </Button>

                    <div className="flex gap-2">
                        <Button 
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                            className="text-muted-foreground"
                        >
                            Пізніше
                        </Button>
                        <Button 
                            onClick={handleNext}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 min-w-[120px]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : step === totalSteps - 1 ? (
                                <>Зберегти <Check className="w-4 h-4" /></>
                            ) : (
                                <>Далі <ArrowRight className="w-4 h-4" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
