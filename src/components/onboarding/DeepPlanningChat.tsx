import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, User, Send, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DeepPlanningChatProps {
  answers: {
    areaGoals: Record<string, string>;
    longTermGoals: string;
    challenges: string;
    structure: string;
  };
  selectedAreaIds: string[];
  onFinish: () => void;
  onMinimize?: () => void;
}

// Simple bold markdown parser
const renderMarkdownMsg = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
         if (part.startsWith('**') && part.endsWith('**')) {
             return <strong key={idx}>{part.slice(2, -2)}</strong>;
         }
         return part;
    });
};

export function DeepPlanningChat({ answers, selectedAreaIds, onFinish, onMinimize }: DeepPlanningChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
     // Try to restore from localStorage first
     if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('onboarding_deep_plan_chat');
        if (saved) {
           try { return JSON.parse(saved); } catch(e) {}
        }
     }
     return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Save to localStorage on change
    if (messages.length > 0) {
        localStorage.setItem('onboarding_deep_plan_chat', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // If we already restored state, skip the initial proactive prompt
    if (messages.length > 0) return;

    const startChat = async () => {
      setIsLoading(true);
      try {
        // Send a hidden initial prompt so AI speaks first based on context
        const initialPrompt: Message = {
            role: 'user',
            content: 'Привіт! Я хочу почати глибоке планування. Проаналізуй мої цілі та сфери життя, що я обрав раніше (я передав їх в системному контексті), і задай мені запитання щодо сфер, про які я можливо забув або написав замало. Починай розмову першим.'
        };
        
        // We do not add the initial prompt to the local state so it stays hidden
        const requestMessages = [initialPrompt];

        const res = await fetch('/api/ai/onboarding/deep-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              messages: requestMessages,
              selectedAreaIds,
              initialAnswers: answers
          }),
        });

        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        setMessages([{ role: 'assistant', content: data.message.content }]);
      } catch (error) {
        console.error("Failed to init chat", error);
        setMessages([{ role: 'assistant', content: 'Ой, щось пішло не так при з\'єднанні. Напишіть щось, щоб спробувати ще раз.' }]);
      } finally {
        setIsLoading(false);
      }
    };

    startChat();
  }, [answers, selectedAreaIds]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }] as Message[];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/onboarding/deep-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: newMessages,
            selectedAreaIds,
            // Only send initialAnswers for context tracking in backend
            initialAnswers: answers
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.message.content }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Вибачте, сталася помилка. Спробуйте відправити ще раз.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleGeneratePlan = async () => {
     setIsGeneratingPlan(true);
     try {
         const res = await fetch('/api/ai/onboarding/deep-plan/summarize', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 messages,
                 selectedAreaIds
             })
         });
         
         if (!res.ok) throw new Error('Summarize failed');
         const data = await res.json();
         setGeneratedPlan(data.plan);
         setShowFinishDialog(false);
         
     } catch (e) {
         console.error('Failed to summarize deep plan', e);
         alert('Помилка при створенні плану. Спробуйте ще раз.');
     } finally {
         setIsGeneratingPlan(false);
     }
  };

  const handleSavePlan = async () => {
     setIsSaving(true);
     try {
         const res = await fetch('/api/ai/onboarding/deep-plan/save', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 plan: generatedPlan,
                 selectedAreaIds
             })
         });
         
         if (!res.ok) throw new Error('Save failed');
         
         // Clear local storage since we finished
         localStorage.removeItem('onboarding_deep_plan_chat');
         localStorage.removeItem('onboarding_deep_plan_context');
         onFinish();

     } catch (e) {
         console.error('Failed to save deep plan', e);
         alert('Помилка при збереженні плану. Спробуйте ще раз.');
     } finally {
         setIsSaving(false);
     }
  };

  return (
    <div className="flex flex-col h-[75vh] w-full max-w-3xl mx-auto overflow-hidden relative">
      {/* Finish Overlay Dialog */}
      {showFinishDialog && (
         <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-4 text-center">
               <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
               </div>
               <h3 className="text-xl font-bold">Готові зберегти систему?</h3>
               <p className="text-sm text-muted-foreground">Ми проаналізуємо нашу розмову та створимо готові задачі та звички.</p>
               <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowFinishDialog(false)} disabled={isGeneratingPlan}>Скасувати</Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-white" onClick={handleGeneratePlan} disabled={isGeneratingPlan}>
                     {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                     {isGeneratingPlan ? 'Створення...' : 'Створити'}
                  </Button>
               </div>
            </div>
         </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between border-b border-border/40 pb-4 mb-2 px-2 shrink-0 gap-4 text-center sm:text-left">
        <div>
            <h2 className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
                <Brain className="w-6 h-6 text-primary" />
                Глибоке планування Zynorvia
            </h2>
            <p className="text-sm text-muted-foreground mt-1 text-center sm:text-left">
              {generatedPlan ? 'Перегляньте ваш згенерований план.' : 'Деталізуємо ваші цілі та будуємо стратегію щоденних дій.'}
            </p>
        </div>
        {!generatedPlan && (
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {onMinimize && (
               <Button onClick={onMinimize} variant="ghost" className="text-muted-foreground flex-1 sm:flex-none">
                  Повернутися пізніше
               </Button>
            )}
            <Button onClick={() => setShowFinishDialog(true)} variant="secondary" className="flex-1 sm:flex-none bg-primary/10 text-primary hover:bg-orange-200 dark:bg-primary/20 dark:text-primary rounded-xl px-4 py-2 font-semibold">
               Завершити планування
            </Button>
        </div>
        )}
      </div>

      {/* Chat / Review Area */}
      {!generatedPlan ? (
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((message, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {message.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-foreground rounded-tl-sm'}`}>
                {renderMarkdownMsg(message.content)}
              </div>
            </motion.div>
          ))}
          {isLoading && messages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex gap-3 mr-auto max-w-[85%]"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Аналізує...</span>
              </div>
            </motion.div>
          )}
          {isLoading && messages.length === 0 && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="flex flex-col items-center justify-center h-full space-y-4 pt-10"
             >
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                   <Brain className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-muted-foreground text-sm font-medium animate-pulse">Готуємо персональні питання...</div>
             </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>
      ) : (
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 custom-scrollbar">
         <div className="bg-primary/10 text-primary p-4 rounded-2xl flex items-start gap-3">
             <Brain className="w-6 h-6 shrink-0 mt-0.5" />
             <p className="text-sm font-medium leading-relaxed">Ось ваш персональний план на основі нашої розмови. Перегляньте його перед збереженням. Якщо щось не так, ви можете повернутися до чату і попросити змінити.</p>
         </div>

         {generatedPlan.goals && generatedPlan.goals.length > 0 && (
            <div className="space-y-3">
               <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Створені цілі</h3>
               <div className="grid gap-3 sm:grid-cols-2">
               {generatedPlan.goals.map((goal: any, i: number) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                      <div className="font-bold text-base mb-1">{goal.title}</div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">{goal.description}</p>
                      {goal.tasks && goal.tasks.length > 0 && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                             <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">Завдання</div>
                             <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                 {goal.tasks.map((t: any, j: number) => <li key={j} className="flex gap-2 items-start"><span className="text-primary mt-1">•</span><span className="leading-tight">{t.title}</span></li>)}
                             </ul>
                          </div>
                      )}
                  </div>
               ))}
               </div>
            </div>
         )}

         {generatedPlan.projects && generatedPlan.projects.length > 0 && (
            <div className="space-y-3">
               <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Проєкти</h3>
               <div className="grid gap-3 sm:grid-cols-2">
               {generatedPlan.projects.map((proj: any, i: number) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                      <div className="font-bold text-base mb-1">{proj.title}</div>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">{proj.description}</p>
                      {proj.tasks && proj.tasks.length > 0 && (
                          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                             <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-500">Завдання</div>
                             <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                                 {proj.tasks.map((t: any, j: number) => <li key={j} className="flex gap-2 items-start"><span className="text-primary mt-1">•</span><span className="leading-tight">{t.title}</span></li>)}
                             </ul>
                          </div>
                      )}
                  </div>
               ))}
               </div>
            </div>
         )}
         
         {generatedPlan.habits && generatedPlan.habits.length > 0 && (
             <div className="space-y-3">
                 <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-500" /> Звички</h3>
                 <div className="flex flex-wrap gap-2">
                     {generatedPlan.habits.map((h: any, i: number) => (
                         <div key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-sm font-medium">
                             {h.title} <span className="opacity-70 font-normal ml-1">({h.frequency})</span>
                         </div>
                     ))}
                 </div>
             </div>
         )}
         
         <div className="h-6" />
      </div>
      )}

      {/* Input Area / Review Footer Area */}
      {!generatedPlan ? (
      <div className="pt-2 px-1 shrink-0 bg-background/80 backdrop-blur-sm relative z-10 p-2">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 relative bg-slate-100 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-primary/50 rounded-2xl p-1.5 transition-all shadow-sm border border-transparent dark:border-slate-800">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ваша відповідь..."
            disabled={isLoading}
            className="flex-1 bg-transparent min-h-[44px] max-h-[120px] resize-none px-3 py-3 outline-none text-sm leading-relaxed custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-500"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
               const target = e.target as HTMLTextAreaElement;
               target.style.height = 'auto'; // Reset height to recalculate
               target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-[44px] w-[44px] rounded-xl bg-primary hover:bg-primary/90 text-white transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
        <div className="text-center mt-2 pb-1">
             <span className="text-[10px] text-muted-foreground">Натисніть Enter для відправки. Shift + Enter для нового рядка.</span>
        </div>
      </div>
      ) : (
      <div className="pt-4 shrink-0 bg-background/80 backdrop-blur-sm border-t border-border/40 flex flex-col sm:flex-row justify-between gap-4 mt-2 px-2 pb-4">
          <Button variant="outline" onClick={() => setGeneratedPlan(null)} disabled={isSaving} className="font-semibold rounded-xl h-12 w-full sm:w-auto px-6">
              Змінити в чаті
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl h-12 text-md shadow-md w-full sm:w-auto px-8" onClick={handleSavePlan} disabled={isSaving}>
             {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
             Зберегти систему
          </Button>
      </div>
      )}
    </div>
  );
}
