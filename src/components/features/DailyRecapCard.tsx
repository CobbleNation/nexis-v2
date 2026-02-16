import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Moon, Lock } from 'lucide-react';
import { UpgradeModal } from '../common/UpgradeModal';

interface DailyRecapCardProps {
    onOpenJournal: () => void;
}

export const DailyRecapCard: React.FC<DailyRecapCardProps> = ({ onOpenJournal }) => {
    const [showUpgrade, setShowUpgrade] = useState(false);
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
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm uppercase tracking-wider">
                        <Moon className="w-4 h-4 ml-[2px]" />
                        <span>Вечірній підсумок</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Як пройшов твій день?</h3>
                    <p className="text-indigo-100/70 max-w-md text-sm leading-relaxed">
                        Заповни журнал, щоб відслідковувати настрій та його вплив на життя.
                    </p>

                    {/* Locked Analysis Block */}
                    <div
                        onClick={() => setShowUpgrade(true)}
                        className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors group"
                    >
                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">Пояснення дня (Locked)</div>
                            <div className="text-xs text-indigo-200/60">Чому сьогодні був саме такий день?</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onOpenJournal}
                        className="group flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-semibold transition-all shadow-lg active:scale-95 shrink-0 w-full sm:w-auto"
                    >
                        <PenTool className="w-4 h-4 text-indigo-600 transition-transform group-hover:rotate-12" />
                        <span>Заповнити Журнал</span>
                    </button>
                    <button
                        onClick={() => setShowUpgrade(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-medium text-indigo-200 hover:text-white transition-colors"
                    >
                        <span>Розблокувати аналіз</span>
                    </button>
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
