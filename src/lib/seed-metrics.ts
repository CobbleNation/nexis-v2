import { v4 as uuidv4 } from 'uuid';
import { MetricDefinition } from '@/types';

export type MetricDef = Omit<MetricDefinition, 'id' | 'userId' | 'areaId' | 'createdAt'>;

export const DEFAULT_METRICS: Record<string, MetricDef[]> = {
    'Здоровʼя': [
        { name: 'Вага', type: 'number', valueType: 'numeric', direction: 'neutral', unit: 'кг', description: 'Вага тіла, відстежуємо зміни', frequency: 'weekly' },
        { name: 'Тривалість сну', type: 'number', valueType: 'numeric', direction: 'increase', unit: 'год', description: 'Середній час сну', frequency: 'daily' },
        { name: 'Рівень енергії', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Субʼєктивне відчуття енергії', frequency: 'daily' },
        { name: 'Рівень стресу', type: 'scale', valueType: 'scale', direction: 'decrease', unit: '1-10', description: 'Субʼєктивне відчуття напруги', frequency: 'daily' },
        { name: 'Фізична активність', type: 'number', valueType: 'numeric', direction: 'increase', unit: 'хв', description: 'Час активного руху або тренування', frequency: 'daily' }
    ],
    'Фінанси': [
        { name: 'Поточний баланс', type: 'number', valueType: 'numeric', direction: 'increase', unit: '₴', description: 'Загальна сума на рахунках', frequency: 'weekly' },
        { name: 'Дохід за період', type: 'number', valueType: 'numeric', direction: 'increase', unit: '₴', description: 'Всі надходження', frequency: 'monthly' },
        { name: 'Витрати за період', type: 'number', valueType: 'numeric', direction: 'decrease', unit: '₴', description: 'Всі витрати', frequency: 'monthly' },
        { name: 'Заощадження', type: 'number', valueType: 'numeric', direction: 'increase', unit: '₴', description: 'Відкладені кошти', frequency: 'monthly' },
        { name: 'Борг', type: 'number', valueType: 'numeric', direction: 'decrease', unit: '₴', description: 'Сума зобовʼязань', frequency: 'monthly' }
    ],
    'Карʼєра': [
        { name: 'Робочі години', type: 'number', valueType: 'numeric', direction: 'neutral', unit: 'год', description: 'Продуктивний час', frequency: 'daily' },
        { name: 'Рівень прогресу', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Відчуття руху вперед', frequency: 'weekly' },
        { name: 'Навантаження', type: 'scale', valueType: 'scale', direction: 'neutral', unit: '1-10', description: 'Субʼєктивна важкість', frequency: 'weekly' },
        { name: 'Фокус на головному', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Вміння тримати пріоритет', frequency: 'daily' }
    ],
    'Особисте': [
        { name: 'Загальне задоволення', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Задоволеність життям', frequency: 'weekly' },
        { name: 'Відновлення', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Якість відпочинку', frequency: 'weekly' },
        { name: 'Емоційний стан', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Переважаючий настрій', frequency: 'daily' }
    ],
    'Відносини': [
        { name: 'Якість взаємодії', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Глибина та позитив', frequency: 'weekly' },
        { name: 'Комунікація', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Легкість спілкування', frequency: 'weekly' },
        { name: 'Емоційна близькість', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Відчуття звʼязку', frequency: 'monthly' }
    ],
    'Навчання': [
        { name: 'Час навчання', type: 'number', valueType: 'numeric', direction: 'increase', unit: 'год', description: 'Чистий час на навчання', frequency: 'weekly' },
        { name: 'Рівень розуміння', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Якість засвоєння матеріалу', frequency: 'monthly' },
        { name: 'Фокус навчання', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Сконцентрованість', frequency: 'weekly' }
    ],
    'Проєкти': [
        { name: 'Активні проєкти', type: 'number', valueType: 'numeric', direction: 'neutral', unit: 'шт', description: 'Кількість проектів в роботі', frequency: 'weekly' },
        { name: 'Прогрес проєктів', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Загальний рух до завершення', frequency: 'weekly' },
        { name: 'Рівень залученості', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Інтерес та мотивація', frequency: 'weekly' }
    ],
    'Подорожі': [
        { name: 'Подорожі за період', type: 'number', valueType: 'numeric', direction: 'increase', unit: 'шт', description: 'Кількість поїздок', frequency: 'monthly' },
        { name: 'Враження', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Яскравість емоцій', frequency: 'per_trip' },
        { name: 'Новий досвід', type: 'scale', valueType: 'scale', direction: 'increase', unit: '1-10', description: 'Унікальність пережитого', frequency: 'per_trip' }
    ]
};

export function getMetricsForArea(areaTitle: string): MetricDef[] {
    // Handle 'Проекти' vs 'Проєкти' mismatch if necessary
    if (areaTitle === 'Проекти') return DEFAULT_METRICS['Проєкти'] || [];
    return DEFAULT_METRICS[areaTitle] || [];
}
