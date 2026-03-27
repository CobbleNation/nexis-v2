'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Send, X, Loader2, Sparkles, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface UnifiedAssistantProps {
    open: boolean;
    onClose: () => void;
}

let msgCounter = 0;
function genId() {
    return `msg_${Date.now()}_${++msgCounter}`;
}

export function UnifiedAssistant({ open, onClose }: UnifiedAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setError(null);
        setInput('');

        // Add user message
        const userMsg: Message = { id: genId(), role: 'user', content: text };
        const currentMessages = [...messages, userMsg];
        setMessages(currentMessages);

        // Start loading
        setIsLoading(true);

        // Create assistant placeholder
        const assistantId = genId();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        try {
            // Cancel any previous request
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const res = await fetch('/api/ai/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => 'Unknown error');
                throw new Error(`Server error ${res.status}: ${errText}`);
            }

            if (!res.body) {
                throw new Error('No response body');
            }

            // Read the streaming response
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Update the assistant message progressively
                const currentText = fullText;
                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantId
                            ? { ...m, content: currentText }
                            : m
                    )
                );
            }

            // If empty response, show fallback
            if (!fullText.trim()) {
                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantId
                            ? { ...m, content: 'Вибач, я не зміг сформувати відповідь. Спробуй ще раз.' }
                            : m
                    )
                );
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('[Chat] Error:', err);
            setError(err.message || 'Connection failed');
            // Remove empty assistant message on error
            setMessages(prev => prev.filter(m => m.id !== assistantId));
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages]);

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
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.start();
    };

    // Auto-scroll on new messages
    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // Auto-focus input when assistant opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

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
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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

                    {messages.map((m) => (
                        <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.role === 'user' ? "ml-auto" : "mr-auto")}>
                            <div className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                m.role === 'user'
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-muted text-foreground border border-border/50 rounded-tl-sm shadow-sm"
                            )}>
                                {m.content || (
                                    <span className="flex gap-1">
                                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                                        <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-foreground/50 rounded-full" />
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-card border-t border-border z-10">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Накажіть Nexis..."
                            disabled={isLoading}
                            className="flex-1 bg-muted border-none outline-none focus:ring-1 focus:ring-primary h-12 rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
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
                        <Button
                            type="button"
                            size="icon"
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="h-12 w-12 shrink-0 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs mt-2 text-center">
                            ⚠️ {error}
                        </p>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
