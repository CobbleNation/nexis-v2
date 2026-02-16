import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <MobileNav />
            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
                <Header />
                <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 relative overflow-y-auto h-[calc(100vh-4rem)] scroll-smooth">
                    {children}
                </main>
            </div>
        </div>
    );
}
