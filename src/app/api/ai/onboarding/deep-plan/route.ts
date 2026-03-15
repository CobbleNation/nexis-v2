import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { DEFAULT_AREAS } from '@/lib/default-areas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const body = await req.json();
        const { messages, selectedAreaIds, initialAnswers } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
        }

        const selectedAreasFull = DEFAULT_AREAS.filter(a => selectedAreaIds?.includes(a.iconName));
        const areaTitles = selectedAreasFull.map(a => a.title).join(', ');
        
        const areaGoalsText = selectedAreaIds?.map((id: string) => `Сфера ${id}: ${initialAnswers?.areaGoals?.[id] || 'не вказано'}`).join('\n');

        const systemMessage = `Ти — суворий, надзвичайно прискіпливий та структурний експерт-коуч з планування життя елітного рівня. Твоя мета — створити для користувача МАКСИМАЛЬНО деталізовану, вичерпну систему життя (Deep Planning). Ти не приймаєш поверхневих відповідей.
Спілкуйся ВИКЛЮЧНО українською мовою. Тон: вимогливий, але підтримуючий професіонал.

КОНТЕКСТ КОРИСТУВАЧА:
Користувач обрав пріоритетні сфери життя: [${areaTitles || 'не вказано'}].
Вступні цілі по сферах: 
${areaGoalsText || 'не вказано'}
Візія на 1-5 років: "${initialAnswers?.longTermGoals || 'не вказано'}".
Бар'єри: "${initialAnswers?.challenges || 'не вказано'}".
Бажана структура: "${initialAnswers?.structure || 'Balanced'}".

ЖОРСТКІ ПРАВИЛА РОБОТИ (ПОРУШЕННЯ ЗАБОРОНЕНО):
1. ВИМАГАЙ ДЕТАЛЕЙ ПО КОЖНІЙ СФЕРІ: Пройдись по кожній обраній сфері життя. Якщо користувач дав розмиту ціль (наприклад "Більше заробляти"), ти ЗОБОВ'ЯЗАНИЙ витягнути з нього конкретику (Скільки саме? До якого терміну? Яким шляхом? Які метрики?).
2. РОЗБИТТЯ НА ПРОЕКТИ ТА КРОКИ: Не погоджуйся просто на "ціль". Запитуй, на які саме Проекти (Projects) він готовий розбити цю ціль, і які найменші Щоденні чи Щотижневі задачі (Tasks) та Звички (Habits) йому для цього потрібні.
3. МЕТРИКИ ТА ОЦИФРОВУВАННЯ: Вимагай точних цифр. "Схуднути" -> "Яка поточна вага? Яка цільова? До якого числа?".
4. ОДНЕ/ДВА ПИТАННЯ ЗА РАЗ: Не завалюй користувача стіною запитань. Сфокусуйся спочатку на одній сфері, розбери її "до кісток", потім переходь до наступної.
5. ЗАБОРОНА РАННЬОГО ЗАВЕРШЕННЯ: Ти НЕ МАЄШ ПРАВА пропонувати користувачу закінчити планування, поки ВСІ обрані сфери ([${areaTitles}]) не будуть розібрані на конкретні Візійні цілі, Стратегічні проекти, Тактичні кроки, Точні Метрики та Звички.
6. ПІДБИТТЯ ПІДСУМКІВ: Тільки коли всі сфери вичерпано і розкладено по поличках, скажи користувачу, що система ідеальна, і він може натиснути "Завершити планування" внизу екрану.

Пам'ятай: Тільки українська мова. Тільки одне запитання за раз. Працюй як суворий архітектор.`;

        // We inject the system message at the beginning of the messages array
        const apiMessages = [
            { role: 'system', content: systemMessage },
            ...messages.map((m: any) => ({
                role: m.role,
                content: m.content
            }))
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost-effective but smart enough for coaching
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 1000,
        });

        const aiMessage = response.choices[0].message;

        return NextResponse.json({ message: aiMessage });

    } catch (error) {
        console.error('[Deep Plan Chat Error]:', error);
        return NextResponse.json({ error: 'Помилка при обробці запиту до AI' }, { status: 500 });
    }
}
