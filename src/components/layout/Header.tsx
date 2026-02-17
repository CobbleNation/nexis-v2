'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, ChevronRight, Calendar as CalendarIcon, Hash, Plus, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useData } from "@/lib/store";
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { VoiceAssistantButton } from '@/components/ai/VoiceAssistantButton';

import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const segments = pathname.split('/').filter(Boolean);
    const { state, dispatch } = useData();
    const { isActive, currentStep, nextStep } = useOnboarding();

    // Sync URL -> State (Area Context)
    React.useEffect(() => {
        const isAreaPage = pathname.startsWith('/areas/');
        if (isAreaPage) {
            const areaId = pathname.split('/areas/')[1];
            if (areaId && areaId !== state.selectedAreaId) {
                dispatch({ type: 'SET_AREA', payload: areaId });
            }
        }
    }, [pathname, state.selectedAreaId, dispatch]);

    // Enhanced Breadcrumbs
    const breadcrumbs = React.useMemo(() => {
        const baseSegments = pathname.split('/').filter(Boolean);

        // Inject Area into breadcrumbs if on Activity page and filtered by Area
        if (pathname === '/activity' && state.selectedAreaId !== 'all') {
            const area = state.areas.find(a => a.id === state.selectedAreaId);
            if (area) {
                return [
                    { title: 'Сфери', href: '#' }, // Non-clickable or redirect to /areas if exists
                    { title: area.title, href: `/areas/${area.id}` },
                    { title: 'Активність', href: '/activity', isLast: true }
                ];
            }
        }

        return baseSegments.map((segment, index) => {
            const href = `/${baseSegments.slice(0, index + 1).join('/')}`;
            // 1. Check if segment is an Area ID or Project ID
            const area = state.areas.find(a => a.id === segment);
            const project = state.projects.find(p => p.id === segment);

            let displayTitle = segment;
            let displayHref = href;

            if (area) {
                displayTitle = area.title;
            } else if (project) {
                displayTitle = project.title;
            } else {
                // 2. Standard Translations
                const capitalized = segment.charAt(0).toUpperCase() + segment.slice(1);
                switch (capitalized) {
                    case 'Overview': displayTitle = 'Огляд'; break;
                    case 'Actions': displayTitle = 'Завдання'; break;
                    case 'Goals': displayTitle = 'Цілі та Проекти'; break;
                    case 'Projects':
                        displayTitle = 'Цілі та Проекти';
                        displayHref = '/goals?tab=projects';
                        break;
                    case 'Areas': displayTitle = 'Сфери'; break;
                    case 'Timeline': displayTitle = 'Розклад'; break;
                    case 'Insights': displayTitle = 'Інсайти'; break;
                    case 'Settings': displayTitle = 'Налаштування'; break;
                    case 'Activity': displayTitle = 'Активність'; break;
                    case 'Content': displayTitle = 'Контент'; break;
                    default: displayTitle = capitalized;
                }
            }

            return {
                title: displayTitle,
                href: displayHref,
                isLast: index === baseSegments.length - 1
            };
        });
    }, [pathname, state.selectedAreaId, state.areas, state.projects]);


    // Quick Add Modal Trigger (via Cmd+K or Button)
    // We'll use the QuickAddModal inside the header or trigger it via a state/event
    // For simplicity, we can dispatch a 'OPEN_QUICK_ADD' if stored in state, 
    // BUT since QuickAddModal is currently local to pages or components, we should lift it OR 
    // better yet, just render it here and control it.
    // Quick Add Modal Trigger (Global)
    const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);

    // Helper to get context from current route
    const getCurrentContext = () => {
        const isAreaPage = pathname.startsWith('/areas/');
        const areaId = isAreaPage ? pathname.split('/areas/')[1] : 'all';

        if (pathname.includes('/content')) return { tab: 'content', areaId };

        let tab = 'task';

        if (pathname.includes('timeline')) tab = 'event';

        return { tab, areaId };
    };

    const [quickAddContext, setQuickAddContext] = React.useState<{
        tab: string;
        areaId: string;
        initialData?: any;
    }>({ tab: 'task', areaId: 'all' });

    // Global Listeners
    React.useEffect(() => {
        const handleShortcut = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsQuickAddOpen((prev) => {
                    if (!prev) {
                        // If opening, sync with current context
                        setQuickAddContext(getCurrentContext());
                    }
                    return !prev;
                });
            }
        }

        const handleCustomOpen = (e: any) => {
            const detail = e.detail || {};
            setQuickAddContext({
                tab: detail.tab || 'task',
                areaId: detail.areaId || getCurrentContext().areaId,
                initialData: detail.initialData // Capture initial data
            });
            setIsQuickAddOpen(true);
        };

        window.addEventListener('keydown', handleShortcut);
        window.addEventListener('zynorvia:open-quick-add', handleCustomOpen);

        return () => {
            window.removeEventListener('keydown', handleShortcut);
            window.removeEventListener('zynorvia:open-quick-add', handleCustomOpen);
        };
    }, [pathname]); // removed isQuickAddOpen dep to avoid old closure

    // Daily Journal Reminder (19:00 - 21:00)
    React.useEffect(() => {
        const checkJournalReminder = () => {
            const now = new Date();
            const hour = now.getHours();

            // Check between 19:00 (7 PM) and 21:00 (9 PM)
            if (hour >= 19 && hour <= 21) {
                const todayStr = now.toISOString().split('T')[0];
                const storageKey = `journal-reminder-${todayStr}`;
                const hasReminded = localStorage.getItem(storageKey);

                if (!hasReminded) {
                    // Check if entry exists
                    const hasEntry = state.journal?.some((j: any) => {
                        const jDate = (j.date instanceof Date)
                            ? j.date.toISOString().split('T')[0]
                            : (typeof j.date === 'string' ? j.date.split('T')[0] : String(j.date));
                        return jDate === todayStr;
                    });

                    if (!hasEntry) {
                        toast("Час для рефлексії 🌙", {
                            description: "Як пройшов твій день? Запиши свої думки у щоденник.",
                            action: {
                                label: "Записати",
                                onClick: () => {
                                    setQuickAddContext({ tab: 'content', areaId: 'all' });
                                    setIsQuickAddOpen(true);
                                }
                            },
                            duration: Infinity, // Keep until interaction
                        });
                        localStorage.setItem(storageKey, 'true');
                    }
                }
            }
        };

        // Check immediately on mount, then every 5 minutes
        checkJournalReminder();
        const interval = setInterval(checkJournalReminder, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [state.journal]);

    const handleAreaChange = (val: string) => {
        const isAreaPage = pathname.startsWith('/areas/');

        if (isAreaPage) {
            // If we are individually viewing an area, switching the selector should switch the view
            if (val === 'all') {
                router.push('/overview');
                dispatch({ type: 'SET_AREA', payload: 'all' });
            } else {
                router.push(`/areas/${val}`);
            }
        } else {
            // If we are on Overview, Activity, or other global pages, 
            // just update the filter context without redirecting
            dispatch({ type: 'SET_AREA', payload: val });
        }
    };

    return (
        <header id="header-container" className="h-16 border-b border-border/50 px-4 md:px-6 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-30 transition-all">
            {/* Quick Add Modal (Global) */}
            <QuickAddModal
                open={isQuickAddOpen}
                onOpenChange={setIsQuickAddOpen}
                defaultTab={quickAddContext.tab}
                defaultAreaId={quickAddContext.areaId}
                initialData={quickAddContext.initialData}
            />

            {/* Left: Breadcrumbs */}
            <div className="hidden md:flex items-center gap-3 text-sm px-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground/60 overflow-hidden">
                    <Link href="/" className="hover:text-foreground transition-colors flex items-center">
                        <Home className="h-4 w-4" />
                    </Link>

                    {breadcrumbs.map((crumb: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="text-muted-foreground/40">/</span>
                            {crumb.isLast ? (
                                <span className="font-semibold text-foreground/80 truncate">
                                    {crumb.title}
                                </span>
                            ) : (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-foreground hover:underline underline-offset-4 transition-all truncate"
                                >
                                    {crumb.title}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: Search (Desktop) */}
            <GlobalSearch />

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Context Switcher */}
                <div className="hidden md:flex items-center gap-2">
                    <Select
                        value={state.period}
                        onValueChange={(val: string) => dispatch({ type: 'SET_PERIOD', payload: val as any })}
                    >
                        <SelectTrigger id="schedule-view-selector" className="w-[120px] h-9 bg-white dark:bg-secondary/80 border-transparent shadow-sm hover:shadow-md hover:bg-orange-50 dark:hover:bg-primary/10 hover:text-orange-700 dark:hover:text-primary rounded-full text-xs font-bold text-foreground transition-all cursor-pointer">
                            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-primary" />
                            <SelectValue placeholder="Період" />
                        </SelectTrigger>
                        <SelectContent className="border-none shadow-xl rounded-xl p-1">
                            <SelectItem value="year" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">Рік</SelectItem>
                            <SelectItem value="month" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">Місяць</SelectItem>
                            <SelectItem value="week" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">Тиждень</SelectItem>
                            <SelectItem value="day" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer">День</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={state.selectedAreaId}
                        onValueChange={handleAreaChange}
                    >
                        <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-secondary/80 border-transparent shadow-sm hover:shadow-md hover:bg-orange-50 dark:hover:bg-primary/10 hover:text-orange-700 dark:hover:text-primary rounded-full text-xs font-bold text-foreground transition-all cursor-pointer">
                            <Hash className="mr-2 h-3.5 w-3.5 text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-primary" />
                            <SelectValue placeholder="Сфера" />
                        </SelectTrigger>
                        <SelectContent className="border-none shadow-xl rounded-xl p-1">
                            <SelectItem value="all" className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer font-medium mb-1">
                                Усі Сфери
                            </SelectItem>
                            {state.areas.map((area) => (
                                <SelectItem
                                    key={area.id}
                                    value={area.id}
                                    className="rounded-lg focus:bg-primary/10 focus:text-primary cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${area.color.replace('bg-', 'bg-')}`} />
                                        {area.title}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-6 w-px bg-border/50 mx-1 hidden md:block" />

                <NotificationsPopover />

                {/* <VoiceAssistantButton /> */}

                <Button
                    size="sm"
                    onClick={() => {
                        setQuickAddContext(getCurrentContext());
                        setIsQuickAddOpen(true);
                        // Onboarding checks removed
                    }}
                    id="onboarding-main-add-btn"
                    className="h-10 px-5 rounded-full gap-2 shadow-lg shadow-orange-500/25 bg-orange-600 hover:bg-orange-700 text-white font-bold hidden md:flex transition-all hover:scale-105 active:scale-95 hover:shadow-orange-500/40"
                >
                    <Plus className="h-4 w-4" /> <span>Додати</span>
                </Button>
            </div>
        </header>
    );
}

import React from 'react';
import { QuickAddModal } from '@/components/features/QuickAddModal';
