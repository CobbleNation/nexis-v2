"use client"

import Link from "next/link"
import { Sparkles, Menu, X, ArrowRight, LogOut, Settings, LayoutDashboard, Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useData } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function LandingHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Lock body scroll when mobile menu is open (fixes iOS Safari scroll break)
    useEffect(() => {
        if (mobileMenuOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [mobileMenuOpen]);

    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
    const { state } = useData();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const isPro = user?.subscriptionTier === 'pro';

    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-white/90 dark:bg-[#020817]/90 backdrop-blur-sm md:backdrop-blur-xl transform-gpu">
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
                    {user ? (
                        <div className="hidden sm:flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 py-1 pl-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none ring-0">
                                        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-800 shrink-0">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold text-xs flex items-center justify-center">
                                                {user.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                                                {user.name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                                                {isPro ? 'Pro План' : 'Безкоштовно'}
                                            </span>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 mt-2">
                                    <DropdownMenuLabel>Мій Акаунт</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/overview" className="cursor-pointer flex items-center w-full">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            <span>Перейти в застосунок</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings" className="cursor-pointer flex items-center w-full">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Налаштування</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />

                                    <div className="p-2">
                                        <p className="text-xs font-medium text-slate-500 mb-2 px-2">Тема</p>
                                        <div className="flex items-center justify-between gap-1">
                                            <Button
                                                variant={theme === 'light' ? 'secondary' : 'ghost'}
                                                size="sm"
                                                className="w-full h-8 px-2 justify-center"
                                                onClick={() => setTheme('light')}
                                            >
                                                <Sun className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant={theme === 'dark' ? 'secondary' : 'ghost'}
                                                size="sm"
                                                className="w-full h-8 px-2 justify-center"
                                                onClick={() => setTheme('dark')}
                                            >
                                                <Moon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant={theme === 'system' ? 'secondary' : 'ghost'}
                                                size="sm"
                                                className="w-full h-8 px-2 justify-center"
                                                onClick={() => setTheme('system')}
                                            >
                                                <Monitor className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => logout()}
                                        className="text-red-600 focus:text-red-500 focus:bg-red-100 dark:focus:bg-red-900/30 cursor-pointer"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Вийти з акаунта</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="sm:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu overlay + panel */}
            {mobileMenuOpen && (
                <div
                    className="sm:hidden fixed inset-0 top-16 z-40 bg-black/20 dark:bg-black/40"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
            )}
            <div className={cn(
                "sm:hidden fixed top-16 left-0 right-0 z-50 transition-all duration-300 ease-out bg-white dark:bg-[#020817] border-b border-slate-200 dark:border-slate-800 shadow-xl",
                mobileMenuOpen
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "-translate-y-2 opacity-0 pointer-events-none"
            )}>
                <div className="container mx-auto px-6 py-4 space-y-3">
                    <Link href="/#features" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Можливості
                    </Link>
                    <Link href="/#workflow" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Методологія
                    </Link>
                    <Link href="/pricing" onClick={closeMobileMenu} className="block py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Тарифи
                    </Link>
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {user ? (
                            <Link href="/overview" onClick={closeMobileMenu}>
                                <Button className="w-full rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold flex items-center justify-center gap-2">
                                    Перейти в продукт <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" onClick={closeMobileMenu}>
                                    <Button variant="ghost" className="w-full justify-center text-slate-600 dark:text-slate-300">
                                        Увійти
                                    </Button>
                                </Link>
                                <Link href="/register" onClick={closeMobileMenu}>
                                    <Button className="w-full rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold">
                                        Спробувати безкоштовно
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
