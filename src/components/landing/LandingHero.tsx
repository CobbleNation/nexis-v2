"use client"

import Link from "next/link"
import { ArrowRight, Layout, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LandingHeroProps {
    user: any;
}

export function LandingHero({ user }: LandingHeroProps) {
    return (
        <section className="container mx-auto px-6 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                v2.0 вже доступна
            </div>

            <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 will-change-transform transform-gpu">
                Організуй своє життя. <br />
                <span className="text-slate-900 dark:text-white">Розкрий свій потенціал.</span>
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                Комплексна система Zynorvia, що поєднує цілі, звички, завдання та базу знань в одному красивому просторі. Досить перемикатися між додатками. Почни жити.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                {user ? (
                    <Link href="/overview">
                        <Button size="lg" className="rounded-full text-base h-12 px-8 bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-105">
                            Перейти в продукт <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                ) : (
                    <Link href="/login">
                        <Button size="lg" className="rounded-full text-base h-12 px-8 bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-105">
                            Запустити додаток <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                )}
            </div>

            {/* Hero Image / Dashboard Mockup */}
            <div className="mt-20 relative w-full max-w-6xl mx-auto rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B1121] aspect-[16/9] overflow-hidden group animate-in fade-in zoom-in-95 duration-1000 delay-500 will-change-transform transform-gpu">
                <div className="absolute top-0 w-full h-full bg-gradient-to-b from-transparent to-white dark:to-[#020817] opacity-20 z-10 pointer-events-none" />

                {/* Mock UI Header */}
                <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1629] flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                    </div>
                    <div className="ml-4 h-5 w-64 rounded bg-slate-100 dark:bg-slate-800" />
                </div>

                {/* Mock UI Content */}
                <div className="flex h-full text-left bg-slate-50 dark:bg-[#020817]">

                    {/* Sidebar Mock */}
                    <div className="w-16 md:w-48 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1121] p-4 hidden md:flex flex-col gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-bold">
                                <Layout className="w-3 h-3" /> <span className="hidden lg:inline">Огляд</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-medium">
                                <Target className="w-3 h-3" /> <span className="hidden lg:inline">Цілі</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-medium">
                                <Zap className="w-3 h-3" /> <span className="hidden lg:inline">Звички</span>
                            </div>
                        </div>
                        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                            <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                            <div className="h-2 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
                        </div>
                    </div>

                    {/* Main Dashboard Mock */}
                    <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-hidden">

                        {/* Greeting & Stats */}
                        <div className="flex justify-between items-end">
                            <div className="min-w-0">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">Добрий ранок, Олександр</h3>
                                <p className="text-[10px] md:text-xs text-slate-500 truncate">У тебе залишилось 4 завдання на сьогодні.</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <div className="text-right">
                                    <div className="text-base md:text-lg font-bold text-slate-900 dark:text-white">85%</div>
                                    <div className="text-[10px] text-slate-500">Прогрес</div>
                                </div>
                            </div>
                        </div>

                        {/* Grid Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                            {/* Goal Card */}
                            <div className="p-3 md:p-4 rounded-xl bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2 md:space-y-3">
                                <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-500">
                                    <Target className="w-3 h-3 text-emerald-500" /> Цілі Q1
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                            <span>Продукт</span>
                                            <span>75%</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full w-[75%] bg-emerald-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Habits Card */}
                            <div className="p-3 md:p-4 rounded-xl bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2 md:space-y-3">
                                <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-500">
                                    <Zap className="w-3 h-3 text-orange-500" /> Звички
                                </div>
                                <div className="space-y-1 md:space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded bg-orange-500 text-white flex items-center justify-center text-[6px]">✓</div>
                                        <span className="text-[10px] md:text-xs font-medium line-through text-slate-400">Медитація</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded border border-slate-200 dark:border-slate-700" />
                                        <span className="text-[10px] md:text-xs font-medium">Читання</span>
                                    </div>
                                </div>
                            </div>

                            {/* Next Action - Hidden on very small mobile mocks to save space, or just simplified */}
                            <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md flex flex-col justify-between min-h-[80px]">
                                <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Наступним</div>
                                <div>
                                    <div className="text-xs md:text-sm font-bold truncate">Маркетинг</div>
                                    <div className="text-[8px] md:text-[10px] opacity-80 mt-1">14:00 - 15:30</div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom List - Hidden on mobile mock to reduce DOM nodes */}
                        <div className="hidden sm:block p-4 rounded-xl bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 shadow-sm flex-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                                <Layout className="w-3 h-3" /> Останні записи
                            </div>
                            <div className="space-y-3">
                                <div className="flex gap-3 text-xs">
                                    <div className="text-slate-400 w-12 shrink-0">10:45</div>
                                    <div className="truncate">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">Продуктивний інсайт... </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Overlay Text */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px]">
                    {user ? (
                        <Link href="/overview">
                            <Button size="lg" className="rounded-full shadow-2xl scale-110">Відкрити Додаток</Button>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button size="lg" className="rounded-full shadow-2xl scale-110">Увійти в Простір</Button>
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
