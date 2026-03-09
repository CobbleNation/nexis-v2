import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingMethodologyProps {
    user: any;
}

export function LandingMethodology({ user }: LandingMethodologyProps) {
    return (
        <section id="workflow" className="py-32 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                            Методологія
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">Плануй. Дій. Аналізуй.</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Zynorvia побудована на принципах високої ефективності. Система змушує мислити стратегічно, діяти послідовно та рефлексувати чесно.
                        </p>

                        <div className="space-y-6">
                            <WorkflowStep title="1. Бачення" desc="Визнач свої Сфери Життя та довгострокові Цілі." />
                            <WorkflowStep title="2. Виконання" desc="Розбий цілі на Проекти та Завдання. Фокусуйся на головному." />
                            <WorkflowStep title="3. Рефлексія" desc="Використовуй Журнал та Тижневий Огляд для корекції курсу." />
                        </div>

                        <div className="pt-4">
                            {user ? (
                                <Link href="/overview">
                                    <Button className="rounded-full group h-12 px-6">
                                        Продовжити роботу <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/login">
                                    <Button className="rounded-full group h-12 px-6">
                                        Почати за Методом <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 relative w-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-[100px] opacity-20" />
                        <div className="relative bg-white dark:bg-[#020817] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <h3 className="font-bold">Тижневий Огляд</h3>
                                    <span className="text-xs text-slate-400">Неділя, 20:00</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full w-[75%] bg-green-500 rounded-full" />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Прогрес Цілей</span>
                                        <span className="font-bold font-mono">75%</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm italic text-slate-600 dark:text-slate-300">
                                        "Цей тиждень був чудовим у сфері Здоров'я, але Кар'єра трохи просіла. Наступний тиждень: режим Фокусу."
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function WorkflowStep({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1 shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                    {desc}
                </p>
            </div>
        </div>
    );
}
