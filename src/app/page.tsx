import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { getSession } from "@/lib/auth-utils"
import Link from "next/link"
import { ArrowRight, Brain, CheckCircle2, Target, Focus, CheckCircle, Crosshair, ListTodo, Lightbulb, User, Check, Zap, CheckSquare } from "lucide-react"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zynorvia - AI Life Operating System',
  description: 'Stop living in chaos. Zynorvia uses AI to organize your goals, tasks, habits, and life priorities into one simple system.',
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
        <section className="px-4 text-center max-w-5xl mx-auto mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <SparklesIcon className="w-4 h-4" />
            <span>Нове: ШІ автоматично створює вашу систему</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Stop Living in Chaos.<br />Build a System for Your Life.
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Zynorvia uses AI to organize your goals, tasks, habits and life priorities into one simple system that keeps you focused every day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ctaLink} className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
              {ctaText} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold text-lg border border-white/10 flex items-center justify-center transition-colors">
              See How It Works
            </Link>
          </div>
          
          <div className="mt-20 relative mx-auto max-w-4xl">
             <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent z-10" />
             <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-2 shadow-2xl relative overflow-hidden">
                <img src="/dashboard-preview.png" alt="Zynorvia Dashboard Interface" className="w-full h-auto rounded-xl object-cover opacity-90 block" />
             </div>
          </div>
        </section>

        {/* SECTION 2 — THE PROBLEM */}
        <section className="px-4 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Most Productivity Apps Fail</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-16 text-lg">
             Most apps only manage your tasks, but they don't manage your life structure. The result? Endless to-do lists that just make you feel more anxious.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
             {[
               { icon: <ListTodo className="w-8 h-8 text-rose-400" />, title: "Too Many Tasks", desc: "You have hundreds of unchecked boxes but no real progress towards meaning." },
               { icon: <Crosshair className="w-8 h-8 text-rose-400" />, title: "No System", desc: "You set big goals on January 1st, but forget about them by January 15th." },
               { icon: <Brain className="w-8 h-8 text-rose-400" />, title: "Mental Overload", desc: "Planning tools become so messy that you stop using them entirely." }
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
                <span className="text-indigo-400 font-semibold tracking-wider uppercase text-sm mb-4 block">The Solution</span>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Personal Life System</h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                   Zynorvia is a "Life Operating System" that combines your life areas, big goals, daily tasks, and habits into one unified platform guided by AI. Everything works together.
                </p>
                <ul className="space-y-4">
                   {['Organize by Life Areas (Health, Wealth, etc.)', 'Link Tasks directly to Goals', 'Track Daily Habits', 'AI intelligent guidance'].map((item, i) => (
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
                               <div className="font-semibold">Goal: Run Marathon</div>
                               <div className="text-xs text-slate-400">Area: Health</div>
                            </div>
                         </div>
                      </div>
                      <div className="scale-95 opacity-80 bg-white/5 p-4 rounded-xl flex items-center justify-between ml-4 border-l-2 border-indigo-500">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><ListTodo className="w-4 h-4 text-blue-400"/></div>
                            <div>
                               <div className="text-sm font-semibold">Task: Buy running shoes</div>
                               <div className="text-[10px] text-slate-400">Linked to Goal</div>
                            </div>
                         </div>
                      </div>
                      <div className="scale-90 opacity-60 bg-white/5 p-4 rounded-xl flex items-center justify-between ml-8 border-l-2 border-indigo-500">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><CheckSquare className="w-4 h-4 text-purple-400"/></div>
                            <div>
                               <div className="text-sm font-semibold">Habit: Run 5km Daily</div>
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
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 mb-8 border border-indigo-500/30">
              <Brain className="w-8 h-8 text-indigo-400" />
           </div>
           <h2 className="text-4xl md:text-5xl font-bold mb-6">AI Builds Your Life System in Seconds</h2>
           <p className="text-slate-400 text-lg max-w-3xl mx-auto mb-12">
              Don't know where to start? Answer a few questions about your struggles and ambitions, and our AI will generate a complete, structured life plan for you instantly.
           </p>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: "Life Areas", icon: <Target className="w-5 h-5" /> },
                { label: "Smart Goals", icon: <Crosshair className="w-5 h-5" /> },
                { label: "Weekly Tasks", icon: <ListTodo className="w-5 h-5" /> },
                { label: "Daily Habits", icon: <CheckCircle2 className="w-5 h-5" /> },
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
          <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
               <p className="text-slate-400">Three simple steps to clarity.</p>
             </div>
             
             <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting line for desktop */}
                <div className="hidden md:block absolute top-[45px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                
                {[
                  { step: "01", title: "Tell AI your goals", desc: "Chat with our AI coach about where you are and where you want to be." },
                  { step: "02", title: "AI builds structure", desc: "Watch as your goals are broken down into actionable projects and habits." },
                  { step: "03", title: "Follow daily focus", desc: "Wake up every day knowing exactly what one thing you need to focus on." }
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
        <section className="px-4 max-w-6xl mx-auto">
           <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">Everything You Need. Nothing You Don't.</h2>
           
           <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: "AI Life Planning", desc: "Instantly turn raw thoughts into a structured database of goals and actions.", icon: <Brain /> },
                { title: "Goal & Task System", desc: "Never lose track. Tasks are linked directly to your high-level life goals.", icon: <Target /> },
                { title: "Life Areas Management", desc: "Balance Health, Wealth, Relationships and more using dedicated dashboards.", icon: <Lightbulb /> },
                { title: "Daily Focus Dashboard", desc: "Silence the noise. See only the vital tasks and habits scheduled for today.", icon: <Focus /> },
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
        <section className="px-4 max-w-6xl mx-auto space-y-20">
            {/* Screenshot 1 */}
            <div className="md:flex items-center gap-12 flex-row-reverse">
                <div className="md:w-1/2 mb-8 md:mb-0">
                    <h3 className="text-3xl font-bold mb-4">Crystal Clear Dashboard</h3>
                    <p className="text-slate-400 text-lg">Your entire life, measurable at a glance. Track metric progress, view upcoming deadlines, and see your daily completions.</p>
                </div>
                <div className="md:w-1/2 rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl relative">
                    <div className="aspect-[4/3] flex items-center justify-center text-slate-600 bg-slate-950 font-medium">Dashboard Interface Placeholder</div>
                </div>
            </div>
            {/* Screenshot 2 */}
            <div className="md:flex items-center gap-12">
                <div className="md:w-1/2 mb-8 md:mb-0">
                    <h3 className="text-3xl font-bold mb-4">Deep Planning Chat</h3>
                    <p className="text-slate-400 text-lg">Talk to your system. The AI understands context and automatically creates database entries for every promise you make to yourself.</p>
                </div>
                <div className="md:w-1/2 rounded-2xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl relative">
                    <div className="aspect-[4/3] flex items-center justify-center text-slate-600 bg-slate-950 font-medium">AI Chat Interface Placeholder</div>
                </div>
            </div>
        </section>

        {/* SECTION 8 — SOCIAL PROOF */}
        <section className="px-4 py-20 border-y border-white/5 bg-gradient-to-b from-transparent to-slate-900/50">
           <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12">What Early Users Are Saying</h2>
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-left relative">
                    <span className="text-4xl text-indigo-500/20 absolute top-4 left-4">"</span>
                    <p className="text-slate-300 relative z-10 italic mb-6">"Finally an app that understands that a gym habit is connected to my health goal. It built my whole system in literally 2 minutes."</p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center"><User className="w-5 h-5 text-indigo-400"/></div>
                       <div><div className="font-bold text-sm">Denys</div><div className="text-xs text-slate-500">Early Adopter</div></div>
                    </div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-left relative">
                    <span className="text-4xl text-emerald-500/20 absolute top-4 left-4">"</span>
                    <p className="text-slate-300 relative z-10 italic mb-6">"The 'Daily Focus' view changed my life. I don't see the 100 things I have to do this month, I only see the 3 things I need to do right now."</p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><User className="w-5 h-5 text-emerald-400"/></div>
                       <div><div className="font-bold text-sm">Alex</div><div className="text-xs text-slate-500">Entrepreneur</div></div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 9 — PRICING */}
        <section className="px-4 max-w-5xl mx-auto">
           <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
             <p className="text-slate-400">Start organizing for free, upgrade when you need AI superpowers.</p>
           </div>
           
           <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Free Plan */}
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/50 relative flex flex-col">
                 <h3 className="text-2xl font-bold mb-2">Free Plan</h3>
                 <div className="text-3xl font-bold mb-6">$0</div>
                 <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-slate-300 text-sm"><Check className="w-4 h-4 text-emerald-500"/> Basic Goals & Tasks</li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm"><Check className="w-4 h-4 text-emerald-500"/> Core Life Areas</li>
                    <li className="flex items-center gap-3 text-slate-300 text-sm"><Check className="w-4 h-4 text-emerald-500"/> Daily Habit Tracking</li>
                    <li className="flex items-center gap-3 text-slate-500 text-sm"><Check className="w-4 h-4 text-slate-700"/> Limited AI Usage</li>
                 </ul>
                 <Link href="/register" className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-center font-semibold transition-colors">
                    Start for Free
                 </Link>
              </div>

              {/* Pro Plan */}
              <div className="p-8 rounded-3xl border-2 border-primary bg-primary/5 relative flex flex-col shadow-[0_0_30px_-10px_rgba(79,70,229,0.3)] transform md:-translate-y-4">
                 <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                 <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-primary">Pro Plan <Zap className="w-5 h-5 fill-current" /></h3>
                 <div className="text-3xl font-bold mb-1">$9<span className="text-lg text-slate-400 font-normal">/mo</span></div>
                 <p className="text-xs text-indigo-400 mb-5 font-medium">Billed annually</p>
                 <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-slate-200 text-sm"><Check className="w-4 h-4 text-primary"/> Unlimited AI Goal Planning</li>
                    <li className="flex items-center gap-3 text-slate-200 text-sm"><Check className="w-4 h-4 text-primary"/> Advanced AI Insights</li>
                    <li className="flex items-center gap-3 text-slate-200 text-sm"><Check className="w-4 h-4 text-primary"/> Unlimited Habits & Projects</li>
                    <li className="flex items-center gap-3 text-slate-200 text-sm"><Check className="w-4 h-4 text-primary"/> Priority Email Support</li>
                 </ul>
                 <Link href="/register?plan=pro" className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-center font-semibold transition-colors">
                    Get Pro Superpowers
                 </Link>
              </div>
           </div>
        </section>

        {/* SECTION 10 — FINAL CTA */}
        <section className="px-4 max-w-4xl mx-auto text-center mt-20">
           <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 rounded-[3rem] p-12 md:p-20 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
              <div className="relative z-10">
                 <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white text-shadow-sm">Take Control of Your Life</h2>
                 <p className="text-indigo-200 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                    Join thousands of people who stopped drifting and started building their personal systems today.
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
