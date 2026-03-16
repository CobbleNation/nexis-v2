import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { getSession } from "@/lib/auth-utils"
import Link from "next/link"
import { ArrowRight, Brain, CheckCircle2, Target, Focus, CheckCircle, Crosshair, ListTodo, Lightbulb, User, Check, Zap, CheckSquare, ShieldCheck, Layout, Sparkles, Search, Bell, Activity, Flame } from "lucide-react"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zynorvia - Операційна Система для Життя з ШІ',
  description: 'Зупиніть хаос. Zynorvia використовує штучний інтелект для організації ваших цілей, завдань, звичок і життєвих пріоритетів в єдину зручну систему.',
};

export default async function LandingPage() {
  const user = await getSession();
  
  const ctaLink = user ? "/overview" : "/register";
  const ctaText = user ? "Перейти до системи" : "Почати безкоштовно";

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
        <section className="px-4 text-center max-w-6xl mx-auto mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-base font-medium mb-10">
            <Sparkles className="w-5 h-5" />
            <span>Нове: ШІ автоматично створює вашу систему</span>
          </div>
          <h1 className="text-6xl md:text-[5.5rem] font-extrabold tracking-tight mb-8 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Зупиніть хаос. <br />Побудуйте систему для свого життя.
          </h1>
          <p className="text-2xl text-slate-400 mb-12 max-w-4xl mx-auto leading-relaxed">
            Zynorvia використовує штучний інтелект для організації ваших цілей, завдань, звичок і життєвих пріоритетів в єдину зручну систему, яка зберігає ваш фокус кожного дня.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href={ctaLink} className="w-full sm:w-auto px-10 py-5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xl flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
              {ctaText} <ArrowRight className="w-6 h-6" />
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto px-10 py-5 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xl border border-white/10 flex items-center justify-center transition-colors">
              Як це працює
            </Link>
          </div>
          
          <div className="mt-20 relative mx-auto max-w-6xl">
             <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent z-20 pointer-events-none" />
             <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-2 shadow-2xl relative overflow-hidden text-left">
                {/* Dashboard Mockup Component derived exactly from user screenshot */}
                <div className="relative w-full rounded-xl border border-slate-800 dark:border-slate-800 bg-[#0B1121] aspect-[16/9] overflow-hidden flex font-sans text-slate-300">
                    {/* Sidebar */}
                    <div className="w-[180px] lg:w-[220px] border-r border-slate-800 bg-[#0f1629] p-3 hidden md:flex flex-col text-xs space-y-4 overflow-y-auto">
                        {/* Logo */}
                        <div className="flex items-center gap-2 px-2 py-1 mb-2 text-white font-bold text-[13px]">
                            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0"></div>
                            Zynorvia
                        </div>
                        
                        {/* Create Button */}
                        <div className="bg-orange-500 text-white rounded-lg py-2 text-center font-bold text-[11px] shadow-[0_0_15px_rgba(249,115,22,0.3)] mx-2">
                            + Створити
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Головна */}
                            <div className="space-y-1">
                                <div className="text-[9px] font-bold text-slate-500 mb-1 px-2 uppercase tracking-wide">Головна</div>
                                <div className="flex items-center justify-between px-2 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg font-bold">
                                    <div className="flex items-center gap-2"><Layout className="w-3.5 h-3.5" /> Огляд</div>
                                </div>
                                <div className="flex items-center px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Налаштування AI</div>
                                </div>
                            </div>

                            {/* AI Інструменти */}
                            <div className="space-y-1">
                                <div className="text-[9px] font-bold text-slate-500 mb-1 px-2 uppercase tracking-wide">AI Інструменти</div>
                                <div className="flex items-center justify-between px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <div className="flex items-center gap-2"><div className="w-4 flex justify-center text-yellow-500">💡</div> Аналіз Дня</div>
                                    <div className="w-3 h-3 text-slate-600 font-bold uppercase font-sans"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                                </div>
                                <div className="flex items-center justify-between px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <div className="flex items-center gap-2"><div className="w-4 flex justify-center text-purple-500">🔮</div> AI Стратегія</div>
                                    <div className="w-3 h-3 text-slate-600 font-bold uppercase font-sans"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                                </div>
                            </div>

                            {/* Управління */}
                            <div className="space-y-1">
                                <div className="text-[9px] font-bold text-slate-500 mb-1 px-2 uppercase tracking-wide">Управління</div>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <Target className="w-3.5 h-3.5 opacity-70" /> Сфери
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <Crosshair className="w-3.5 h-3.5 opacity-70" /> Цілі
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <Layout className="w-3.5 h-3.5 opacity-70" /> Проекти
                                </div>
                            </div>

                            {/* Щоденно */}
                            <div className="space-y-1">
                                <div className="text-[9px] font-bold text-slate-500 mb-1 px-2 uppercase tracking-wide">Щоденно</div>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <CheckSquare className="w-3.5 h-3.5 opacity-70" /> Дії
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                    <ListTodo className="w-3.5 h-3.5 opacity-70" /> Розклад
                                </div>
                            </div>

                            {/* Ресурси */}
                            <div className="space-y-1">
                                <div className="text-[9px] font-bold text-slate-500 mb-1 px-2 uppercase tracking-wide">Ресурси</div>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                   <Lightbulb className="w-3.5 h-3.5 opacity-70" /> Контент
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg font-medium transition-colors">
                                   <Activity className="w-3.5 h-3.5 opacity-70" /> Аналітика
                                </div>
                            </div>
                        </div>

                        {/* Pro Banner */}
                        <div className="mt-4 border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-3 relative overflow-hidden group">
                            <div className="flex items-center gap-1.5 text-white font-bold text-[10px] mb-2 relative z-10">
                                <Zap className="w-3 h-3 text-orange-400" /> Перейти на Pro
                            </div>
                            <p className="text-[8px] text-slate-400 mb-3 relative z-10 leading-[1.3] pr-2">Розблокуйте всі AI інструменти та преміум функції для максимальної продуктивності.</p>
                            <div className="w-full py-1.5 text-center bg-orange-500 hover:bg-orange-600 transition-colors text-[9px] text-white font-bold rounded-lg relative z-10 cursor-pointer shadow-md">Оновити зараз</div>
                            <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                <Sparkles className="w-24 h-24 text-orange-500" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col bg-[#020510] overflow-hidden relative">
                        {/* Top Navbar */}
                        <div className="h-14 border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0 bg-[#0f1629]">
                            <div className="flex items-center bg-[#151c31] rounded-full px-3 py-1.5 w-[200px] lg:w-[280px] border border-slate-800 text-[10px] text-slate-500 gap-2 font-medium">
                                <Search className="w-3.5 h-3.5 text-slate-600" />
                                <span>Пошук (Цілі, Нотатки, Завдання)...</span>
                            </div>
                            <div className="flex items-center gap-5 text-slate-400">
                                <div className="relative">
                                    <Bell className="w-4 h-4 hover:text-white transition-colors" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-7 h-7 rounded-full bg-[#1b120c] border border-orange-900/50 font-bold text-orange-500 flex items-center justify-center text-[9px]">CA</div>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
                            
                            {/* Header / Title */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                                        ДЕНЬ <div className="w-1 h-1 rounded-full bg-slate-600"/> СИСТЕМА
                                    </div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Огляд Системи</h2>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <div className="text-3xl lg:text-4xl font-extrabold text-rose-500/90 leading-none flex items-center gap-2">
                                            11 <div className="w-7 h-7 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center"><Activity className="w-3.5 h-3.5 text-slate-400" /></div>
                                        </div>
                                        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">РІВЕНЬ ФОКУСУ</div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Row */}
                            <div className="flex justify-between items-center px-2 text-slate-300">
                                <div className="flex items-center gap-3">
                                   <div className="w-9 h-9 rounded-full border border-slate-700 bg-slate-800/50 flex items-center justify-center text-[9px] font-bold text-slate-300">0%</div>
                                   <div>
                                       <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                           фокус дня <div className="w-3 h-3 rounded-full border border-slate-600 flex items-center justify-center text-[7px] text-slate-400">i</div>
                                       </div>
                                       <div className="text-sm font-bold text-white">Відсутній</div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                   <div>
                                       <div className="text-sm font-bold text-white flex justify-end gap-1 mb-1">0 дн.</div>
                                       <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">СТРІК</div>
                                   </div>
                                   <div className="w-9 h-9 rounded-full border border-orange-500/20 bg-orange-500/10 flex items-center justify-center text-orange-500"><Flame className="w-4 h-4" /></div>
                                </div>
                            </div>

                            {/* Focus of the day */}
                            <div className="rounded-xl lg:rounded-2xl border border-slate-800/80 bg-[#0c1222] p-4 lg:p-6 shadow-sm">
                                <div className="flex items-center gap-2.5 text-[11px] font-bold text-white mb-6 uppercase tracking-widest"><div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.4)]"><Target className="w-3 h-3 text-white" /></div> ФОКУС ДНЯ</div>
                                
                                <div className="border border-dashed border-slate-700/60 rounded-xl p-8 lg:p-12 flex flex-col items-center justify-center text-center bg-[#0a0e1a]">
                                    <div className="w-12 h-12 rounded-full border border-orange-500/20 bg-orange-500/10 flex items-center justify-center mb-4">
                                        <Target className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <h3 className="text-base font-bold text-white mb-2">Фокус дня не визначено</h3>
                                    <p className="text-[11px] font-medium text-orange-500/70 mb-8 max-w-[250px]">Оберіть головну ціль для підвищення продуктивності</p>
                                    <div className="flex gap-4">
                                        <div className="px-5 py-2.5 mx-auto border border-slate-700/80 rounded-full text-[11px] font-bold text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors">+ Вручну</div>
                                        <div className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-full text-[11px] font-bold text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] flex items-center gap-2 cursor-pointer transition-colors"><Sparkles className="w-3 h-3"/> AI Фокус</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Grid */}
                            <div className="grid md:grid-cols-[1fr_260px] gap-6 flex-1 min-h-[200px]">
                                <div className="rounded-xl lg:rounded-2xl border border-slate-800/80 bg-[#0c1222] p-5 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-[11px] font-bold text-white">Завдання на сьогодні</div>
                                        <div className="text-[9px] font-bold text-slate-500 bg-[#161f36] px-2.5 py-1 rounded-full tracking-widest">0 / 0</div>
                                    </div>
                                    <div className="flex-1 bg-[#0a0e1a] rounded-xl border border-slate-800/40" />
                                </div>
                                <div className="rounded-xl lg:rounded-2xl border border-slate-800/80 bg-[#0c1222] p-5 flex flex-col">
                                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-white mb-6"><Activity className="w-3.5 h-3.5 text-emerald-500" /> Активність</div>
                                    
                                    <div className="flex-1 flex flex-col justify-end">
                                        <div className="flex justify-between items-end h-[60px] mb-3">
                                            {/* Bar columns */}
                                            {[
                                                [30, 20, 10, 20, 20], // ВІВ
                                                [10, 40, 25, 25, 0],  // СЕР
                                                [40, 15, 10, 5, 30],  // ЧТВ
                                                [15, 35, 20, 10, 20],  // ПТН
                                                [55, 15, 15, 5, 10],  // СУБ
                                                [25, 30, 15, 10, 20],  // НЕД
                                            ].map((col, i) => (
                                                <div key={i} className="flex flex-col justify-end gap-[3px] w-5">
                                                    {col.map((h, j) => h > 0 ? <div key={j} style={{height: `${h}%`}} className="w-full bg-[#1b253b] rounded-[2px]" /> : null)}
                                                </div>
                                            ))}
                                            {/* PON - Orange column */}
                                            <div className="flex flex-col justify-end gap-[3px] w-5 relative">
                                                <div className="w-full h-[15%] bg-[#1b253b] rounded-[2px]" />
                                                <div className="w-full h-[45%] bg-[#1b253b] rounded-[2px]" />
                                                <div className="w-full h-[30%] bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] rounded-[2px]" />
                                                {/* Tooltip dot mock */}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[7px] font-bold text-slate-500 mb-4 px-1">
                                            <div>ВІВ</div><div>СЕР</div><div>ЧТВ</div><div>ПТН</div><div>СУБ</div><div>НЕД</div><div className="text-orange-500">ПОН</div>
                                        </div>
                                        <div className="flex justify-end gap-3 text-[7px] text-slate-500 font-bold uppercase">
                                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#1b253b]" /> ПУСТО</div>
                                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ВИКОНАНО</div>
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
        <section className="px-4 max-w-6xl mx-auto text-center mt-32">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Чому інші додатки не працюють</h2>
          <p className="text-xl text-slate-400 max-w-4xl mx-auto mb-20 leading-relaxed">
             Більшість додатків лише керують вашими завданнями, але не структурою вашого життя. Результат? Нескінченні списки справ, які лише посилюють тривогу та стрес.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
             {[
               { icon: <ListTodo className="w-10 h-10 text-rose-400" />, title: "Занадто багато справ", desc: "Сотні невиконаних завдань без реального прогресу у важливих сферах." },
               { icon: <Crosshair className="w-10 h-10 text-rose-400" />, title: "Відсутність системи", desc: "Ви ставите великі цілі 1 січня, але забуваєте про них вже до 15-го." },
               { icon: <Brain className="w-10 h-10 text-rose-400" />, title: "Ментальне перевантаження", desc: "Інструменти планування стають настільки хаотичними, що ви перестаєте ними користуватися." }
             ].map((pain, i) => (
                <div key={i} className="p-10 rounded-3xl bg-white/5 border border-white/5 text-left">
                   <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-8">
                      {pain.icon}
                   </div>
                   <h3 className="text-2xl font-bold mb-4">{pain.title}</h3>
                   <p className="text-lg text-slate-400 leading-relaxed">{pain.desc}</p>
                </div>
             ))}
          </div>
        </section>

        {/* SECTION 3 — THE SOLUTION */}
        <section className="px-4 max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 rounded-[3rem] p-10 md:p-20 border border-white/10 md:flex items-center gap-16">
             <div className="md:w-1/2 mb-12 md:mb-0">
                <span className="text-indigo-400 font-bold tracking-widest uppercase text-base mb-6 block">РІШЕННЯ</span>
                <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">Ваша Персональна Система Життя</h2>
                <p className="text-slate-400 text-xl leading-relaxed mb-10">
                   Zynorvia — це "Операційна Система Життя", яка об'єднує ваші життєві сфери, великі цілі, щоденні завдання та звички на одній платформі під керівництвом штучного інтелекту. Все працює в гармонії.
                </p>
                <ul className="space-y-6">
                   {['Організація за сферами (Здоров\'я, Фінанси тощо)', 'Прив\'язка завдань безпосередньо до цілей', 'Відстеження щоденних звичок', 'Інтелектуальні підказки від ШІ'].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-300 text-lg">
                         <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <Check className="w-5 h-5 text-indigo-400" />
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
        <section className="px-4 max-w-5xl mx-auto text-center">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-500/20 mb-10 border border-indigo-500/30">
              <Brain className="w-10 h-10 text-indigo-400" />
           </div>
           <h2 className="text-5xl md:text-6xl font-bold mb-8">ШІ Побудує Вашу Систему за Секунди</h2>
           <p className="text-xl text-slate-400 max-w-4xl mx-auto mb-16 leading-relaxed">
              Не знаєте з чого почати? Дайте відповідь на кілька запитань про ваші бажання, і наш штучний інтелект миттєво згенерує повноцінний структурований життєвий план.
           </p>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { label: "Сфери Життя", icon: <Target className="w-6 h-6" /> },
                { label: "Розумні Цілі", icon: <Crosshair className="w-6 h-6" /> },
                { label: "Тижневі Завдання", icon: <ListTodo className="w-6 h-6" /> },
                { label: "Щоденні Звички", icon: <CheckCircle2 className="w-6 h-6" /> },
              ].map((item, i) => (
                 <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4">
                    <div className="text-indigo-400">{item.icon}</div>
                    <div className="font-bold text-base text-slate-300">{item.label}</div>
                 </div>
              ))}
           </div>
        </section>

        {/* SECTION 5 — HOW IT WORKS */}
        <section id="how-it-works" className="px-4 py-24 bg-slate-900/50 border-y border-white/5 relative">
          <div className="max-w-6xl mx-auto">
             <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-bold mb-6">Як це працює</h2>
               <p className="text-xl text-slate-400">Три прості кроки до ясності.</p>
             </div>
             
             <div className="grid md:grid-cols-3 gap-12 relative">
                {/* Connecting line for desktop */}
                <div className="hidden md:block absolute top-[55px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                
                {[
                  { step: "01", title: "Розкажіть ШІ про цілі", desc: "Поспілкуйтесь з нашим ШІ-коучем про те, де ви є і чого прагнете." },
                  { step: "02", title: "ШІ будує структуру", desc: "Спостерігайте, як ваші бажання розбиваються на конкретні проекти та звички." },
                  { step: "03", title: "Слідуйте фокусу", desc: "Прокидайтеся щодня, знаючи точний план дій для успіху." }
                ].map((item, i) => (
                   <div key={i} className="relative text-center z-10 px-6">
                      <div className="w-28 h-28 mx-auto bg-slate-950 border border-white/10 rounded-full flex items-center justify-center text-3xl font-extrabold text-indigo-400 mb-8 shadow-2xl">
                         {item.step}
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                      <p className="text-lg text-slate-400 leading-relaxed">{item.desc}</p>
                   </div>
                ))}
             </div>
          </div>
        </section>

        {/* SECTION 6 — KEY FEATURES */}
        <section className="px-4 max-w-6xl mx-auto">
           <h2 className="text-4xl md:text-6xl font-bold mb-16 text-center">Все, що потрібно. Нічого зайвого.</h2>
           
           <div className="grid md:grid-cols-2 gap-10">
              {[
                { title: "AI Планування Життя", desc: "Миттєво перетворюйте абстрактні думки на структуровану базу реальних цілей.", icon: <Brain className="w-8 h-8"/> },
                { title: "Система Цілей і Завдань", desc: "Ніколи не втрачайте контекст. Усі завдання прямо прив'язані до ваших масштабних цілей.", icon: <Target className="w-8 h-8"/> },
                { title: "Управління Сферами", desc: "Збалансовуйте Здоров'я, Фінанси, Стосунки та інше в окремих панелях.", icon: <Lightbulb className="w-8 h-8"/> },
                { title: "Дашборд Щоденного Фокусу", desc: "Вимкніть зайвий шум. Бачте лише найважливіші завдання і звички, заплановані на сьогодні.", icon: <Focus className="w-8 h-8"/> },
              ].map((feat, i) => (
                 <div key={i} className="flex gap-8 p-8 rounded-[2.5rem] bg-white/5 hover:bg-white/[0.07] border border-white/5 transition-colors group">
                    <div className="w-20 h-20 shrink-0 rounded-3xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                       {feat.icon}
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold mb-3">{feat.title}</h3>
                       <p className="text-base text-slate-400 leading-relaxed">{feat.desc}</p>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* SECTION 7 — PRODUCT SCREENSHOTS */}
        <section className="px-4 max-w-6xl mx-auto space-y-32">
            {/* Screenshot 1 */}
            <div className="md:flex items-center gap-16 flex-row-reverse">
                <div className="md:w-1/2 mb-10 md:mb-0">
                    <h3 className="text-4xl font-bold mb-6">Кришталево Чистий Дашборд</h3>
                    <p className="text-xl text-slate-400 leading-relaxed">Усе ваше життя як на долоні. Відстежуйте прогрес, переглядайте дедлайни та бачте свій щоденний фокус — усе зібрано у найкрасивішому просторі.</p>
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
            <div className="md:flex items-center gap-16">
                <div className="md:w-1/2 mb-10 md:mb-0">
                    <h3 className="text-4xl font-bold mb-6">Глибоке Планування з AI</h3>
                    <p className="text-xl text-slate-400 leading-relaxed">Спілкуйтеся зі своєю системою. Штучний інтелект розуміє контекст вашого життя і автоматично створює об'єкти в базі даних для кожної вашої обіцянки.</p>
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
        <section className="px-4 py-32 bg-gradient-to-b from-transparent to-slate-900/50">
           <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-16">Що кажуть перші користувачі</h2>
              <div className="grid md:grid-cols-2 gap-8">
                 <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl text-left relative">
                    <span className="text-5xl text-indigo-500/20 absolute top-6 left-6">"</span>
                    <p className="text-lg text-slate-300 relative z-10 italic mb-8">"Нарешті додаток, який розуміє, що тренування пов'язано з моєю метою здоров'я. Він побудував всю мою систему буквально за 2 хвилини."</p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center"><User className="w-6 h-6 text-indigo-400"/></div>
                       <div><div className="font-bold text-base">Денис</div><div className="text-sm text-slate-500">Ранній користувач</div></div>
                    </div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl text-left relative">
                    <span className="text-5xl text-emerald-500/20 absolute top-6 left-6">"</span>
                    <p className="text-lg text-slate-300 relative z-10 italic mb-8">"Екран Фокусу кардинально змінив мій день. Я більше не бачу 100 справ, які треба зробити за місяць, я бачу ті 3 речі, які потрібно зробити прямо зараз."</p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center"><User className="w-6 h-6 text-emerald-400"/></div>
                       <div><div className="font-bold text-base">Олександр</div><div className="text-sm text-slate-500">Підприємець</div></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 9 — PRICING */}
        <section className="px-4 py-32 max-w-6xl mx-auto">
           <div className="text-center mb-20">
             <h2 className="text-4xl md:text-6xl font-bold mb-6">Прозорі Тарифи</h2>
             <p className="text-xl text-slate-400">Почніть організовувати життя безкоштовно, або розблокуйте силу ШІ з преміум планом.</p>
           </div>
           
           <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="p-10 md:p-12 rounded-[3.5rem] border border-slate-800 bg-slate-900/50 relative flex flex-col">
                 <h3 className="text-3xl font-bold mb-4">Базовий</h3>
                 <div className="text-5xl font-extrabold mb-8">₴0</div>
                 <ul className="space-y-5 mb-10 flex-1">
                    <li className="flex items-center gap-4 text-slate-300 text-base md:text-lg"><Check className="w-6 h-6 text-emerald-500"/> Основні Цілі та Завдання</li>
                    <li className="flex items-center gap-4 text-slate-300 text-base md:text-lg"><Check className="w-6 h-6 text-emerald-500"/> Базові Сфери Життя</li>
                    <li className="flex items-center gap-4 text-slate-300 text-base md:text-lg"><Check className="w-6 h-6 text-emerald-500"/> Трекінг Звичок</li>
                    <li className="flex items-center gap-4 text-slate-500 text-base md:text-lg"><Check className="w-6 h-6 text-slate-700"/> Обмежений ШІ-Помічник</li>
                 </ul>
                 <Link href="/register" className="w-full py-5 rounded-2xl border border-white/10 hover:bg-white/5 text-center font-bold text-lg transition-colors">
                    Почати Безкоштовно
                 </Link>
              </div>

              {/* Pro Plan */}
              <div className="p-10 md:p-12 rounded-[3.5rem] border-2 border-primary bg-primary/5 relative flex flex-col shadow-[0_0_40px_-10px_rgba(79,70,229,0.3)] transform md:-translate-y-4">
                 <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-primary text-white text-sm font-bold px-5 py-2 rounded-full uppercase tracking-wider">Найпопулярніший</div>
                 <h3 className="text-3xl font-bold mb-4 flex items-center gap-3 text-primary">Pro План <Zap className="w-6 h-6 fill-current" /></h3>
                 <div className="text-5xl font-extrabold mb-2">₴199<span className="text-2xl text-slate-400 font-medium">/міс</span></div>
                 <p className="text-sm text-indigo-400 mb-8 font-semibold">Оплата щомісяця</p>
                 <ul className="space-y-5 mb-10 flex-1">
                    <li className="flex items-center gap-4 text-slate-200 text-base md:text-lg"><Check className="w-6 h-6 text-primary"/> Безлімітне ШІ-Планування</li>
                    <li className="flex items-center gap-4 text-slate-200 text-base md:text-lg"><Check className="w-6 h-6 text-primary"/> Розширений ШІ-Аналіз</li>
                    <li className="flex items-center gap-4 text-slate-200 text-base md:text-lg"><Check className="w-6 h-6 text-primary"/> Необмежені Звички та Проекти</li>
                    <li className="flex items-center gap-4 text-slate-200 text-base md:text-lg"><Check className="w-6 h-6 text-primary"/> Пріоритетна Підтримка</li>
                 </ul>
                 <Link href="/register?plan=pro" className="w-full py-5 rounded-2xl bg-primary hover:bg-primary/90 text-white text-center font-bold text-xl transition-colors shadow-lg shadow-primary/20">
                    Отримати Суперсилу
                 </Link>
              </div>
           </div>
        </section>

        {/* SECTION 10 — FINAL CTA */}
        <section className="px-4 py-32 max-w-6xl mx-auto text-center">
           <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 rounded-[4rem] p-16 md:p-32 border border-white/10 relative overflow-hidden shadow-[0_0_50px_-10px_rgba(79,70,229,0.3)]">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
              <div className="relative z-10">
                 <h2 className="text-5xl md:text-7xl font-extrabold mb-8 text-white text-shadow-sm leading-tight">Візьміть Контроль над Життям</h2>
                 <p className="text-indigo-200 text-xl md:text-2xl mb-16 max-w-3xl mx-auto leading-relaxed">
                    Приєднуйтесь до тисяч людей, які припинили дрейфувати і почали будувати власну життєву систему вже сьогодні.
                 </p>
                 <Link href={ctaLink} className="inline-flex items-center justify-center gap-4 px-12 py-6 rounded-full bg-white text-indigo-950 font-bold text-xl hover:bg-slate-100 transition-transform hover:scale-105 active:scale-95 shadow-xl">
                    {ctaText} <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><ArrowRight className="w-4 h-4 text-indigo-900" /></div>
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
