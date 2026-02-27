import { v4 as uuidv4 } from 'uuid';
import { Goal, Action, Note, LifeArea, Project, Habit, Routine, LibraryItem } from '@/types';

export const SEED_DATA_IDS = {
    STRATEGIC_GOAL: 'system-default-strategic-goal',
    TACTICAL_GOAL: 'system-default-tactical-goal',
    PROJECT: 'system-default-project',
    TASK: 'system-default-task',
    HABIT: 'system-default-habit',
    ROUTINE: 'system-default-routine',
    NOTE: 'system-default-note',
    LIBRARY: 'system-default-library'
};

// Dispatch type mocked to avoid circular dependency with store.tsx
export const seedOnboardingData = (dispatch: (action: any) => void, areas: LifeArea[], existingState: any, userId: string = 'current') => {

    // 0. Idempotency Check
    // If we can find ANY of our default items in the existing state, we assume seeding was already done.
    const projectExists = existingState?.projects?.some((p: Project) => p.isSystemDefault || p.id === SEED_DATA_IDS.PROJECT);
    const goalExists = existingState?.goals?.some((g: Goal) => g.isSystemDefault || g.id === SEED_DATA_IDS.STRATEGIC_GOAL);

    if (projectExists || goalExists) {
        console.log("Default system data already exists. Skipping seed.");
        return;
    }

    console.log("Seeding default system data for user:", userId);

    // Areas Resolution
    const healthArea = areas.find(a => a.iconName === 'Activity') || areas[0];
    const workArea = areas.find(a => a.iconName === 'Briefcase') || areas[0];
    const growthArea = areas.find(a => a.iconName === 'Book' || a.title === 'Growth') || areas[0];

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Dates
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);

    const nextQuarter = new Date();
    nextQuarter.setMonth(now.getMonth() + 3);

    const nextMonth = new Date();
    nextMonth.setDate(now.getDate() + 30);

    // 1. STRATEGIC GOAL
    const strategicGoal: Goal = {
        id: SEED_DATA_IDS.STRATEGIC_GOAL,
        userId,
        title: "Стати системною та сфокусованою людиною",
        description: "Побудувати життя через систему цілей, проектів та звичок, а не через хаос і випадковість.",
        status: 'active',
        type: 'strategic',
        areaId: growthArea?.id || 'general',
        progress: 0,
        deadline: nextYear.toISOString(),
        horizon: 'year',
        createdAt: now.toISOString(),
        isSystemDefault: true
    };

    // 2. TACTICAL GOAL (Child of Strategic)
    const tacticalGoal: Goal = {
        id: SEED_DATA_IDS.TACTICAL_GOAL,
        userId,
        title: "Вибудувати особисту систему продуктивності",
        description: "Налаштувати структуру задач, проектів, рутин та звичок.",
        status: 'active',
        type: 'tactical',
        areaId: workArea?.id || 'general', // Linked to work/productivity
        progress: 0,
        deadline: nextQuarter.toISOString(),
        horizon: 'quarter',
        createdAt: now.toISOString(),
        // Parent linking isn't explicit in Goal type via parentId, usually implicit or via subGoals if defined. 
        // We will assume flat or handled logic, but let's push them.
        isSystemDefault: true
    };

    // 3. PROJECT (Linked to Tactical Goal)
    const project: Project = {
        id: SEED_DATA_IDS.PROJECT,
        title: 'Налаштування особистої системи',
        description: 'Організація простору в Zynorvia та створення перших записів.',
        status: 'active',
        areaId: workArea?.id || 'general',
        deadline: nextMonth.toISOString(),
        goalIds: [tacticalGoal.id], // Link to Tactical Goal
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isSystemDefault: true
    };

    // 4. TASK (Linked to Project)
    const task: Action = {
        id: SEED_DATA_IDS.TASK,
        title: 'Пройти onboarding та налаштувати перші елементи',
        completed: false,
        type: 'task',
        areaId: workArea?.id || 'general',
        projectId: project.id, // Link to Project
        date: today,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: 'pending',
        userId,
        duration: 45,
        priority: 'high',
        description: "Чекліст:\n- Ознайомитись з інтерфейсом\n- Створити власну стратегічну ціль\n- Додати перший реальний проект",
        isSystemDefault: true,
        subtasks: [
            { id: uuidv4(), title: 'Ознайомитись з інтерфейсом', completed: false },
            { id: uuidv4(), title: 'Створити власну стратегічну ціль', completed: false },
            { id: uuidv4(), title: 'Додати перший реальний проект', completed: false },
        ]
    };

    // 5. NOTE (System Explanation)
    const note: Note = {
        id: SEED_DATA_IDS.NOTE,
        title: 'Як працює система',
        content: "Стратегія (1 рік) \n   ↓ \nТактика (3 міс) \n   ↓ \nПроекти (Дії) \n   ↓ \nЗавдання (Щоденні кроки)\n\n+ Рутини (Регулярне)\n+ Звички (Автоматичне)",
        tags: ['system', 'onboarding'],
        relatedAreaIds: [growthArea?.id || 'general'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        userId,
        date: today,
        isSystemDefault: true
    };

    // 6. LIBRARY (Knowledge)
    const libraryItem: LibraryItem = {
        id: SEED_DATA_IDS.LIBRARY,
        userId,
        title: 'Особиста система розвитку',
        type: 'article',
        status: 'to_consume',
        author: 'Zynorvia System',
        url: '#',
        areaId: growthArea?.id || 'general',
        createdAt: now.toISOString(),
        isSystemDefault: true
    };

    // 7. ROUTINE (Daily Review)
    const routine: Routine = {
        id: SEED_DATA_IDS.ROUTINE,
        userId,
        title: 'Щоденний огляд дня',
        areaId: workArea?.id || 'general',
        frequency: 'daily',
        time: '19:00',
        createdAt: now.toISOString(),
        isSystemDefault: true
    };

    // 8. HABIT (Atomic Identity)
    const habit: Habit = {
        id: SEED_DATA_IDS.HABIT,
        title: '1 фокусна дія щодня',
        areaId: workArea?.id || 'general',
        type: 'binary',
        frequency: 'daily',
        status: 'active',
        createdAt: now.toISOString(),
        streak: 0,
        userId,
        timeOfDay: 'morning',
        isSystemDefault: true
    };

    // Dispatch Sequence
    // Important: Dispatch parent entities before children if the reducer validates references (though currently it likely doesn't).

    dispatch({ type: 'ADD_GOAL', payload: strategicGoal });
    dispatch({ type: 'ADD_GOAL', payload: tacticalGoal });
    dispatch({ type: 'ADD_PROJECT', payload: project });
    dispatch({ type: 'ADD_ACTION', payload: task });
    dispatch({ type: 'ADD_ROUTINE', payload: routine });
    dispatch({ type: 'ADD_HABIT', payload: habit });
    dispatch({ type: 'ADD_NOTE', payload: note });
    dispatch({ type: 'ADD_LIBRARY_ITEM', payload: libraryItem });

    console.log("Seeding complete: System Default Hierarchical Data generated.");
};
