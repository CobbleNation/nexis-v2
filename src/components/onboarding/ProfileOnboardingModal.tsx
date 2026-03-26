'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, HeartPulse, Briefcase, Target, Loader2, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export function ProfileOnboardingModal() {
    const { user, updateProfile } = useAuth();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Form data
    const [healthCtx, setHealthCtx] = useState('');
    const [workCtx, setWorkCtx] = useState('');
    const [valuesCtx, setValuesCtx] = useState('');

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        window.addEventListener('open-ai-profile', handleOpen);
        return () => window.removeEventListener('open-ai-profile', handleOpen);
    }, []);

    const steps = [
        {
            title: "Здоров'я та Спорт",
            description: "Яка у вас поточна вага? Скільки разів на тиждень займаєтесь спортом та яким? Як ви оцінюєте вашу енергію впродовж дня?",
            icon: HeartPulse,
            value: healthCtx,
            setValue: setHealthCtx,
            placeholder: "Наприклад: Вага 75кг, бігаю 3 рази на тиждень по ранках. Відчуваю спад енергії після 15:00..."
        },
        {
            title: "Робота та Графік",
            description: "Опишіть вашу професію, зайнятість та обмеження. Скільки годин ви можете приділити глибокій сфокусованій роботі щодня?",
            icon: Briefcase,
            value: workCtx,
            setValue: setWorkCtx,
            placeholder: "Наприклад: Працюю програмістом 8 годин на день. Максимально можу бути глибоко сфокусованим десь 4 години..."
        },
        {
            title: "Цінності та Пріоритети",
            description: "Що для вас зараз є найкапітальнішим і що ви найбільше цінуєте в житті? Що б ви хотіли змінити за допомогою Nexis?",
            icon: Target,
            value: valuesCtx,
            setValue: setValuesCtx,
            placeholder: "Наприклад: Моя головна ціль це відкрити свій стартап. Але я хочу зберігати баланс з сім'єю..."
        }
    ];

    const currentStep = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(s => s + 1);
        } else {
            handleSave();
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const identityString = `
[HEALTH & ENERGY]
${healthCtx || 'Not specified'}

[WORK & SCHEDULE]
${workCtx || 'Not specified'}

[VALUES & PRIORITIES]
${valuesCtx || 'Not specified'}
            `.trim();

            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identityString })
            });

            if (res.ok) {
                // Update basic user profile to mark onboarding completed
                if (user?.onboardingCompleted === false) {
                    await updateProfile({ onboardingCompleted: true });
                }
                toast.success('Профіль збережено! AI тепер розуміє вас краще.');
                setOpen(false);
                window.dispatchEvent(new Event('open-assistant')); // Open assistant to celebrate
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border bg-card">
                <div className="bg-primary/5 p-6 border-b border-border/50 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Brain className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold">Профіль Nexis AI</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-1">
                            Надайте контекст, щоб поради та завдання були індивідуальними.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between text-sm font-medium text-muted-foreground">
                        <span className="flex items-center gap-2 text-primary font-bold">
                            <currentStep.icon className="w-4 h-4" />
                            Крок {step + 1} з {steps.length}: {currentStep.title}
                        </span>
                        <span>{Math.round(((step) / steps.length) * 100)}%</span>
                    </div>

                    <p className="text-sm text-foreground/80 mb-4">{currentStep.description}</p>

                    <Textarea 
                        value={currentStep.value}
                        onChange={(e) => currentStep.setValue(e.target.value)}
                        placeholder={currentStep.placeholder}
                        className="min-h-[160px] text-base resize-none focus-visible:ring-primary mb-6"
                    />

                    <div className="flex items-center justify-between">
                        <Button 
                            variant="ghost" 
                            onClick={() => setStep(s => Math.max(0, s - 1))}
                            disabled={step === 0 || isLoading}
                        >
                            Назад
                        </Button>

                        <Button 
                            onClick={handleNext}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 min-w-[120px]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : step === steps.length - 1 ? (
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
