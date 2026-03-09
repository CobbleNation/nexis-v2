import { BarChart3, Globe, Layout, Lock, Target, Zap } from "lucide-react"

export function LandingFeatures() {
    return (
        <section id="features" className="container mx-auto px-6 py-32 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="text-center mb-20 space-y-4 relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Все що потрібно. <span className="text-slate-400">І нічого зайвого.</span></h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                    Zynorvia — це не просто список справ. Це комплексна система, створена для узгодження твоїх щоденних дій з життєвою метою.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                <FeatureCard
                    icon={<Target className="text-orange-500" />}
                    title="Стратегічні Цілі"
                    desc="Встановлюй чіткі OKR та пов'язуй їх з щоденними діями. Відстежуй прогрес автоматично."
                />
                <FeatureCard
                    icon={<Zap className="text-yellow-500" />}
                    title="Щоденні Звички"
                    desc="Будуй ланцюжки звичок та формуй дисципліну за допомогою нашої системи трекінгу."
                />
                <FeatureCard
                    icon={<Layout className="text-blue-500" />}
                    title="Сфери Життя"
                    desc="Організуй життя за сферами: Здоров'я, Кар'єра, Фінанси. Візуалізуй баланс."
                />
                <FeatureCard
                    icon={<BarChart3 className="text-purple-500" />}
                    title="Глибока Аналітика"
                    desc="Розумій, куди йде твій час. Виявляй патерни, оптимізуй енергію та переглядай історію."
                />
                <FeatureCard
                    icon={<Globe className="text-emerald-500" />}
                    title="Другий Мозок"
                    desc="Зберігай ідеї, файли та журнали в одному місці. Поєднуй знання з проектами безшовно."
                />
                <FeatureCard
                    icon={<Lock className="text-slate-500" />}
                    title="Приватно та Локально"
                    desc="Твої дані надійно захищені. Ми використовуємо сучасне шифрування для вашої приватності."
                />
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="p-8 rounded-3xl bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/5 group">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6">{icon}</div>
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                {desc}
            </p>
        </div>
    );
}
