import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/common/UpgradeModal';

interface TimelineLockStateProps {
    view: 'week' | 'month';
}

export function TimelineLockState({ view }: TimelineLockStateProps) {
    const [showUpgrade, setShowUpgrade] = React.useState(false);

    const title = view === 'week' ? 'Планування тижня' : 'Стратегія місяця';
    const description = view === 'week'
        ? 'Тиждень — це не просто 7 днів, а спринт до мети. Pro дозволяє бачити та планувати навантаження.'
        : 'Щоб досягти великих цілей, треба бачити шлях. Pro відкриває місячний огляд і глобальний таймлайн.';

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                {description}
            </p>

            <Button
                onClick={() => setShowUpgrade(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 rounded-full shadow-lg shadow-orange-500/20"
            >
                Розблокувати {view === 'week' ? 'Тиждень' : 'Місяць'}
            </Button>

            <UpgradeModal
                open={showUpgrade}
                onOpenChange={setShowUpgrade}
                title={`Відкрийте ${view === 'week' ? 'Тижневий' : 'Місячний'} Огляд`}
                description={view === 'week'
                    ? 'Для тих, хто серйозно ставиться до свого часу. Плануйте тижневі спринти та балансуйте навантаження.'
                    : 'Масштабне мислення вимагає масштабних інструментів. Бачте цілий місяць як на долоні.'}
            />
        </div>
    );
}
