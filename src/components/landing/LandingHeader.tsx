"use client"

import Link from "next/link"
import { Sparkles, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function LandingHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-white/50 dark:bg-[#020817]/50 backdrop-blur-xl supports-[backdrop-filter]:bg-white/20">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    Zynorvia
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Link href="/#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Можливості</Link>
                    <Link href="/#workflow" className="hover:text-slate-900 dark:hover:text-white transition-colors">Методологія</Link>
                    <Link href="/pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Тарифи</Link>
                </nav>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link href="/login" className="hidden sm:block">
                        <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                            Увійти
                        </Button>
                    </Link>
                    <Link href="/register" className="hidden sm:block">
                        <Button className="rounded-full px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
                            Спробувати безкоштовно
                        </Button>
                    </Link>

                    {/* Mobile hamburger */}
                    <button
                        className="sm:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown menu */}
            <div className={cn(
                "sm:hidden overflow-hidden transition-all duration-300 bg-white/95 dark:bg-[#020817]/95 backdrop-blur-xl border-t border-white/10",
                mobileMenuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="container mx-auto px-6 py-4 space-y-3">
                    <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Можливості
                    </Link>
                    <Link href="/#workflow" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Методологія
                    </Link>
                    <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Тарифи
                    </Link>
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-center text-slate-600 dark:text-slate-300">
                                Увійти
                            </Button>
                        </Link>
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold">
                                Спробувати безкоштовно
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
