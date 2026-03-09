import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { LandingHero } from "@/components/landing/LandingHero"
import dynamic from "next/dynamic"
import { getSession } from "@/lib/auth-utils"

const LandingFeatures = dynamic(() => import("@/components/landing/LandingFeatures").then(mod => mod.LandingFeatures), {
  loading: () => <div className="h-96" />
})

const LandingMethodology = dynamic(() => import("@/components/landing/LandingMethodology").then(mod => mod.LandingMethodology), {
  loading: () => <div className="h-96" />
})

const LandingCTA = dynamic(() => import("@/components/landing/LandingCTA").then(mod => mod.LandingCTA), {
  loading: () => <div className="h-96" />
})

export default async function LandingPage() {
  const user = await getSession();

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

      <main className="flex-1 z-10 pt-32 pb-20 space-y-32">
        <LandingHero user={user} />
        <LandingFeatures />
        <LandingMethodology user={user} />
        <LandingCTA user={user} />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
