
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

export default function TermsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#020817] text-slate-900 dark:text-slate-200">
            <LandingHeader />

            <main className="flex-1 container mx-auto px-6 py-24 max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Умови користування</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-12">Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}</p>

                <div className="space-y-12 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">1. Загальні положення</h2>
                        <p>
                            Ці Умови користування ("Умови") регулюють ваш доступ до та використання веб-сайту та програмного забезпечення Zynorvia ("Сервіс").
                            Реєструючись або використовуючи Сервіс, ви погоджуєтеся дотримуватися цих Умов. Якщо ви не погоджуєтеся з будь-якою частиною Умов, ви не можете користуватися Сервісом.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">2. Акаунт користувача</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Реєстрація:</strong> Для використання повного функціоналу необхідно створити акаунт. Ви повинні надати точну та повну інформацію.</li>
                            <li><strong>Безпека:</strong> Ви несете відповідальність за збереження конфіденційності вашого пароля та акаунту. Ви погоджуєтеся негайно сповістити нас про будь-яке несанкціоноване використання вашого акаунту.</li>
                            <li><strong>Вікові обмеження:</strong> Сервіс призначений для осіб віком від 13 років (або старше, якщо це вимагається законодавством вашої країни).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">3. Правила використання</h2>
                        <p className="mb-4">Ви погоджуєтеся не використовувати Сервіс для:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Порушення будь-яких законів або прав третіх осіб;</li>
                            <li>Розповсюдження шкідливого програмного забезпечення або вірусів;</li>
                            <li>Втручання в роботу серверів або мереж Zynorvia;</li>
                            <li>Збору даних інших користувачів без їх згоди;</li>
                            <li>Створення фальшивих акаунтів або видавання себе за іншу особу.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">4. Інтелектуальна власність</h2>
                        <p className="mb-4">
                            <strong>Ваш контент:</strong> Ви зберігаєте всі права на будь-який контент, який ви завантажуєте або створюєте в Zynorvia (завдання, нотатки, журнали). Ми не претендуємо на право власності на ваш контент.
                        </p>
                        <p>
                            <strong>Інтелектуальна власність Zynorvia:</strong> Сервіс, його дизайн, логотип, програмний код та інші елементи є власністю Zynorvia та захищені законами про авторське право.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">5. Платежі та підписки</h2>
                        <p>
                            Деякі функції Сервісу можуть бути платними. Оплата стягується згідно з обраним тарифним планом. Ми залишаємо за собою право змінювати тарифи, попередньо повідомивши про це користувачів.
                            Умови скасування підписки та повернення коштів регулюються нашою політикою повернення.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">6. Відмова від відповідальності</h2>
                        <p>
                            Сервіс надається на умовах "ЯК Є" та "ЯК ДОСТУПНО". Zynorvia не надає жодних прямих або непрямих гарантій щодо безперебійної роботи, відсутності помилок або відповідності певним цілям. Ви використовуєте Сервіс на власний ризик.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">7. Припинення дії</h2>
                        <p>
                            Ми залишаємо за собою право призупинити або видалити ваш акаунт, якщо ви порушуєте ці Умови, без попереднього повідомлення.
                            Ви можете видалити свій акаунт у будь-який час через налаштування профілю.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">8. Зміни до Умов</h2>
                        <p>
                            Ми можемо оновлювати ці Умови. Продовження використання Сервісу після внесення змін означає вашу згоду з новими Умовами.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">9. Контакти</h2>
                        <p>
                            Для зв'язку з юридичних питань або питань щодо цих Умов:
                        </p>
                        <p className="mt-2 text-orange-600 dark:text-orange-400 font-medium">
                            legal@zynorvia.app
                        </p>
                    </section>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
