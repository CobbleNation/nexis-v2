'use client';

import React, { useState, useEffect } from 'react';
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
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trackEventClient } from '@/lib/analytics-client';

interface AiOnboardingModalProps {
  onSuccess: () => void;
}

export function AiOnboardingModal({ onSuccess }: AiOnboardingModalProps) {
  const [step, setStep] = useState(0); // 0: Intro, 1: Q1, 2: Q2, 3: Q3, 4: Q4, 5: Generating, 6: Success
  const [answers, setAnswers] = useState({
    areas: '',
    goals: '',
    challenges: '',
    structure: 'Balanced'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);

  useEffect(() => {
    trackEventClient({ eventName: 'ai_onboarding_started' });
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const startGeneration = async () => {
    setStep(5);
    setIsGenerating(true);
    
    try {
      const res = await fetch('/api/ai/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      if (!res.ok) throw new Error('Generation failed');
      
      const data = await res.json();
      setGeneratedData(data);
      setStep(6);
      trackEventClient({ eventName: 'ai_plan_generated' });
    } catch (err) {
      console.error(err);
      alert('Помилка генерації. Будь ласка, спробуйте ще раз.');
      setStep(4);
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
          <div className="text-center space-y-6 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 scale-125">
              <Sparkles className="w-10 h-10 text-orange-500 animate-pulse" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Створіть свою систему життя за 60 секунд</h1>
            <p className="text-xl text-muted-foreground">Розкажіть нам про свої цілі та спосіб життя. ШІ згенерує для вас структуру сфер життя, цілей та завдань.</p>
            <Button size="lg" className="w-full h-14 text-lg rounded-2xl group" onClick={handleNext}>
              Почати
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Які сфери життя найбільш важливі для вас зараз?</h2>
            <p className="text-muted-foreground italic">Приклади: кар'єра, здоров'я, фінанси, стосунки, навчання, особистий ріст.</p>
            <textarea
              className="w-full min-h-[150px] p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-orange-500 text-lg"
              placeholder="Напишіть тут..."
              value={answers.areas}
              onChange={(e) => setAnswers({ ...answers, areas: e.target.value })}
            />
            <Button size="lg" className="w-full" onClick={handleNext} disabled={!answers.areas.trim()}>Продовжити</Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Які ваші основні цілі на наступні 3-12 місяців?</h2>
            <textarea
              className="w-full min-h-[150px] p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-orange-500 text-lg"
              placeholder="Чого ви хочете досягти?"
              value={answers.goals}
              onChange={(e) => setAnswers({ ...answers, goals: e.target.value })}
            />
            <div className="flex gap-4">
              <Button size="lg" variant="outline" className="flex-1" onClick={handleBack}>Назад</Button>
              <Button size="lg" className="flex-[2]" onClick={handleNext} disabled={!answers.goals.trim()}>Продовжити</Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Що зараз здається хаотичним або складним у вашому житті?</h2>
            <textarea
              className="w-full min-h-[150px] p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-orange-500 text-lg"
              placeholder="Опишіть поточний стан..."
              value={answers.challenges}
              onChange={(e) => setAnswers({ ...answers, challenges: e.target.value })}
            />
            <div className="flex gap-4">
              <Button size="lg" variant="outline" className="flex-1" onClick={handleBack}>Назад</Button>
              <Button size="lg" className="flex-[2]" onClick={handleNext} disabled={!answers.challenges.trim()}>Продовжити</Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Наскільки структурованою має бути ваша система?</h2>
            <div className="grid grid-cols-1 gap-4">
              {['Simple', 'Balanced', 'Highly structured'].map((level) => (
                <button
                  key={level}
                  onClick={() => setAnswers({ ...answers, structure: level })}
                  className={`p-6 rounded-2xl text-left border-2 transition-all ${
                    answers.structure === level 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-orange-200'
                  }`}
                >
                  <div className="font-bold text-lg">{level === 'Simple' ? 'Проста' : level === 'Balanced' ? 'Збалансована' : 'Високо структурована'}</div>
                  <div className="text-sm text-muted-foreground">
                    {level === 'Simple' ? 'Тільки основне.' : level === 'Balanced' ? 'Оптимальний баланс.' : 'Детальна проробка всіх аспектів.'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <Button size="lg" variant="outline" className="flex-1" onClick={handleBack}>Назад</Button>
              <Button size="lg" className="flex-[2]" onClick={startGeneration}>Згенерувати систему</Button>
            </div>
          </div>
        );

      case 5:
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

      case 6:
        return (
          <div className="space-y-8 max-w-2xl mx-auto overflow-y-auto max-h-[80vh] px-2 pb-6 scrollbar-hide">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Smile className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold">Ваша система життя готова!</h1>
              <p className="text-muted-foreground">ШІ створив структуру, яку ви можете почати використовувати вже сьогодні.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedData?.areas?.map((area: any, idx: number) => (
                <Card key={idx} className="p-4 border-l-4 overflow-hidden" style={{ borderLeftColor: area.color }}>
                   <div className="flex items-center gap-2 mb-3">
                      <Layout className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-bold">{area.title}</h3>
                   </div>
                   <div className="space-y-3">
                      {area.goals.map((goal: any, gidx: number) => (
                        <div key={gidx} className="text-sm">
                           <div className="flex items-center gap-1.5 font-medium text-orange-600 dark:text-orange-400">
                             <Target className="w-3.5 h-3.5" />
                             {goal.title}
                           </div>
                           <ul className="pl-5 mt-1 space-y-1 text-muted-foreground text-xs list-disc">
                              {goal.tasks.slice(0, 2).map((t: any, tidx: number) => (
                                <li key={tidx}>{t.title}</li>
                              ))}
                           </ul>
                        </div>
                      ))}
                   </div>
                </Card>
              ))}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl">
               <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Нові звички
               </h3>
               <div className="flex flex-wrap gap-2">
                  {generatedData?.habits?.map((habit: any, hidx: number) => (
                    <span key={hidx} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full text-sm font-medium border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 shadow-sm">
                        <Zap className="w-3 h-3 text-orange-500" />
                        {habit.title}
                    </span>
                  ))}
               </div>
            </div>

            <Button size="lg" className="w-full h-14 text-xl rounded-2xl shadow-xl shadow-orange-500/20" onClick={handleFinish}>
              Почати мій тиждень
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-950 w-full max-w-3xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col pt-8"
      >
        {/* Progress Bar (at top of modal) */}
        {step > 0 && step < 5 && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-900">
             <motion.div 
               className="h-full bg-orange-500"
               initial={{ width: '0%' }}
               animate={{ width: `${(step / 4) * 100}%` }}
             />
          </div>
        )}

        <div className="p-8 md:p-12 overflow-y-auto w-full custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Brand stamp */}
        {step < 5 && (
            <div className="flex items-center justify-center pb-6 opacity-30 select-none">
                <span className="text-xs font-bold tracking-[0.3em] uppercase">Zynorvia Life System</span>
            </div>
        )}
      </motion.div>
    </div>
  );
}
