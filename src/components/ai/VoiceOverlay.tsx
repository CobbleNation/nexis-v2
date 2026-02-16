
'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, CheckCircle2, X, BrainCircuit, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useAssistantAction } from '@/hooks/use-assistant-action';
import { cn } from '@/lib/utils';
import { AssistantAction } from '@/lib/ai/types';

interface VoiceOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function VoiceOverlay({ isOpen, onClose }: VoiceOverlayProps) {
    const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();
    const {
        processText,
        confirmAction,
        cancelAction,
        isProcessing,
        action,
        reply,
        resetConversation
    } = useAssistantAction();
    const [userConfirmedStop, setUserConfirmedStop] = useState(false);

    // Auto-start listening when opened
    useEffect(() => {
        if (isOpen && isSupported) {
            startListening();
            setUserConfirmedStop(false);
        } else {
            stopListening();
        }
    }, [isOpen, startListening, stopListening, isSupported]);

    // Handle silence/auto-stop logic could be here, or just manual for now

    // Process when listening stops (if we have a transcript)
    useEffect(() => {
        if (!isListening && transcript && !action && !isProcessing && isOpen) {
            // Basic silence detection or "done" logic can go here
            // For now, let's rely on a manual "Stop" or the user waiting for silence if the browser handles it
            // Actually, browser SpeechRecog often needs manual stop for continuous mode
        }
    }, [isListening, transcript, action, isProcessing, isOpen]);

    const handleStopAndProcess = () => {
        stopListening();
        if (transcript) {
            processText(transcript);
        }
    };

    const handleConfirm = () => {
        confirmAction();
        onClose();
    };

    const renderActionPreview = (action: AssistantAction) => {
        switch (action.type) {
            case 'GOAL':
                return (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-left w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Ціль</span>
                            <span className="text-xs text-slate-400 capitalize">{action.data.type}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{action.data.title}</h3>
                        {action.data.metric && (
                            <div className="text-sm text-slate-500">
                                Метрика: {action.data.metric.name} ({action.data.metric.targetValue} {action.data.metric.unit})
                            </div>
                        )}
                        {action.data.deadline && (
                            <div className="text-sm text-slate-400 mt-2 text-xs">
                                Дедлайн: {new Date(action.data.deadline).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                );
            case 'TASK':
                return (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-left w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Задача</span>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{action.data.title}</h3>
                        <div className="flex gap-4 text-sm text-slate-500">
                            {action.data.date && <span>📅 {action.data.date}</span>}
                            {action.data.time && <span>⏰ {action.data.time}</span>}
                        </div>
                    </div>
                );
            case 'NOTE':
                return (
                    <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 text-left w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Нотатка</span>
                        </div>
                        <p className="italic text-slate-700 dark:text-slate-300">"{action.data.content}"</p>
                    </div>
                );
            case 'JOURNAL':
                return (
                    <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-100 dark:border-purple-900/50 text-left w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Журнал</span>
                        </div>
                        <p className="italic text-slate-700 dark:text-slate-300">"{action.data.content}"</p>
                    </div>
                );

            default:
                return <div className="text-sm text-slate-500">Тип дії: {action.type}</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[400px] bg-white dark:bg-card border-none shadow-2xl rounded-3xl overflow-hidden p-0">
                <DialogTitle className="sr-only">Голосовий Асистент</DialogTitle>

                <div className="flex flex-col items-center justify-center p-8 min-h-[350px] relative transition-all duration-300">

                    {/* Background Visuals */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-card z-0" />

                    {/* Content */}
                    <div className="z-10 w-full flex flex-col items-center text-center space-y-6">

                        {/* State: IDLE / LISTENING / CLARIFYING */}
                        {!action && !isProcessing && (
                            <>
                                {/* AI Reply / Question Display */}
                                {reply ? (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-6 py-4 rounded-2xl mb-6 max-w-[90%] animate-in fade-in slide-in-from-bottom-2">
                                        <p className="text-slate-800 dark:text-blue-100 font-medium text-lg leading-relaxed">
                                            {reply}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative mb-6">
                                        <AnimatePresence>
                                            {isListening && (
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1.5, opacity: 0.5 }}
                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                                    className="absolute inset-0 bg-orange-200 dark:bg-orange-500/30 rounded-full blur-xl"
                                                />
                                            )}
                                        </AnimatePresence>
                                        <div className={cn(
                                            "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
                                            isListening ? "bg-orange-500 text-white scale-110" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        )}>
                                            <Mic className={cn("w-8 h-8", isListening && "animate-pulse")} />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {!reply && (
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">
                                            {isListening ? "Слухаю вас..." : "Я готовий слухати"}
                                        </h2>
                                    )}

                                    <p className="text-sm text-slate-500 dark:text-muted-foreground max-w-[280px] mx-auto min-h-[1.5em] italic">
                                        {transcript || (reply ? "Натисніть паузу, щоб відповісти..." : "Скажіть, що створити...")}
                                    </p>
                                </div>

                                <div className="pt-6 flex gap-3 justify-center">
                                    {isListening ? (
                                        <Button
                                            variant="destructive"
                                            onClick={handleStopAndProcess}
                                            className="rounded-full px-8 py-6 h-auto text-lg shadow-lg hover:shadow-xl transition-all"
                                        >
                                            Готово
                                        </Button>
                                    ) : (
                                        <>
                                            {reply && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={resetConversation}
                                                    className="rounded-full px-6 py-6 h-auto text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    <X className="w-5 h-5 mr-2" />
                                                    Скинути
                                                </Button>
                                            )}
                                            <Button
                                                onClick={startListening}
                                                className={cn(
                                                    "rounded-full px-8 py-6 h-auto text-lg shadow-lg hover:shadow-xl transition-all",
                                                    reply
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                        : "bg-orange-500 hover:bg-orange-600 text-white"
                                                )}
                                            >
                                                <Mic className="w-5 h-5 mr-2" />
                                                {reply ? "Відповісти" : "Почати"}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {/* State: PROCESSING */}
                        {isProcessing && (
                            <div className="flex flex-col items-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center animate-pulse">
                                    <BrainCircuit className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-700 dark:text-foreground">Аналізую ваш запит...</h3>
                            </div>
                        )}

                        {/* State: CONFIRMATION */}
                        {action && (
                            <div className="w-full space-y-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                                    <Wand2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">Ось що я зрозумів</h3>
                                    <p className="text-xs text-slate-500">Перевірте, чи все вірно</p>
                                </div>

                                {renderActionPreview(action)}

                                <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                    <Button variant="outline" onClick={() => { cancelAction(); onClose(); }} className="rounded-xl h-12">
                                        <X className="w-4 h-4 mr-2" />
                                        Скасувати
                                    </Button>
                                    <Button onClick={handleConfirm} className="rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Продовжити
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
