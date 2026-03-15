'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  Target, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Layout, 
  Activity, 
  Flame,
  Zap,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trackEventClient } from '@/lib/analytics-client';
import { DEFAULT_AREAS } from '@/lib/default-areas';
import { DeepPlanningChat } from './DeepPlanningChat';

interface AiOnboardingModalProps {
  onSuccess: () => void;
  onMinimize?: () => void;
}

export function AiOnboardingModal({ onSuccess, onMinimize }: AiOnboardingModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // 0: Intro, 1: Areas, 2: 3-12m Goals, 3: 1-5y Goals, 4: Challenges, 5: Structure, 6: Generating, 7: Success, 8: Pro Paywall, 9: Deep Planning Interface
  const [step, setStep] = useState(0); 
  const [answers, setAnswers] = useState({
    goals: '',
    longTermGoals: '',
    challenges: '',
    structure: 'Balanced'
  });
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [missingAreas, setMissingAreas] = useState<string[]>([]);
  const [generatedData, setGeneratedData] = useState<any>(null);

  useEffect(() => {
    trackEventClient({ eventName: 'ai_onboarding_started' });
    
    // Check for Deep Planning Resumption
    if (searchParams?.get('resume_onboarding') === 'deep_plan') {
       const savedContext = localStorage.getItem('onboarding_deep_plan_context');
       if (savedContext) {
           try {
               const parsed = JSON.parse(savedContext);
               setAnswers(parsed.answers);
               setSelectedAreaIds(parsed.selectedAreaIds);
               setGeneratedData(parsed.generatedData);
           } catch(e) { console.error("Failed to parse saved context"); }
       }
       setStep(9); // Jump directly to Deep Planning
       
       // Optional: Clean up URL visually
       const newUrl = new URL(window.location.href);
       newUrl.searchParams.delete('resume_onboarding');
       window.history.replaceState({}, '', newUrl.toString());
    }
    // Lock scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleArea = (id: string) => {
    setSelectedAreaIds(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleValidation = async () => {
    setIsValidating(true);
    try {
        const response = await fetch('/api/ai/onboarding/validate-areas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selectedAreaIds,
                goalsText: answers.goals
            })
        });
        
        const data = await response.json();
        
        if (data.missingAreas && data.missingAreas.length > 0) {
            setMissingAreas(data.missingAreas);
            setStep(5.5); // Go to validation step
        } else {
            startGeneration(); // All good, generate system
        }
    } catch (e) {
        console.error("Validation failed, proceeding to generation", e);
        startGeneration();
    } finally {
        setIsValidating(false);
    }
  };

  const startGeneration = async () => {
    setStep(6);
    setIsGenerating(true);
    
    try {
      const res = await fetch('/api/ai/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, selectedAreaIds })
      });

      if (!res.ok) throw new Error('Generation failed');
      
      const data = await res.json();
      setGeneratedData(data);
      setStep(7);
      trackEventClient({ eventName: 'ai_plan_generated' });
    } catch (err) {
      console.error(err);
      alert('Помилка генерації. Будь ласка, спробуйте ще раз.');
      setStep(5);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    trackEventClient({ eventName: 'ai_plan_accepted' });
    onSuccess();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-5 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2 scale-110">
              <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Створіть свою систему життя за 60 секунд</h1>
            <p className="text-lg text-muted-foreground leading-snug">Розкажіть нам про свої цілі та спосіб життя. ШІ згенерує для вас структуру сфер життя, цілей та завдань.</p>
            <div className="flex flex-col gap-3 mt-4">
              <Button size="lg" className="w-full h-12 text-base rounded-xl group shadow-lg shadow-orange-500/20" onClick={handleNext}>
                Почати
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              {onMinimize && (
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground h-10 text-sm" onClick={onMinimize}>
                  Зробити пізніше
                </Button>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold tracking-tight">Які сфери життя найбільш важливі для вас зараз?</h2>
            <p className="text-sm text-muted-foreground">Оберіть від 1 до 8 сфер. ШІ сфокусується лише на них.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEFAULT_AREAS.map((area) => {
                const isSelected = selectedAreaIds.includes(area.iconName);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.iconName)}
                    className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                      isSelected 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-orange-200 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className={isSelected ? 'text-orange-500' : 'text-muted-foreground'}>
                       {/* Placeholder icon representation since dynamic icon rendering is tricky here, but we could map it */}
                       <div className={`w-8 h-8 rounded-full ${area.color} opacity-80 mb-1 flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">{area.title[0]}</span>
                       </div>
                    </div>
                    <span className={`font-semibold text-sm ${isSelected ? 'text-orange-700 dark:text-orange-300' : ''}`}>{area.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <Button size="lg" className="w-full h-12 rounded-xl" onClick={handleNext} disabled={selectedAreaIds.length === 0}>Продовжити</Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Які ваші основні цілі на наступні 3-12 місяців?</h2>
            <textarea
              className="w-full min-h-[120px] p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-orange-500 text-base resize-none"
              placeholder="Чого ви хочете досягти найближчим часом?"
              value={answers.goals}
              onChange={(e) => setAnswers({ ...answers, goals: e.target.value })}
            />
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleBack}>Назад</Button>
              <Button size="lg" className="flex-[2] h-12 rounded-xl" onClick={handleNext} disabled={!answers.goals.trim()}>Продовжити</Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Яка ваша візія на 1-5 років? <span className="text-muted-foreground font-normal text-lg">(Опціонально)</span></h2>
              <p className="text-sm text-muted-foreground">Це допоможе ШІ створити більш стратегічний та довгостроковий план.</p>
            </div>
            <textarea
              className="w-full min-h-[120px] p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-orange-500 text-base resize-none"
              placeholder="Де ви бачите себе через 5 років?"
              value={answers.longTermGoals}
              onChange={(e) => setAnswers({ ...answers, longTermGoals: e.target.value })}
            />
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleBack}>Назад</Button>
              <Button size="lg" className="flex-[2] h-12 rounded-xl" onClick={handleNext}>Продовжити</Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Що зараз здається хаотичним або заважає вам?</h2>
            <textarea
              className="w-full min-h-[120px] p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-orange-500 text-base resize-none"
              placeholder="Опишіть поточні проблеми, брак часу або рутину..."
              value={answers.challenges}
              onChange={(e) => setAnswers({ ...answers, challenges: e.target.value })}
            />
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleBack}>Назад</Button>
              <Button size="lg" className="flex-[2] h-12 rounded-xl" onClick={handleNext} disabled={!answers.challenges.trim()}>Продовжити</Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold tracking-tight">Наскільки детальною має бути ваша система?</h2>
            <div className="grid grid-cols-1 gap-3">
              {['Simple', 'Balanced', 'Highly structured'].map((level) => (
                <button
                  key={level}
                  onClick={() => setAnswers({ ...answers, structure: level })}
                  className={`p-5 rounded-xl text-left border-2 transition-all ${
                    answers.structure === level 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-orange-200 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="font-bold text-base">{level === 'Simple' ? 'Проста' : level === 'Balanced' ? 'Збалансована' : 'Деталізована'}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {level === 'Simple' ? 'Тільки основне. Мінімум рутини.' : level === 'Balanced' ? 'Оптимальний баланс між свободою та структурою.' : 'Максимальна деталізація кожного аспекту життя.'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button size="lg" variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleBack}>Назад</Button>
              <Button size="lg" className="flex-[2] h-12 rounded-xl" onClick={handleValidation} disabled={isValidating}>
                {isValidating ? (
                   <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Перевірка...
                   </span>
                ) : 'Згенерувати систему'}
              </Button>
            </div>
          </div>
        );

      case 5.5: // Validation Step
        const missingAreaTitles = missingAreas
             .map(id => DEFAULT_AREAS.find(a => a.iconName === id)?.title)
             .filter(Boolean)
             .join(', ');

        return (
          <div className="space-y-6 max-w-2xl mx-auto h-[60vh] flex flex-col justify-center">
             <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-3xl p-8 flex flex-col items-center text-center space-y-6">
                <Brain className="w-16 h-16 text-orange-500" />
                <div className="space-y-2">
                   <h2 className="text-2xl font-bold text-foreground">Забули про деякі сфери?</h2>
                   <p className="text-muted-foreground text-lg w-[90%] mx-auto">
                      Ви обрали <b>{missingAreaTitles}</b> як важливі сфери, але не вказали для них цілей на наступні 3-12 місяців. Система буде ефективнішою, якщо ми врахуємо все.
                   </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                   <Button size="lg" variant="outline" onClick={() => setStep(2)} className="h-14 flex-1 text-base rounded-2xl border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                      Повернутися і дописати цілі
                   </Button>
                   <Button size="lg" onClick={startGeneration} className="h-14 flex-1 text-base rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                      Продовжити як є
                   </Button>
                </div>
             </div>
          </div>
        );

      case 6:

        return (
          <div className="text-center space-y-8 py-12">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
              <Brain className="w-10 h-10 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Zynorvia AI аналізує ваші відповіді...</h2>
              <p className="text-muted-foreground animate-pulse text-lg">Створюємо ваш персональний план життя</p>
            </div>
            <div className="max-w-xs mx-auto space-y-4">
               <div className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Визначення ключових сфер...</span>
               </div>
               <div className="flex items-center gap-3 text-sm font-medium">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  <span>Формування стратегічних цілей...</span>
               </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6 max-w-2xl mx-auto overflow-y-auto max-h-[80vh] px-2 pb-6 scrollbar-hide">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Smile className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Ваша система життя готова!</h1>
              <p className="text-sm text-muted-foreground">ШІ створив структуру цілей та звичок для обраних сфер.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generatedData?.goals?.map((goal: any, idx: number) => {
                 // Try to find the matching preset area to render color/icon realistically, or default
                 const areaDef = DEFAULT_AREAS.find(a => a.iconName === goal.areaId) || DEFAULT_AREAS[0];
                 
                 return (
                  <Card key={idx} className="p-4 border-l-4 overflow-hidden" style={{ borderLeftColor: areaDef?.color ? '' : '#4F46E5', borderColor: areaDef?.color ? undefined : 'currentColor' }} >
                     <div className="flex items-center gap-2 mb-2">
                        <Layout className={`w-4 h-4 text-muted-foreground`} />
                        <h3 className="font-bold text-sm">{areaDef?.title || 'Сфера'}</h3>
                     </div>
                     <div className="space-y-2">
                          <div className="text-sm">
                             <div className="flex items-start gap-1.5 font-semibold text-orange-600 dark:text-orange-400">
                               <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                               <span className="leading-tight">{goal.title}</span>
                             </div>
                             {goal.tasks && goal.tasks.length > 0 && (
                               <ul className="pl-5 mt-1.5 space-y-1 text-muted-foreground text-[13px] list-disc">
                                  {goal.tasks.slice(0, 2).map((t: any, tidx: number) => (
                                    <li key={tidx} className="leading-tight">{t.title}</li>
                                  ))}
                               </ul>
                             )}
                          </div>
                     </div>
                  </Card>
                 );
              })}
            </div>

            {generatedData?.habits && generatedData.habits.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl">
                 <h3 className="font-bold flex items-center gap-2 mb-3 text-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Ключові звички
                 </h3>
                 <div className="flex flex-wrap gap-2">
                    {generatedData.habits.map((habit: any, hidx: number) => (
                      <span key={hidx} className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-semibold border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 shadow-sm">
                          <Zap className="w-3 h-3 text-orange-500" />
                          {habit.title}
                      </span>
                    ))}
                 </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button size="lg" className="w-full h-12 text-base rounded-xl shadow-xl shadow-orange-500/20" onClick={handleFinish}>
                Почати зараз
              </Button>
              <Button size="lg" variant="secondary" className="w-full h-12 text-base rounded-xl border-orange-200/50 bg-orange-50/50 hover:bg-orange-100/50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/40" onClick={() => {
                const isPro = user?.subscriptionTier === 'pro';
                if (isPro) {
                   setStep(9); // Deep Planning Interface
                } else {
                   setStep(8); // Paywall
                }
              }}>
                <Sparkles className="w-4 h-4 mr-2" />
                Спланувати детальніше
              </Button>
            </div>
          </div>
        );

      case 8: // Pro Paywall
        return (
          <div className="text-center space-y-6 max-w-lg mx-auto py-4">
             <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-8 h-8 text-orange-500" />
             </div>
             <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Відкрийте Глибоке Планування</h2>
                <p className="text-muted-foreground mt-2 text-sm">Ця функція доступна лише для користувачів Zynorvia Pro. Ми збережемо всі ваші дані і повернемо вас сюди одразу після оформлення підписки.</p>
             </div>
             
             <div className="text-left bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                   <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                   <div>
                       <div className="font-bold text-sm">Детальний розбір цілей</div>
                       <div className="text-xs text-muted-foreground">ШІ задасть вам додаткові питання та створить покрокові плани дій для кожної цілі.</div>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                   <div>
                       <div className="font-bold text-sm">Розклад ідеального дня</div>
                       <div className="text-xs text-muted-foreground">Збалансований щоденний розклад, який допоможе системно рухатись до цілей.</div>
                   </div>
                </div>
             </div>

             <div className="flex flex-col gap-3 pt-4">
                 <Button size="lg" className="h-12 w-full text-base rounded-xl shadow-xl shadow-orange-500/20" onClick={() => {
                     // Save state to localStorage Before redirecting
                     localStorage.setItem('onboarding_deep_plan_context', JSON.stringify({
                         answers,
                         selectedAreaIds,
                         generatedData
                     }));
                     trackEventClient({ eventName: 'deep_planning_paywall_clicked' });
                     router.push('/payment?action=subscription&return_to=deep_plan');
                 }}>
                    Оформити підписку
                 </Button>
                 <Button variant="ghost" className="h-10 text-muted-foreground" onClick={() => setStep(7)}>
                    Назад
                 </Button>
             </div>
          </div>
        );

      case 9: // Deep Planning Chat
        return (
          <DeepPlanningChat 
             answers={answers} 
             selectedAreaIds={selectedAreaIds} 
             onFinish={handleFinish} 
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/80 backdrop-blur-xl p-0 md:p-4 overflow-hidden animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-950 w-full h-full md:h-auto md:max-w-2xl md:min-h-[500px] md:max-h-[85vh] md:rounded-3xl shadow-2xl relative flex flex-col pt-6 border border-slate-100 dark:border-slate-800"
      >
        {/* Progress Bar (at top of modal) */}
        {step > 0 && step < 6 && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-900">
             <motion.div 
               className="h-full bg-orange-500"
               initial={{ width: '0%' }}
               animate={{ width: `${(step / 5) * 100}%` }}
             />
          </div>
        )}

        <div className="p-6 md:p-8 overflow-y-auto w-full custom-scrollbar flex-1 flex flex-col justify-center">
          <AnimatePresence mode="popLayout">
            <motion.div
              className="w-full"
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Brand stamp */}
        {step < 6 && (
            <div className="flex items-center justify-center pb-4 opacity-30 select-none">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Zynorvia Life System</span>
            </div>
        )}
      </motion.div>
    </div>
  );
}
