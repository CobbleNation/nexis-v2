
import { MetricDefinition } from "@/types";

export interface GoalTemplate {
    id: string;
    label: string; // The phrase "I want to have..."
    placeholder: string; // "more energy"
    description: string;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
    { id: 'have', label: 'Я хочу мати', placeholder: 'більше заощаджень', description: 'Для матеріальних або кількісних цілей' },
    { id: 'achieve', label: 'Я хочу досягти', placeholder: 'рівня B2 з англійської', description: 'Для конкретних результатів та майлстоунів' },
    { id: 'become', label: 'Я хочу стати', placeholder: 'експертом у...', description: 'Для цілей ідентичності та ролей' },
    { id: 'feel', label: 'Я хочу відчувати', placeholder: 'більше енергії зранку', description: 'Для емоційних та фізичних станів' },
    { id: 'improve', label: 'Я хочу покращити', placeholder: 'свої навички комунікації', description: 'Для розвитку існуючих якостей' },
    { id: 'rid', label: 'Я хочу позбутись', placeholder: 'залежності від солодкого', description: 'Для відмови від шкідливих звичок' },
    { id: 'habit', label: 'Я хочу робити регулярно', placeholder: 'зарядку', description: 'Для впровадження звичок' },
    { id: 'custom', label: 'Довільна ціль', placeholder: 'Сформулюйте свою ціль...', description: 'Повна свобода формулювання' },
];

/**
 * Returns suggested metric names/types based on the Area and Template context.
 * This helps "guess" what the user might want to track.
 */
export function getSuggestedMetrics(areaTitle: string, templateId: string): Partial<MetricDefinition>[] {
    const areaLower = areaTitle.toLowerCase();

    // 1. HEALTH Suggestions
    if (areaLower.includes('здоров') || areaLower.includes('health')) {
        if (templateId === 'feel') return [
            { name: 'Рівень енергії', unit: '1-10', type: 'scale' },
            { name: 'Рівень стресу', unit: '1-10', type: 'scale' },
            { name: 'Якість сну', unit: '1-10', type: 'scale' },
        ];
        if (templateId === 'rid' || templateId === 'have') return [
            { name: 'Вага', unit: 'кг', type: 'number' },
            { name: 'Відсоток жиру', unit: '%', type: 'number' },
        ];
        if (templateId === 'habit') return [
            { name: 'Кількість тренувань', unit: 'разів/тиждень', type: 'number' },
            { name: 'Кроки', unit: 'кроків', type: 'number' },
        ];
    }

    // 2. FINANCE Suggestions
    if (areaLower.includes('фінанси') || areaLower.includes('finance')) {
        if (templateId === 'have' || templateId === 'achieve') return [
            { name: 'Загальний баланс', unit: 'UAH/USD', type: 'number' },
            { name: 'Сума заощаджень', unit: 'UAH/USD', type: 'number' },
            { name: 'Пасивний дохід', unit: 'UAH/міс', type: 'number' },
        ];
        if (templateId === 'rid') return [
            { name: 'Сума боргу', unit: 'UAH', type: 'number' },
        ];
    }

    // 3. LEARNING / CAREER Suggestions
    if (areaLower.includes('навчання') || areaLower.includes('кар') || areaLower.includes('learning')) {
        if (templateId === 'improve' || templateId === 'achieve') return [
            { name: 'Прочитані книги', unit: 'шт', type: 'number' },
            { name: 'Години навчання', unit: 'год', type: 'number' },
            { name: 'Рівень навички', unit: '1-10', type: 'scale' },
        ];
    }

    // Default Fallbacks
    return [
        { name: 'Оцінка задоволеності', unit: '1-10', type: 'scale' },
        { name: 'Відсоток виконання', unit: '%', type: 'number' },
    ];
}
