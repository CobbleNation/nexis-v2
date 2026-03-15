import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, User, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DeepPlanningChatProps {
  answers: {
    goals: string;
    longTermGoals: string;
    challenges: string;
    structure: string;
  };
  selectedAreaIds: string[];
  onFinish: () => void;
}

export function DeepPlanningChat({ answers, selectedAreaIds, onFinish }: DeepPlanningChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
    // Prevent double fetch in Strict Mode
    if (initialized.current) return;
    initialized.current = true;

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

  return (
    <div className="flex flex-col h-[75vh] w-full max-w-3xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between border-b border-border/40 pb-4 mb-2 px-2 shrink-0 gap-4">
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-orange-500" />
                Zynorvia Deep Planning
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Деталізуємо ваші цілі та будуємо стратегію щоденних дій.</p>
        </div>
        <Button onClick={onFinish} variant="secondary" className="shrink-0 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 rounded-xl px-4 py-2 font-semibold">
           Завершити планування
        </Button>
      </div>

      {/* Chat Area */}
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
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {message.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-foreground rounded-tl-sm'}`}>
                {message.content}
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
                <Brain className="w-4 h-4 text-orange-500 animate-pulse" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
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
                   <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto" />
                   <Brain className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-muted-foreground text-sm font-medium animate-pulse">Готуємо персональні питання...</div>
             </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="pt-2 px-1 shrink-0 bg-background/80 backdrop-blur-sm relative z-10 p-2">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 relative bg-slate-100 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-orange-500/50 rounded-2xl p-1.5 transition-all shadow-sm border border-transparent dark:border-slate-800">
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
            className="shrink-0 h-[44px] w-[44px] rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </form>
        <div className="text-center mt-2 pb-1">
             <span className="text-[10px] text-muted-foreground">Натисніть Enter для відправки. Shift + Enter для нового рядка.</span>
        </div>
      </div>
    </div>
  );
}
