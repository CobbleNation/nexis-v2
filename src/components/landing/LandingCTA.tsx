import Link from "next/link"
import { Button } from "@/components/ui/button"

interface LandingCTAProps {
    user: any;
}

export function LandingCTA({ user }: LandingCTAProps) {
    return (
        <section className="container mx-auto px-6 py-32 text-center">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl p-8 md:p-24 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 dark:bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Готовий перевірити свій потенціал?</h2>
                    <p className="text-lg text-slate-300 dark:text-slate-600 leading-relaxed">
                        Приєднуйся до тисяч людей, які вже перейшли на Zynorvia. <br className="hidden md:block" /> Жодних карток. Чистий фокус.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        {user ? (
                            <Link href="/overview">
                                <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-orange-500 hover:bg-orange-400 text-white border-0 shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                                    Повернутись до справ
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/login">
                                <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-orange-500 hover:bg-orange-400 text-white border-0 shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                                    Почати Зараз
                                </Button>
                            </Link>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-8 font-medium">
                        Безкоштовно назавжди для особистого використання.
                    </p>
                </div>
            </div>
        </section>
    );
}
