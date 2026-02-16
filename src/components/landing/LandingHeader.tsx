
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"

export function LandingHeader() {
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

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link href="/overview">
                        <Button variant="ghost" className="hidden sm:flex text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                            Увійти
                        </Button>
                    </Link>
                    <Link href="/overview">
                        <Button className="rounded-full px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
                            Спробувати безкоштовно
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
