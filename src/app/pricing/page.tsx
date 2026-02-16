
"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default function PricingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#020817] text-slate-900 dark:text-slate-50 transition-colors duration-500">
            <LandingHeader />

            <main className="flex-1 pt-32 pb-20">
                <section className="container mx-auto px-6 text-center">

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-8">
                        Інвестиція в себе
                    </div>

                    <h1 className="max-w-4xl mx-auto text-4xl md:text-5xl font-bold tracking-tight mb-8">
                        Обери свій шлях <span className="text-slate-400">до продуктивності.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 mb-16">
                        Почни безкоштовно та переходь на Pro, коли будеш готовий масштабувати свої досягнення.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <PricingCard
                            title="Безкоштовний"
                            price="0 ₴"
                            period="/ місяць"
                            desc="Ідеально для старту та організації особистих справ."
                            features={[
                                "Необмежені Звички",
                                "До 3 Стратегічних Цілей",
                                "Базова синхронізація",
                                "Основні метрики",
                                "Журнал вдячності"
                            ]}
                            buttonText="Почати Безкоштовно"
                            buttonVariant="outline"
                            isPopular={false}
                        />

                        {/* Pro Plan */}
                        <PricingCard
                            title="Pro"
                            price="199 ₴"
                            period="/ місяць"
                            desc="Для тих, хто серйозно ставиться до своїх амбіцій."
                            features={[
                                "Все що в Free, плюс:",
                                "Необмежена кількість Цілей",
                                "AI Інсайти та рекомендації",
                                "Розширена аналітика продуктивності",
                                "Хмарний бекап даних",
                                "Пріоритетна підтримка"
                            ]}
                            buttonText="Спробувати Pro"
                            buttonVariant="default"
                            isPopular={true}
                        />
                    </div>

                </section>
            </main>

            <LandingFooter />
        </div>
    )
}

function PricingCard({ title, price, period, desc, features, buttonText, buttonVariant, isPopular }: any) {
    return (
        <div className={`relative p-8 rounded-3xl border flex flex-col items-start text-left ${isPopular ? 'border-orange-500 shadow-2xl shadow-orange-500/10 bg-slate-50 dark:bg-[#0B1121]' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020817]'}`}>
            {isPopular && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">
                    Найпопулярніший
                </div>
            )}

            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">{price}</span>
                <span className="text-sm text-slate-500">{period}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 h-10">
                {desc}
            </p>

            <div className="w-full space-y-4 mb-8 flex-1">
                {features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <Link href={isPopular ? "/payment" : "/overview"} className="w-full">
                <Button
                    className={`w-full h-12 rounded-xl text-base font-semibold ${isPopular ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-none hover:opacity-90' : ''}`}
                    variant={buttonVariant}
                >
                    {isPopular ? "Змінити план" : buttonText}
                </Button>
            </Link>
        </div>
    )
}
