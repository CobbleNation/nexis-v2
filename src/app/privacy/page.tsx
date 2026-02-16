
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

export default function PrivacyPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#020817] text-slate-900 dark:text-slate-200">
            <LandingHeader />

            <main className="flex-1 container mx-auto px-6 py-24 max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Політика конфіденційності</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-12">Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}</p>

                <div className="space-y-12 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">1. Вступ</h2>
                        <p>
                            Ласкаво просимо до Zynorvia ("ми", "нас" або "наш"). Ми поважаємо вашу конфіденційність і зобов'язуємося захищати ваші персональні дані.
                            Ця політика конфіденційності пояснює, як ми збираємо, використовуємо та захищаємо інформацію про вас, коли ви користуєтеся нашим веб-сайтом та додатком (разом — "Сервіс").
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">2. Інформація, яку ми збираємо</h2>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">2.1. Дані, які ви надаєте нам</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Акаунт:</strong> Ім'я, адреса електронної пошти, пароль (у зашифрованому вигляді).</li>
                                <li><strong>Контент користувача:</strong> Цілі, завдання, нотатки, записи в журналі та інші дані, які ви вносите в систему.</li>
                                <li><strong>Комунікація:</strong> Повідомлення, які ви надсилаєте нам у службу підтримки.</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mt-6">2.2. Дані, які збираються автоматично</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Технічні дані:</strong> IP-адреса, тип браузера, операційна система, дані про пристрій.</li>
                                <li><strong>Дані про використання:</strong> Час перебування в додатку, взаємодія з функціями, логи помилок.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">3. Як ми використовуємо ваші дані</h2>
                        <p className="mb-4">Ми використовуємо зібрану інформацію для:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Надання та підтримки нашого Сервісу;</li>
                            <li>Персоналізації вашого досвіду в Zynorvia;</li>
                            <li>Покращення, тестування та моніторингу ефективності Сервісу;</li>
                            <li>Спілкування з вами, наприклад, для надсилання оновлень або відповідей на запити;</li>
                            <li>Забезпечення безпеки та запобігання шахрайству.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">4. Зберігання та захист даних</h2>
                        <p>
                            Ми вживаємо належних заходів безпеки для захисту від несанкціонованого доступу, зміни, розголошення або знищення ваших персональних даних.
                            Ваші дані зберігаються на захищених серверах. Проте жоден метод передачі через Інтернет або електронного зберігання не є на 100% безпечним, тому ми не можемо гарантувати абсолютну безпеку.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">5. Передача даних третім особам</h2>
                        <p>
                            Ми не продаємо ваші персональні дані. Ми можемо передавати дані лише:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li><strong>Постачальникам послуг:</strong> Для хостингу, аналітики, обробки платежів (ці партнери зобов'язані захищати ваші дані).</li>
                            <li><strong>На вимогу закону:</strong> Якщо це вимагається законодавством або для захисту наших прав.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">6. Ваші права</h2>
                        <p className="mb-4">Ви маєте право:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Отримувати доступ до своїх персональних даних;</li>
                            <li>Вимагати виправлення неточних даних;</li>
                            <li>Вимагати видалення ваших даних ("право на забуття");</li>
                            <li>Експортувати свої дані.</li>
                        </ul>
                        <p className="mt-4">
                            Ви можете керувати своїми даними безпосередньо в налаштуваннях акаунту або зв'язатися з нами для допомоги.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">7. Cookies (Кукі)</h2>
                        <p>
                            Ми використовуємо cookies та подібні технології для забезпечення функціонування сесій користувачів та запам'ятовування ваших налаштувань. Ви можете налаштувати свій браузер на відмову від cookies, але це може вплинути на роботу деяких функцій Сервісу.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">8. Зміни до цієї політики</h2>
                        <p>
                            Ми можемо час від часу оновлювати нашу Політику конфіденційності. Ми повідомимо вас про будь-які зміни, розмістивши нову політику на цій сторінці та оновивши дату "Останнє оновлення".
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">9. Контакти</h2>
                        <p>
                            Якщо у вас виникли запитання щодо цієї Політики конфіденційності, будь ласка, зв'яжіться з нами:
                        </p>
                        <p className="mt-2 text-orange-600 dark:text-orange-400 font-medium">
                            support@zynorvia.app
                        </p>
                    </section>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
