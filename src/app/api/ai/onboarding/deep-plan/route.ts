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

        // Setup the initial system context based on user selections
        const selectedAreasFull = DEFAULT_AREAS.filter(a => selectedAreaIds?.includes(a.iconName));
        const areaTitles = selectedAreasFull.map(a => a.title).join(', ');

        const systemMessage = `Ти — експерт-коуч з планування життя. Твоя мета — допомогти користувачу створити максимально деталізовану, повноцінну систему життя (Deep Planning).
Спілкуйся ВИКЛЮЧНО українською мовою. Будь емпатичним, професійним і структурним.

КОНТЕКСТ КОРИСТУВАЧА:
Користувач обрав пріоритетні сфери життя: [${areaTitles || 'не вказано'}].
Його початкові цілі на 3-12 місяців: "${initialAnswers?.goals || 'не вказано'}".
Його бар'єри: "${initialAnswers?.challenges || 'не вказано'}".
Бажана структура системи: "${initialAnswers?.structure || 'Balanced'}".

ПРАВИЛА РОБОТИ:
1. Твоє перше повідомлення вже ініційовано користувачем (прихованим системним промптом). Твоя задача відповісти на нього.
2. Проаналізуй вказані цілі та зістав їх з обраними сферами життя. 
3. Якщо користувач вказав цілі лише для частини сфер (наприклад, написав лише про Кар'єру, але обрав також Здоров'я і Стосунки) — обов'язково, але м'яко вкажи на це і ЗАДАЙ ПИТАННЯ про цілі в пропущених сферах.
4. Задавай ТІЛЬКИ ОДНЕ запитання за раз. Не перевантажуй користувача списком питань.
5. Мета — крок за кроком витягти з користувача стратегію для ВСІХ обраних сфер, а потім допомогти розбити цілі на конкретні дрібні задачі та щоденні звички.
6. Коли ти відчуєш, що система продумана достатньо (або користувач просить завершити) — підведи підсумки і скажи, що він може "Завершити планування" кнопкою внизу екрану.

Пам'ятай: Тільки українська мова. Тільки одне запитання за раз. Проактивно вкажи на забуті сфери.`;

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
