import Link from "next/link"
import { ArrowRight, CheckCircle2, Layout, Target, Zap, BarChart3, Lock, Globe, Sparkles, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#020817] text-slate-900 dark:text-slate-50 transition-colors duration-500 overflow-x-hidden">

      {/* Decorative Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-orange-500/5 rounded-full blur-[150px] animate-pulse duration-[10s]" />
      </div>

      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <main className="flex-1 z-10 pt-32 pb-20">
        <section className="container mx-auto px-6 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            v2.0 вже доступна
          </div>

          <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Організуй своє життя. <br />
            <span className="text-slate-900 dark:text-white">Розкрий свій потенціал.</span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Комплексна система Zynorvia, що поєднує цілі, звички, завдання та базу знань в одному красивому просторі. Досить перемикатися між додатками. Почни жити.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/overview">
              <Button size="lg" className="rounded-full text-base h-12 px-8 bg-orange-600 hover:bg-orange-500 text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-105">
                Запустити додаток <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="rounded-full text-base h-12 px-8 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Play className="mr-2 w-4 h-4 fill-current" /> Дивитись демо
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                <DialogTitle className="sr-only">Демонстрація додатку Zynorvia</DialogTitle>
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                  <img
                    src="/demo.png"
                    alt="Zynorvia Demo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Hero Image / Dashboard Mockup */}
          <div className="mt-20 relative w-full max-w-6xl mx-auto rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B1121] aspect-[16/9] overflow-hidden group animate-in fade-in zoom-in-95 duration-1000 delay-500">
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
              <div className="flex-1 p-6 space-y-6 overflow-hidden">

                {/* Greeting & Stats */}
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Добрий ранок, Олександр</h3>
                    <p className="text-xs text-slate-500">У тебе залишилось 4 завдання на сьогодні.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">85%</div>
                      <div className="text-[10px] text-slate-500">Тижневий Прогрес</div>
                    </div>
                  </div>
                </div>

                {/* Grid Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Goal Card */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Target className="w-3 h-3 text-emerald-500" /> Цілі Q1
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>Запуск MVP</span>
                          <span>75%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full w-[75%] bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span>Марафон 42км</span>
                          <span>40%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full w-[40%] bg-blue-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Habits Card */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Zap className="w-3 h-3 text-orange-500" /> Звички Сьогодні
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-orange-500 text-white flex items-center justify-center text-[8px]">✓</div>
                        <span className="text-xs font-medium line-through decoration-slate-300 text-slate-400">Ранкова Медитація</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border border-slate-200 dark:border-slate-700" />
                        <span className="text-xs font-medium">Читання 30 сторінок</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border border-slate-200 dark:border-slate-700" />
                        <span className="text-xs font-medium">Глибока Робота (2год)</span>
                      </div>
                    </div>
                  </div>

                  {/* Next Action */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md flex flex-col justify-between">
                    <div className="text-[10px] font-medium opacity-80">Наступним</div>
                    <div>
                      <div className="text-sm font-bold">Огляд Маркетинг-стратегії</div>
                      <div className="text-[10px] opacity-80 mt-1">14:00 - 15:30</div>
                    </div>
                  </div>
                </div>

                {/* Bottom List */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 shadow-sm flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                    <Layout className="w-3 h-3" /> Останні записи журналу
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3 text-xs">
                      <div className="text-slate-400 w-12 shrink-0">10:45</div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Продуктивний інсайт. </span>
                        <span className="text-slate-500">Зрозумів, що блокування часу для пошти...</span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <div className="text-slate-400 w-12 shrink-0">Вчора</div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">Тижнева рефлексія. </span>
                        <span className="text-slate-500">Тиждень був збалансований, але треба...</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Overlay Text */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px]">
              <Link href="/overview">
                <Button size="lg" className="rounded-full shadow-2xl scale-110">Увійти в Простір</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-6 py-32">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Все що потрібно. <span className="text-slate-400">І нічого зайвого.</span></h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Zynorvia — це не просто список справ. Це комплексна система, створена для узгодження твоїх щоденних дій з життєвою метою.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        {/* Methodology Section */}
        <section id="workflow" className="py-32 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
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
                  <WorkflowStep title="2. Виконання" desc="Розіб'и цілі на Проекти та Завдання. Фокусуйся на головному." />
                  <WorkflowStep title="3. Рефлексія" desc="Використовуй Журнал та Тижневий Огляд для корекції курсу." />
                </div>

                <div className="pt-4">
                  <Link href="/overview">
                    <Button className="gap-2">
                      Почати за Методом <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex-1 relative">
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

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-32 text-center">
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl p-12 md:p-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 dark:bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Готовий перевірити свій потенціал?</h2>
              <p className="text-lg text-slate-300 dark:text-slate-600">
                Приєднуйся до тисяч людей, які вже перейшли на Zynorvia. Жодних карток. Чистий фокус.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/overview">
                  <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-orange-500 hover:bg-orange-400 text-white border-0">
                    Почати Зараз
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-8">
                Безкоштовно назавжди для особистого використання.
              </p>
            </div>
          </div>
        </section>

      </main>


      {/* Footer */}
      <LandingFooter />
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/5 group">
      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
        <div className="w-6 h-6">{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>
  )
}

function WorkflowStep({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
      </div>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400">
          {desc}
        </p>
      </div>
    </div>
  )
}
