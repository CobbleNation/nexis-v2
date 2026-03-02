import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Moon, Lock, Loader2, Sparkles } from 'lucide-react';
import { UpgradeModal } from '../common/UpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useData } from '@/lib/store';
import { toast } from 'sonner';

interface DailyRecapCardProps {
    onOpenJournal: () => void;
}

export const DailyRecapCard: React.FC<DailyRecapCardProps> = ({ onOpenJournal }) => {
    const [showUpgrade, setShowUpgrade] = useState(false);
    const { isPro } = useSubscription() || { isPro: false };
    const { state } = useData();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [explanation, setExplanation] = useState<{ explanation: string; insight: string; theme: string } | null>(null);

    // Get today's journal
    const todayStr = new Date().toISOString().split('T')[0];
    const todayJournal = state.journal.find((j: any) => j.date.startsWith(todayStr));

    const handleAnalyzeDay = async () => {
        if (!isPro) {
            setShowUpgrade(true);
            return;
        }

        if (!todayJournal) {
            toast.error("Спочатку заповніть журнал!");
            onOpenJournal();
            return;
        }

        setIsAnalyzing(true);
        try {
            // Gather data
            const dayFocus = state.focuses.filter(f => f.date === todayStr).map(f => f.title);
            const completedActions = state.actions.filter(a =>
                a.completed &&
                (a.date === todayStr || (a.updatedAt && new Date(a.updatedAt).toISOString().startsWith(todayStr)))
            ).map((a: any) => a.title);

            const response = await fetch('/api/ai/day-explanation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: todayStr,
                    mood: todayJournal.mood || 5, // Default if missing
                    focus: dayFocus,
                    activities: completedActions,
                    notes: todayJournal.content
                })
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setShowUpgrade(true);
                    return;
                }
                throw new Error("Failed to analyze");
            }

            const data = await response.json();
            setExplanation(data);

        } catch (e) {
            console.error(e);
            toast.error("Не вдалося проаналізувати день");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 shadow-xl p-6 text-white"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Moon className="w-24 h-24 text-indigo-300" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm uppercase tracking-wider">
                        <Moon className="w-4 h-4 ml-[2px]" />
                        <span>Вечірній підсумок</span>
                    </div>

                    {!explanation ? (
                        <>
                            <h3 className="text-xl font-bold text-white">Як пройшов твій день?</h3>
                            <p className="text-indigo-100/70 max-w-md text-sm leading-relaxed">
                                Заповни журнал, щоб відслідковувати настрій та його вплив на життя.
                            </p>

                            {/* Analysis Block */}
                            <div
                                onClick={todayJournal ? handleAnalyzeDay : onOpenJournal}
                                className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-indigo-500/20 transition-colors group"
                            >
                                <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                                        {todayJournal ? "Отримати пояснення дня" : "Заповніть журнал для аналізу"}
                                    </div>
                                    <div className="text-xs text-indigo-200/60">
                                        {todayJournal ? "AI знайде прихований зміст подій" : "Спочатку запишіть думки"}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    {explanation.theme}
                                </h3>
                                <p className="text-indigo-100/90 text-sm leading-relaxed mt-1">
                                    {explanation.explanation}
                                </p>
                            </div>
                            <div className="pl-3 border-l-2 border-indigo-400/50">
                                <p className="text-xs text-indigo-300 italic">"{explanation.insight}"</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {!todayJournal && (
                        <button
                            onClick={onOpenJournal}
                            className="group flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-semibold transition-all shadow-lg active:scale-95 shrink-0 w-full sm:w-auto"
                        >
                            <PenTool className="w-4 h-4 text-indigo-600 transition-transform group-hover:rotate-12" />
                            <span>Заповнити Журнал</span>
                        </button>
                    )}
                </div>
            </div>

            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title="Зрозумій свій день"
                description="Сьогоднішній день можна не просто завершити, а зрозуміти. Pro показує, що пішло не так і що змінити завтра."
            />
        </motion.div>
    );
};
