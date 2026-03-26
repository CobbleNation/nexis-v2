'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { Brain, Send, X, Loader2, Sparkles, CheckCircle2, Mic, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedAssistantProps {
    open: boolean;
    onClose: () => void;
}

export function UnifiedAssistant({ open, onClose }: UnifiedAssistantProps) {
    // @ts-ignore - Vercel AI SDK type bug with Next.js 15
    const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, error } = useChat({
        id: 'nexis-brain',
        // @ts-ignore
        api: '/api/ai/brain',
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isListening, setIsListening] = useState(false);
    
    // Voice Support
    const startListening = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Ваш браузер не підтримує розпізнавання голосу.');
            return;
        }
        
        const recognition = new SpeechRecognition() as any;
        recognition.lang = 'uk-UA';
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            // Set input state natively
            setInput(input ? `${input} ${transcript}` : transcript);
        };
        
        recognition.start();
    };
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-[100] md:inset-auto md:bottom-6 md:right-6 md:w-[450px] md:h-[650px] bg-background md:rounded-3xl shadow-2xl flex flex-col border border-border overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base leading-tight">Nexis</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Life OS
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </Button>
                </div>

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                            <Sparkles className="w-12 h-12 text-primary/50" />
                            <div>
                                <h4 className="font-bold text-lg mb-1">Готовий до оптимізації.</h4>
                                <p className="text-sm text-muted-foreground max-w-[250px]">
                                    Я відслідковую ваші ліміти фокусу та енергію. Що плануємо?
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {messages.map((m: any) => (
                        <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.role === 'user' ? "ml-auto" : "mr-auto")}>
                            {m.content && (
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    m.role === 'user' 
                                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                                        : "bg-muted text-foreground border border-border/50 rounded-tl-sm shadow-sm"
                                )}>
                                    {m.content}
                                </div>
                            )}

                            {/* Render Tool Invocations Visually */}
                            {m.toolInvocations?.map((tool: any) => (
                                <div key={tool.toolCallId} className="mt-2 text-xs">
                                    {(tool.state === 'call' || tool.state === 'partial-call') ? (
                                        <div className="flex items-center gap-2 text-muted-foreground bg-secondary/50 p-2 rounded-lg font-medium border border-border/50">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            {tool.toolName === 'create_goal' && 'Створення цілі...'}
                                            {tool.toolName === 'schedule_task' && 'Планування завдання...'}
                                            {tool.toolName === 'log_memory' && 'Оновлення пам\'яті...'}
                                            {tool.toolName === 'reschedule_low_impact' && 'Оптимізація розкладу...'}
                                        </div>
                                    ) : tool.state === 'result' ? (
                                        <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900 border-l-2 border-l-emerald-500 shadow-sm">
                                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                            <div className="font-medium">
                                                {tool.toolName === 'create_goal' && 'Ціль збережена у базу'}
                                                {tool.toolName === 'schedule_task' && (tool.result as any)?.success === false ? (
                                                    <span className="text-red-500">{(tool.result as any).reason}</span>
                                                ) : tool.toolName === 'schedule_task' ? (
                                                    <span>Завдання додано. Impact Score: <span className="font-bold text-amber-600">{(tool.result as any)?.impactScore?.toFixed(2)}</span></span>
                                                ) : ''}
                                                {tool.toolName === 'log_memory' && 'Факти додано до пам\'яті'}
                                                {tool.toolName === 'reschedule_low_impact' && 'Розклад автоматично розвантажено'}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="mr-auto bg-muted text-foreground p-3 rounded-2xl rounded-tl-sm w-16 flex items-center justify-center">
                            <span className="flex gap-1">
                                <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                                <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                                <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                            </span>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-card border-t border-border z-10">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => handleInputChange(e)}
                            placeholder="Накажіть Nexis..."
                            className="bg-muted border-none outline-none focus-visible:ring-1 focus-visible:ring-primary h-12 rounded-xl"
                            disabled={isLoading}
                        />
                        <Button 
                            type="button" 
                            variant="outline"
                            size="icon" 
                            onClick={startListening}
                            className={cn("h-12 w-12 shrink-0 rounded-xl transition-all", isListening && "bg-red-50 text-red-500 border-red-200 animate-pulse")}
                        >
                            <Mic className="w-5 h-5" />
                        </Button>
                        <Button type="submit" size="icon" disabled={isLoading || !(input || '').trim()} className="h-12 w-12 shrink-0 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                    {error && <p className="text-red-500 text-xs mt-2 text-center">Connection error. Please try again.</p>}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

