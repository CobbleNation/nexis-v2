import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { getSession } from "@/lib/auth-utils"
import Link from "next/link"
import { ArrowRight, Brain, CheckCircle2, Target, Focus, CheckCircle, Crosshair, ListTodo, Lightbulb, User, Check, Zap, CheckSquare, ShieldCheck, Layout, Sparkles } from "lucide-react"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zynorvia - Операційна Система для Життя з ШІ',
  description: 'Зупиніть хаос. Zynorvia використовує штучний інтелект для організації ваших цілей, завдань, звичок і життєвих пріоритетів в єдину зручну систему.',
};

export default async function LandingPage() {
  const user = await getSession();
  
  const ctaLink = user ? "/overview" : "/register";
  const ctaText = user ? "Перейти до системи" : "Start Free";

  return (
    <div className="flex flex-col min-h-screen bg-[#020817] text-slate-50 overflow-x-hidden font-sans selection:bg-primary/30">
      
      {/* Decorative Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <LandingHeader />

      <main className="flex-1 z-10 pt-32 pb-20 space-y-32">
        
        {/* SECTION 1 — HERO */}
        <section className="px-4 text-center max-w-7xl mx-auto mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <SparklesIcon className="w-4 h-4" />
            <span>Нове: ШІ автоматично створює вашу систему</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Зупиніть хаос. <br />Побудуйте систему для свого життя.
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Zynorvia використовує штучний інтелект для організації ваших цілей, завдань, звичок і життєвих пріоритетів в єдину зручну систему, яка зберігає ваш фокус кожного дня.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ctaLink} className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
              {ctaText} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold text-lg border border-white/10 flex items-center justify-center transition-colors">
              Як це працює
            </Link>
          </div>
          
          <div className="mt-20 relative mx-auto max-w-6xl">
             <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent z-20 pointer-events-none" />
             <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-2 shadow-2xl relative overflow-hidden text-left">
                {/* Dashboard Mockup Component restored from OLD LandingHero.tsx */}
                <div className="relative w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B1121] aspect-[16/9] overflow-hidden">
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
                   <div className="flex h-[calc(100%-2.5rem)] text-left bg-slate-50 dark:bg-[#020817]">
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
                                           <div className="flex justify-between text-[10px] font-bold mb-1 text-slate-700 dark:text-slate-300">
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
                                       <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                           <div className="h-3 w-3 rounded bg-orange-500 text-white flex items-center justify-center text-[6px]">✓</div>
                                           <span className="text-[10px] md:text-xs font-medium line-through text-slate-400">Медитація</span>
                                       </div>
                                       <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                           <div className="h-3 w-3 rounded border border-slate-200 dark:border-slate-700" />
                                           <span className="text-[10px] md:text-xs font-medium">Читання</span>
                                       </div>
                                   </div>
                               </div>

                               {/* Next Action */}
                               <div className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md flex flex-col justify-between min-h-[80px]">
                                   <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Наступним</div>
                                   <div>
                                       <div className="text-xs md:text-sm font-bold truncate">Маркетинг</div>
                                       <div className="text-[8px] md:text-[10px] opacity-80 mt-1">14:00 - 15:30</div>
                                   </div>
                               </div>
                           </div>

                           {/* Bottom List */}
                           <div className="hidden sm:block p-4 rounded-xl bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-slate-800 shadow-sm flex-1">
                               <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                                   <Layout className="w-3 h-3" /> Останні записи
                               </div>
                               <div className="space-y-3">
                                   <div className="flex gap-3 text-xs text-slate-700 dark:text-slate-300">
                                       <div className="text-slate-400 w-12 shrink-0">10:45</div>
                                       <div className="truncate">
                                           <span className="font-bold text-slate-800 dark:text-slate-200">Продуктивний інсайт... </span>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* SECTION 2 — THE PROBLEM */}
        <section className="px-4 max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Чому інші додатки не працюють</h2>
          <p className="text-slate-400 max-w-3xl mx-auto mb-16 text-lg">
             Більшість додатків лише керують вашими завданнями, але не структурою вашого життя. Результат? Нескінченні списки справ, які лише посилюють тривогу та стрес.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
             {[
               { icon: <ListTodo className="w-8 h-8 text-rose-400" />, title: "Занадто багато справ", desc: "Сотні невиконаних завдань без реального прогресу у важливих сферах." },
               { icon: <Crosshair className="w-8 h-8 text-rose-400" />, title: "Відсутність системи", desc: "Ви ставите великі цілі 1 січня, але забуваєте про них вже до 15-го." },
               { icon: <Brain className="w-8 h-8 text-rose-400" />, title: "Ментальне перевантаження", desc: "Інструменти планування стають настільки хаотичними, що ви перестаєте ними користуватися." }
             ].map((pain, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/5 text-left">
                   <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6">
                      {pain.icon}
                   </div>
                   <h3 className="text-xl font-bold mb-3">{pain.title}</h3>
                   <p className="text-slate-400 leading-relaxed">{pain.desc}</p>
                </div>
             ))}
          </div>
        </section>

        {/* SECTION 3 — THE SOLUTION */}
        <section className="px-4 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 rounded-[3rem] p-8 md:p-16 border border-white/10 md:flex items-center gap-12">
             <div className="md:w-1/2 mb-10 md:mb-0">
                <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm mb-4 block">РІШЕННЯ</span>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Ваша Персональна Система Життя</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                   Zynorvia — це "Операційна Система Життя", яка об'єднує ваші життєві сфери, великі цілі, щоденні завдання та звички на одній платформі під керівництвом штучного інтелекту. Все працює в гармонії.
                </p>
                <ul className="space-y-4">
                   {['Організація за сферами (Здоров\'я, Фінанси тощо)', 'Прив\'язка завдань безпосередньо до цілей', 'Відстеження щоденних звичок', 'Інтелектуальні підказки від ШІ'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300">
                         <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-indigo-400" />
                         </div>
                         {item}
                      </li>
                   ))}
                </ul>
             </div>
             <div className="md:w-1/2 relative">
                <div className="aspect-square bg-indigo-500/10 rounded-full blur-[80px] absolute inset-0" />
                <div className="relative glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900/80">
                   <div className="space-y-4">
                      <div className="h-2 w-12 bg-indigo-500 rounded-full mb-6" />
                      <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-400"/></div>
                            <div>
                               <div className="font-semibold">Ціль: Пробігти марафон</div>
                               <div className="text-xs text-slate-400">Сфера: Здоров'я</div>
                            </div>
                         </div>
                      </div>
                      <div className="scale-95 opacity-80 bg-white/5 p-4 rounded-xl flex items-center justify-between ml-4 border-l-2 border-indigo-500">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><ListTodo className="w-4 h-4 text-blue-400"/></div>
                            <div>
                               <div className="text-sm font-semibold">Завдання: Купити кросівки</div>
                               <div className="text-[10px] text-slate-400">Прив'язано до Цілі</div>
                            </div>
                         </div>
                      </div>
                      <div className="scale-90 opacity-60 bg-white/5 p-4 rounded-xl flex items-center justify-between ml-8 border-l-2 border-indigo-500">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><CheckSquare className="w-4 h-4 text-purple-400"/></div>
                            <div>
                               <div className="text-sm font-semibold">Звичка: Бігати 5км щодня</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* SECTION 4 — AI POWER */}
        <section className="px-4 max-w-6xl mx-auto text-center">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 mb-8 border border-indigo-500/30">
              <Brain className="w-8 h-8 text-indigo-400" />
           </div>
           <h2 className="text-4xl md:text-5xl font-bold mb-6">ШІ Побудує Вашу Систему за Секунди</h2>
           <p className="text-slate-400 text-lg max-w-3xl mx-auto mb-12">
              Не знаєте з чого почати? Дайте відповідь на кілька запитань про ваші бажання, і наш штучний інтелект миттєво згенерує повноцінний структурований життєвий план.
           </p>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { label: "Сфери Життя", icon: <Target className="w-5 h-5" /> },
                { label: "Розумні Цілі", icon: <Crosshair className="w-5 h-5" /> },
                { label: "Тижневі Завдання", icon: <ListTodo className="w-5 h-5" /> },
                { label: "Щоденні Звички", icon: <CheckCircle2 className="w-5 h-5" /> },
              ].map((item, i) => (
                 <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
                    <div className="text-indigo-400">{item.icon}</div>
                    <div className="font-medium text-sm text-slate-300">{item.label}</div>
                 </div>
              ))}
           </div>
        </section>

        {/* SECTION 5 — HOW IT WORKS */}
        <section id="how-it-works" className="px-4 py-20 bg-slate-900/50 border-y border-white/5 relative">
          <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-bold mb-4">Як це працює</h2>
               <p className="text-slate-400">Три прості кроки до ясності.</p>
             </div>
             
             <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting line for desktop */}
                <div className="hidden md:block absolute top-[45px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                
                {[
                  { step: "01", title: "Розкажіть ШІ про цілі", desc: "Поспілкуйтесь з нашим ШІ-коучем про те, де ви є і чого прагнете." },
                  { step: "02", title: "ШІ будує структуру", desc: "Спостерігайте, як ваші бажання розбиваються на конкретні проекти та звички." },
                  { step: "03", title: "Слідуйте фокусу", desc: "Прокидайтеся щодня, знаючи точний план дій для успіху." }
                ].map((item, i) => (
                   <div key={i} className="relative text-center z-10 px-4">
                      <div className="w-24 h-24 mx-auto bg-slate-950 border border-white/10 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-400 mb-6 shadow-xl">
                         {item.step}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                   </div>
                ))}
             </div>
          </div>
        </section>

        {/* SECTION 6 — KEY FEATURES */}
        <section className="px-4 max-w-7xl mx-auto">
           <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">Все, що потрібно. Нічого зайвого.</h2>
           
           <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: "AI Планування Життя", desc: "Миттєво перетворюйте абстрактні думки на структуровану базу реальних цілей.", icon: <Brain /> },
                { title: "Система Цілей і Завдань", desc: "Ніколи не втрачайте контекст. Усі завдання прямо прив'язані до ваших масштабних цілей.", icon: <Target /> },
                { title: "Управління Сферами", desc: "Збалансовуйте Здоров'я, Фінанси, Стосунки та інше в окремих панелях панелі.", icon: <Lightbulb /> },
                { title: "Дашборд Щоденного Фокусу", desc: "Вимкніть зайвий шум. Бачте лише найважливіші завдання і звички, заплановані на сьогодні.", icon: <Focus /> },
              ].map((feat, i) => (
                 <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white/5 hover:bg-white/[0.07] border border-white/5 transition-colors group">
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                       {feat.icon}
                    </div>
                    <div>
                       <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                       <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* SECTION 7 — PRODUCT SCREENSHOTS */}
        <section className="px-4 max-w-7xl mx-auto space-y-20">
            {/* Screenshot 1 */}
            <div className="md:flex items-center gap-12 flex-row-reverse">
                <div className="md:w-1/2 mb-8 md:mb-0">
                    <h3 className="text-3xl font-bold mb-4">Кришталево Чистий Дашборд</h3>
                    <p className="text-slate-400 text-lg">Усе ваше життя як на долоні. Відстежуйте прогрес, переглядайте дедлайни та бачте свій щоденний фокус — усе зібрано у найкрасивішому просторі.</p>
                </div>
                <div className="md:w-1/2 rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl relative">
                    <div className="aspect-[4/3] bg-slate-950 p-4">
                        {/* Mock Dashboard UI instead of static image */}
                        <div className="w-full h-full rounded-xl border border-slate-800 bg-[#0f1629] overflow-hidden flex flex-col">
                            {/* Header mock */}
                            <div className="h-8 border-b border-slate-800 bg-[#0B1121] flex items-center px-3 gap-2 shrink-0">
                               <div className="w-2 h-2 rounded-full bg-slate-600" />
                               <div className="w-2 h-2 rounded-full bg-slate-600" />
                               <div className="w-2 h-2 rounded-full bg-slate-600" />
                            </div>
                            <div className="flex-1 p-4 grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="h-6 w-32 bg-slate-800 rounded font-bold text-white text-xs flex items-center px-2">Сьогодні, 16 Бер</div>
                                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                       <div className="flex items-center gap-2 mb-2 text-emerald-400 text-[10px]"><Zap className="w-3 h-3"/> ЗВИЧКИ</div>
                                       <div className="flex items-center gap-2 text-xs text-slate-300"><div className="w-3 h-3 rounded-full border border-emerald-500"/> Тренування</div>
                                       <div className="flex items-center gap-2 mt-2 text-xs text-slate-300"><div className="w-3 h-3 rounded-full border border-emerald-500 bg-emerald-500 flex items-center justify-center text-[8px] text-white">✓</div> Читання 20хв</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                       <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2"><span>Прогрес Q1</span><span>65%</span></div>
                                       <div className="h-1.5 w-full bg-slate-700 rounded-full"><div className="w-[65%] h-full bg-indigo-500 rounded-full"/></div>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                       <div className="text-[10px] text-indigo-400 mb-1">СЛІДУЮЧЕ ЗАВДАННЯ</div>
                                       <div className="text-sm font-bold text-white">Реліз V2.0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Screenshot 2 */}
            <div className="md:flex items-center gap-12">
                <div className="md:w-1/2 mb-8 md:mb-0">
                    <h3 className="text-3xl font-bold mb-4">Глибоке Планування з AI</h3>
                    <p className="text-slate-400 text-lg">Спілкуйтеся зі своєю системою. Штучний інтелект розуміє контекст вашого життя і автоматично створює об'єкти в базі даних для кожної вашої обіцянки.</p>
                </div>
                <div className="md:w-1/2 rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl relative">
                    <div className="aspect-[4/3] bg-slate-950 p-4">
                         {/* Mock Chat UI */}
                         <div className="w-full h-full rounded-xl border border-slate-800 bg-[#0f1629] overflow-hidden flex flex-col relative">
                           <div className="flex-1 p-4 space-y-4 pb-12">
                              {/* AI Message */}
                              <div className="flex gap-3">
                                 <div className="w-6 h-6 rounded-full bg-primary/20 flex shrink-0 items-center justify-center text-primary"><Sparkles className="w-3 h-3"/></div>
                                 <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm p-3 text-xs text-slate-200 shadow-sm border border-slate-700/50">
                                    Я бачу, що ти обрав сферу "Здоров'я". Якої саме мети ти хочеш досягти до кінця цього кварталу?
                                 </div>
                              </div>
                              {/* User Message */}
                              <div className="flex gap-3 flex-row-reverse">
                                 <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex shrink-0 items-center justify-center text-emerald-400"><User className="w-3 h-3"/></div>
                                 <div className="bg-primary/20 rounded-2xl rounded-tr-sm p-3 text-xs text-slate-200 shadow-sm border border-primary/30">
                                    Хочу схуднути на 5 кг і почати нормально харчуватися.
                                 </div>
                              </div>
                              {/* AI Structured Response */}
                              <div className="flex gap-3">
                                 <div className="w-6 h-6 rounded-full bg-primary/20 flex shrink-0 items-center justify-center text-primary"><Sparkles className="w-3 h-3"/></div>
                                 <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm p-3 text-xs text-slate-200 shadow-sm border border-slate-700/50 w-full">
                                    Чудово. Я пропоную: <br/>
                                    <strong>Ціль:</strong> Скинути 5 кг <br/>
                                    <strong>Звичка:</strong> Трекінг калорій <br/>
                                    Чи зберегти цю структуру у твій профіль?
                                 </div>
                              </div>
                           </div>
                           <div className="absolute bottom-2 left-2 right-2 h-10 bg-slate-800/80 rounded-xl border border-slate-700 p-2 flex items-center justify-between">
                               <div className="text-slate-500 text-[10px]">Ваша відповідь...</div>
                               <div className="w-6 h-6 rounded bg-primary text-white flex justify-center items-center"><ArrowRight className="w-3 h-3" /></div>
                           </div>
                         </div>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 8 — SOCIAL PROOF */}
        <section className="px-4 py-20 border-y border-white/5 bg-gradient-to-b from-transparent to-slate-900/50">
           <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12">Що кажуть перші користувачі</h2>
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-left relative">
                    <span className="text-4xl text-indigo-500/20 absolute top-4 left-4">"</span>
                    <p className="text-slate-300 relative z-10 italic mb-6">"Нарешті додаток, який розуміє, що тренування пов'язано з моєю метою здоров'я. Він побудував всю мою систему буквально за 2 хвилини."</p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center"><User className="w-5 h-5 text-indigo-400"/></div>
                       <div><div className="font-bold text-sm">Денис</div><div className="text-xs text-slate-500">Ранній користувач</div></div>
                    </div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-left relative">
                    <span className="text-4xl text-emerald-500/20 absolute top-4 left-4">"</span>
                    <p className="text-slate-300 relative z-10 italic mb-6">"Екран Фокусу кардинально змінив мій день. Я більше не бачу 100 справ, які треба зробити за місяць, я бачу ті 3 речі, які потрібно зробити прямо зараз."</p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><User className="w-5 h-5 text-emerald-400"/></div>
                       <div><div className="font-bold text-sm">Олександр</div><div className="text-xs text-slate-500">Підприємець</div></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 9 — PRICING */}
        <section className="px-4 max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold mb-4">Прозорі Тарифи</h2>
             <p className="text-slate-400">Почніть організовувати життя безкоштовно, або розблокуйте силу ШІ з преміум планом.</p>
           </div>
           
           <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="p-8 md:p-10 rounded-3xl border border-slate-800 bg-slate-900/50 relative flex flex-col">
                 <h3 className="text-2xl font-bold mb-2">Базовий</h3>
                 <div className="text-4xl font-bold mb-6">₴0</div>
                 <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-slate-300 text-sm md:text-base"><Check className="w-5 h-5 text-emerald-500"/> Основні Цілі та Завдання</li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm md:text-base"><Check className="w-5 h-5 text-emerald-500"/> Базові Сфери Життя</li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm md:text-base"><Check className="w-5 h-5 text-emerald-500"/> Трекінг Звичок</li>
                    <li className="flex items-center gap-3 text-slate-500 text-sm md:text-base"><Check className="w-5 h-5 text-slate-700"/> Обмежений ШІ-Помічник</li>
                 </ul>
                 <Link href="/register" className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-center font-semibold transition-colors">
                    Почати Безкоштовно
                 </Link>
              </div>

              {/* Pro Plan */}
              <div className="p-8 md:p-10 rounded-3xl border-2 border-primary bg-primary/5 relative flex flex-col shadow-[0_0_30px_-10px_rgba(79,70,229,0.3)] transform md:-translate-y-4">
                 <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Найпопулярніший</div>
                 <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-primary">Pro План <Zap className="w-5 h-5 fill-current" /></h3>
                 <div className="text-4xl font-bold mb-1">₴199<span className="text-lg text-slate-400 font-normal">/міс</span></div>
                 <p className="text-xs text-indigo-400 mb-6 font-medium">Оплата щомісяця</p>
                 <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-slate-200 text-sm md:text-base"><Check className="w-5 h-5 text-primary"/> Безлімітне ШІ-Планування</li>
                    <li className="flex items-center gap-3 text-slate-200 text-sm md:text-base"><Check className="w-5 h-5 text-primary"/> Розширений ШІ-Аналіз</li>
                    <li className="flex items-center gap-3 text-slate-200 text-sm md:text-base"><Check className="w-5 h-5 text-primary"/> Необмежені Звички та Проекти</li>
                    <li className="flex items-center gap-3 text-slate-200 text-sm md:text-base"><Check className="w-5 h-5 text-primary"/> Пріоритетна Підтримка</li>
                 </ul>
                 <Link href="/register?plan=pro" className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-center font-bold text-lg transition-colors shadow-lg shadow-primary/20">
                    Отримати Суперсилу
                 </Link>
              </div>
           </div>
        </section>

        {/* SECTION 10 — FINAL CTA */}
        <section className="px-4 max-w-5xl mx-auto text-center mt-20">
           <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 rounded-[3rem] p-12 md:p-20 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
              <div className="relative z-10">
                 <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white text-shadow-sm">Візьміть Контроль над Життям</h2>
                 <p className="text-indigo-200 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                    Приєднуйтесь до тисяч людей, які припинили дрейфувати і почали будувати власну життєву систему вже сьогодні.
                 </p>
                 <Link href={ctaLink} className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white text-indigo-950 font-bold text-lg hover:bg-slate-100 transition-transform hover:scale-105 active:scale-95 shadow-2xl">
                    {ctaText} <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center ml-2"><ArrowRight className="w-4 h-4 text-indigo-900" /></div>
                 </Link>
              </div>
           </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  )
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
