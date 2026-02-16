import { AppState } from './store';

export interface FocusMetrics {
    score: number;
    breakdown: {
        focus: number;
        goals: number;
        spheres: number;
        time: number;
    };
    state: {
        title: string;
        description: string;
    };
    details: {
        focus: string;
        goals: string;
        spheres: string;
        time: string;
    };
}

export function calculateFocusLevel(state: AppState): FocusMetrics {
    const { actions, goals, areas, checkIns, logs } = state;

    // 1. Focus (35%) - Actions completion & clarity
    // Logic: Do we have a "Focus" action defined? Are high priority tasks done?
    const today = new Date().toISOString().split('T')[0];
    const todayLog = logs[today];

    // Simple heuristic: 
    // - Has a "Main Focus" (OneFocus) been selected? (We can verify if any action is marked as focus, but currently OneFocus is client-selection state often. 
    //   Let's check if any high priority task is completed today or in progress)
    const completedActionsCount = actions.filter(a => a.completed).length;
    const totalActionsCount = actions.length;
    const actionRate = totalActionsCount > 0 ? completedActionsCount / totalActionsCount : 0;

    const focusScore = Math.min(100, (actionRate * 100)); // Simplified for now

    // 2. Goals (30%) - Progress on active goals
    const activeGoals = goals.filter(g => g.status === 'active');
    const goalProgressSum = activeGoals.reduce((sum, g) => sum + g.progress, 0);
    const goalScore = activeGoals.length > 0 ? Math.min(100, goalProgressSum / activeGoals.length) : 0;

    // 3. Spheres (20%) - Balance across life areas
    // Logic: Are tasks distributed? Or do we have areas with no activity?
    const activeAreaIds = new Set(actions.map(a => a.areaId).filter(Boolean));
    const totalAreas = areas.length;
    const coverage = totalAreas > 0 ? activeAreaIds.size / totalAreas : 0;
    const spheresScore = Math.min(100, coverage * 100);

    // 4. Time (15%) - Consistency / Check-ins
    // Logic: Did user check in today?
    const hasCheckInToday = checkIns.some(c => {
        if (!c.date) return false;
        const d = new Date(c.date);
        return d.toISOString().split('T')[0] === today;
    });
    const timeScore = hasCheckInToday ? 100 : 50; // Base 50 for just being here

    // Weighted Calculation
    // Index = (Focus * 0.35) + (Goals * 0.30) + (Spheres * 0.20) + (Time * 0.15)
    // NOTE: This variable was accidentally deleted. Restoring it now.
    const weightedScore =
        (focusScore * 0.35) +
        (goalScore * 0.30) +
        (spheresScore * 0.20) +
        (timeScore * 0.15);

    // --- State Logic ---
    let title = "Початок шляху";
    let description = "Ми ще не маємо достатньо даних, щоб показати твій реальний стан. Додай фокус, ціль або зафіксуй стан у сферах — і картина почне формуватись.";

    const hasData = totalActionsCount > 0 || activeGoals.length > 0 || activeAreaIds.size > 0 || hasCheckInToday;
    const score = Math.round(weightedScore);

    if (!hasData) {
        // State 1: First Entry / No Data
        title = "Початок шляху";
        description = "Ми ще не маємо достатньо даних, щоб показати твій реальний стан. Додай фокус, ціль або зафіксуй стан у сферах — і картина почне формуватись.";
    } else if (score < 40) {
        // State 2: Initial Progress (or potentially Unfocused if long time, but let's be supportive)
        if (totalActionsCount > 10 && !hasCheckInToday) {
            // State 6: Unfocused (approximation)
            title = "Розфокус";
            description = "Зараз напрямок неочевидний, а дії не складаються в систему. Зроби паузу, обери один фокус і почни з малого кроку.";
        } else {
            // State 2: Initial Progress
            title = "Формується напрямок";
            description = "Система починає розуміти твій ритм і фокус. Ще трохи дій — і ти побачиш більш точну картину свого стану.";
        }
    } else if (score >= 40 && score < 75) {
        // State 3: Stable
        title = "Стабільний рух";
        description = "Ти рухаєшся рівно і без різких перекосів. Зараз важливо зберігати ритм і не втрачати фокус на головному.";
    } else if (score >= 75) {
        // State 4: Improving / High Focus
        title = "Чіткий напрямок";
        description = "Твої дії узгоджені з цілями та фокусом. Продовжуй у тому ж дусі — система фіксує позитивну динаміку.";
    }

    // Note: State 5 (Declining) requires history comparison which we'll add when we sync 'metrics' history fully.

    return {
        score,
        breakdown: {
            focus: Math.round(focusScore),
            goals: Math.round(goalScore),
            spheres: Math.round(spheresScore),
            time: Math.round(timeScore)
        },
        state: {
            title,
            description
        },
        details: { // Keeping strictly for compatibility if needed, but ContextState will use 'state' & 'breakdown'
            focus: `Завершено ${Math.round(actionRate * 100)}% завдань`,
            goals: `Прогрес активних цілей: ${Math.round(goalScore)}%`,
            spheres: `Активність у ${activeAreaIds.size}/${totalAreas} сфер`,
            time: hasCheckInToday ? "Чек-ін виконано" : "Чек-ін очікується"
        }
    };
}
