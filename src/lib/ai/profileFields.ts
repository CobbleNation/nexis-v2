// All structured fields that compose the user's AI identity profile.
// These are saved as JSON in the AI memory system and loaded in Settings / Onboarding.

export interface ProfileField {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'textarea' | 'select';
    options?: string[]; // for select type
    category: 'health' | 'work' | 'lifestyle' | 'values' | 'personality';
}

export const PROFILE_FIELDS: ProfileField[] = [
    // ─── HEALTH & BODY ───
    {
        key: 'currentWeight',
        label: 'Поточна вага (кг)',
        placeholder: '75',
        type: 'text',
        category: 'health',
    },
    {
        key: 'targetWeight',
        label: 'Бажана вага (кг)',
        placeholder: '70',
        type: 'text',
        category: 'health',
    },
    {
        key: 'height',
        label: 'Зріст (см)',
        placeholder: '178',
        type: 'text',
        category: 'health',
    },
    {
        key: 'sportFrequency',
        label: 'Скільки разів на тиждень тренуєтесь?',
        placeholder: '3',
        type: 'select',
        options: ['0', '1-2', '3-4', '5-6', 'Щодня'],
        category: 'health',
    },
    {
        key: 'sportType',
        label: 'Який тип спорту або тренувань?',
        placeholder: 'Біг, зал, плавання...',
        type: 'text',
        category: 'health',
    },
    {
        key: 'sleepSchedule',
        label: 'О котрій зазвичай лягаєте спати / встаєте?',
        placeholder: '23:00 - 7:00',
        type: 'text',
        category: 'health',
    },
    {
        key: 'healthIssues',
        label: 'Чи є обмеження по здоров\'ю?',
        placeholder: 'Алергії, хронічні стани, травми...',
        type: 'textarea',
        category: 'health',
    },
    {
        key: 'energyPattern',
        label: 'Коли відчуваєте пік енергії протягом дня?',
        placeholder: '',
        type: 'select',
        options: ['Ранок (6-10)', 'День (10-14)', 'Після обіду (14-18)', 'Вечір (18-22)', 'Ніч (22+)'],
        category: 'health',
    },

    // ─── WORK & CAREER ───
    {
        key: 'profession',
        label: 'Ваша професія / сфера діяльності',
        placeholder: 'Програміст, дизайнер, підприємець...',
        type: 'text',
        category: 'work',
    },
    {
        key: 'workSchedule',
        label: 'Робочий графік',
        placeholder: '',
        type: 'select',
        options: ['9-18 офіс', '9-18 віддалено', 'Гнучкий графік', 'Змінний', 'Фріланс', 'Свій бізнес', 'Не працюю / навчаюсь'],
        category: 'work',
    },
    {
        key: 'deepWorkHours',
        label: 'Скільки годин глибокого фокусу можете тримати на день?',
        placeholder: '4',
        type: 'select',
        options: ['1-2', '3-4', '5-6', '7+'],
        category: 'work',
    },
    {
        key: 'mainWorkGoal',
        label: 'Головна робоча/кар\'єрна ціль зараз',
        placeholder: 'Отримати підвищення, запустити продукт...',
        type: 'textarea',
        category: 'work',
    },
    {
        key: 'workChallenges',
        label: 'Головні робочі виклики або перешкоди',
        placeholder: 'Прокрастинація, перевантаження задачами...',
        type: 'textarea',
        category: 'work',
    },

    // ─── LIFESTYLE & DAILY LIFE ───
    {
        key: 'familyStatus',
        label: 'Сімейний стан',
        placeholder: '',
        type: 'select',
        options: ['Один/одна', 'У стосунках', 'Одружений/заміжня', 'Є діти', 'Живу з батьками'],
        category: 'lifestyle',
    },
    {
        key: 'city',
        label: 'Місто проживання',
        placeholder: 'Київ, Львів...',
        type: 'text',
        category: 'lifestyle',
    },
    {
        key: 'hobbies',
        label: 'Хобі та захоплення',
        placeholder: 'Читання, подорожі, музика...',
        type: 'textarea',
        category: 'lifestyle',
    },
    {
        key: 'dailyRoutine',
        label: 'Опишіть вашу типову ранкову рутину',
        placeholder: 'Просинаюсь о 7, душ, кава, 30 хв йоги...',
        type: 'textarea',
        category: 'lifestyle',
    },
    {
        key: 'stressLevel',
        label: 'Загальний рівень стресу зараз',
        placeholder: '',
        type: 'select',
        options: ['Низький — все під контролем', 'Середній — бувають напружені дні', 'Високий — постійний тиск', 'Критичний — на межі вигорання'],
        category: 'lifestyle',
    },
    {
        key: 'financialGoal',
        label: 'Фінансова ціль або орієнтир',
        placeholder: 'Заощадити $10K, збільшити дохід...',
        type: 'text',
        category: 'lifestyle',
    },

    // ─── VALUES & PRIORITIES ───
    {
        key: 'topPriority',
        label: 'Що зараз є вашим #1 пріоритетом у житті?',
        placeholder: 'Здоров\'я, кар\'єра, сім\'я, саморозвиток...',
        type: 'text',
        category: 'values',
    },
    {
        key: 'lifeValues',
        label: 'Ваші топ-3 життєві цінності',
        placeholder: 'Свобода, здоров\'я, ріст...',
        type: 'text',
        category: 'values',
    },
    {
        key: 'biggestDream',
        label: 'Найбільша мрія на найближчі 3-5 років',
        placeholder: 'Створити свій бізнес, переїхати...',
        type: 'textarea',
        category: 'values',
    },
    {
        key: 'changeWithNexis',
        label: 'Що хочете змінити за допомогою Nexis?',
        placeholder: 'Стати продуктивнішим, тримати баланс...',
        type: 'textarea',
        category: 'values',
    },

    // ─── PERSONALITY & COMMUNICATION ───
    {
        key: 'communicationStyle',
        label: 'Як AI має з вами спілкуватися?',
        placeholder: '',
        type: 'select',
        options: ['Прямо та коротко — без води', 'Дружньо та мотивуюче', 'Суворо та вимогливо як коуч', 'Спокійно та м\'яко'],
        category: 'personality',
    },
    {
        key: 'motivationType',
        label: 'Що вас мотивує більше?',
        placeholder: '',
        type: 'select',
        options: ['Результат та цифри', 'Визнання та досягнення', 'Внутрішній ріст', 'Страх не встигнути', 'Змагання з собою'],
        category: 'personality',
    },
];

export const CATEGORY_META: Record<string, { label: string; icon: string; description: string }> = {
    health: {
        label: "Здоров'я та Тіло",
        icon: 'HeartPulse',
        description: 'Фізичний стан, спорт, сон та енергія',
    },
    work: {
        label: 'Робота та Кар\'єра',
        icon: 'Briefcase',
        description: 'Професія, графік та робочі цілі',
    },
    lifestyle: {
        label: 'Стиль Життя',
        icon: 'Home',
        description: 'Побут, сім\'я, фінанси та рутина',
    },
    values: {
        label: 'Цінності та Мрії',
        icon: 'Target',
        description: 'Пріоритети, цінності та довгострокові цілі',
    },
    personality: {
        label: 'Характер та AI',
        icon: 'Brain',
        description: 'Як Nexis має з вами взаємодіяти',
    },
};

export type ProfileData = Record<string, string>;
