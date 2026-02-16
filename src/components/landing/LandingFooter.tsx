
import Link from "next/link"

export function LandingFooter() {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#020817] py-16">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between gap-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        Zynorvia
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                        Створено для ясності в хаотичному світі. З любов'ю від команди Zynorvia.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                    <div className="space-y-3">
                        <h4 className="font-bold">Продукт</h4>
                        <Link href="/#features" className="block text-slate-500 hover:text-orange-500 transition-colors">Можливості</Link>
                        <Link href="/pricing" className="block text-slate-500 hover:text-orange-500 transition-colors">Тарифи</Link>
                        <Link href="#" className="block text-slate-500 hover:text-orange-500 transition-colors">Зміни</Link>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold">Юридичне</h4>
                        <Link href="/privacy" className="block text-slate-500 hover:text-orange-500 transition-colors">Приватність</Link>
                        <Link href="/terms" className="block text-slate-500 hover:text-orange-500 transition-colors">Умови</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
