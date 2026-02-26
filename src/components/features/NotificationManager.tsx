'use client';

import React, { useEffect, useRef } from 'react';
import { useData } from '@/lib/store';
import { toast } from 'sonner';
import { Action, AppEvent, Notification } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const CHECK_INTERVAL = 60000; // Check every minute
const UPCOMING_TASK_THRESHOLD = 15; // Minutes
const DEADLINE_WARNING_THRESHOLD = 24; // Hours (1 day)

export function NotificationManager() {
    const { state, dispatch } = useData();
    const { actions, events, areas, notifications, user } = state;

    // Refs to track "already notified" to avoid spam within session for non-flagged items
    // (Though for reminders we use the 'reminderSent' flag in DB/Store)
    const processedDeadlines = useRef<Set<string>>(new Set());
    const processedUpcoming = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (state.isLoading) return;

        // Helper to dispatch + toast
        const sendNotification = (data: { title: string, message: string, type: Notification['type'], link?: string }) => {
            // 1. Add to In-App Notification Center
            dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    id: uuidv4(),
                    userId: user.name || 'user',
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    date: new Date().toISOString(),
                    read: false,
                    link: data.link,
                    createdAt: new Date().toISOString()
                }
            });

            // 2. Show Toast
            toast(data.title, {
                description: data.message,
                action: data.link ? {
                    label: "Перейти",
                    onClick: () => window.location.href = data.link!
                } : undefined,
            });
        };

        const checkNotifications = () => {
            const now = new Date();
            const nowTime = now.getTime();

            // 1. Manual Reminders (Tasks & Events)
            const checkReminders = (entity: Action | AppEvent, type: 'task' | 'event') => {
                if (entity.reminderAt && !entity.reminderSent) {
                    const reminderTime = new Date(entity.reminderAt).getTime();
                    if (nowTime >= reminderTime) {
                        const title = type === 'task' ? 'Нагадування про завдання' : 'Нагадування про подію';
                        const message = `Настав час: ${entity.title}`;

                        sendNotification({
                            title,
                            message,
                            type: 'info',
                            link: type === 'task' ? '/actions' : '/timeline'
                        });

                        if (type === 'task') {
                            dispatch({ type: 'UPDATE_ACTION', payload: { ...entity, reminderSent: true } as Action });
                        } else {
                            dispatch({ type: 'UPDATE_EVENT', payload: { ...entity, reminderSent: true } as AppEvent });
                        }
                    }
                }
            };

            actions.forEach(a => !a.completed && checkReminders(a, 'task'));
            events.forEach(e => checkReminders(e, 'event'));


            // 2. Upcoming Scheduled Tasks (15 min warning)
            actions.forEach(task => {
                if (task.startTime && task.date && !task.completed && task.status !== 'canceled') {
                    const [hours, mins] = task.startTime.split(':').map(Number);
                    const taskDate = new Date(task.date);
                    taskDate.setHours(hours, mins, 0, 0);

                    const timeDiff = taskDate.getTime() - nowTime;
                    const minutesUntil = Math.floor(timeDiff / 1000 / 60);

                    if (minutesUntil > 0 && minutesUntil <= UPCOMING_TASK_THRESHOLD) {
                        const key = `${task.id}-upcoming-${task.date}`;
                        if (!processedUpcoming.current.has(key)) {
                            sendNotification({
                                title: 'Скоро початок завдання',
                                message: `"${task.title}" починається через ${minutesUntil} хв.`,
                                type: 'info',
                                link: '/actions'
                            });
                            processedUpcoming.current.add(key);
                        }
                    }
                }
            });


            // 3. Deadlines (Due Today / Tomorrow / Overdue)
            actions.forEach(task => {
                if ((task.dueDate || task.date) && !task.completed && task.status !== 'canceled' && task.status !== 'deferred') {
                    const dateToCheck = task.dueDate ? new Date(task.dueDate) : new Date(task.date!);
                    const today = new Date(now);
                    today.setHours(0, 0, 0, 0);
                    const dueDay = new Date(dateToCheck);
                    dueDay.setHours(0, 0, 0, 0);

                    const diffTime = dueDay.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 1) {
                        // Past, Today or Tomorrow.
                        // For past, only notify once per past day maybe? Or just a general "Overdue" if not notified.
                        const key = diffDays < 0 ? `${task.id}-overdue` : `${task.id}-deadline-${diffDays}`;
                        const storageKey = `notified-deadline-${key}`;

                        if (!processedDeadlines.current.has(key) && !localStorage.getItem(storageKey)) {
                            let title = '';
                            let type: 'warning' | 'error' | 'info' = 'warning';
                            let message = `Завдання "${task.title}" потребує уваги.`;

                            if (diffDays < 0) {
                                title = '🚨 Час виконання стік';
                                type = 'error';
                                message = `Стікає час виконання завдання "${task.title}". Не переймайтесь, Ви можете відновити його та запланувати на інший час в розділі "Не завершені".`;
                            } else if (diffDays === 0) {
                                title = 'Дедлайн сьогодні';
                            } else {
                                title = 'Дедлайн завтра';
                            }

                            sendNotification({
                                title,
                                message,
                                type,
                                link: '/actions'
                            });

                            processedDeadlines.current.add(key);
                            localStorage.setItem(storageKey, 'true');
                        }
                    }
                }
            });

            // 3.5. Inbox Reminders (Unscheduled)
            const unscheduledTasksCount = actions.filter(a => a.type === 'task' && !a.date && !a.areaId && !a.completed && a.status !== 'canceled').length;
            if (unscheduledTasksCount > 0) {
                const INBOX_THROTTLE_MS = 5 * 60 * 60 * 1000; // 5 hours
                const lastNotifiedStr = localStorage.getItem('last-inbox-notification-time');
                let shouldNotify = false;

                if (!lastNotifiedStr) {
                    shouldNotify = true;
                } else {
                    const lastNotified = parseInt(lastNotifiedStr, 10);
                    if (nowTime - lastNotified > INBOX_THROTTLE_MS) {
                        shouldNotify = true;
                    }
                }

                if (shouldNotify) {
                    sendNotification({
                        title: '📥 Нерозібрані думки',
                        message: `У Вас є ${unscheduledTasksCount} незапланованих думок/завдань у Вхідних. Розплануйте дії, щоб очистити фокус.`,
                        type: 'info',
                        link: '/actions?tab=inbox'
                    });
                    localStorage.setItem('last-inbox-notification-time', nowTime.toString());
                }
            }

            // 4. Sphere Degradation (Area Status Check)
            areas.forEach(area => {
                if (area.status === 'down') {
                    const storageKey = `notified-area-down-${area.id}-${now.toDateString()}`;
                    if (!localStorage.getItem(storageKey)) {
                        sendNotification({
                            title: 'Сфера потребує уваги',
                            message: `Статус сфери "${area.title}" погіршився. Заплануйте дії для її покращення.`,
                            type: 'warning',
                            link: `/areas/${area.id}`
                        });
                        localStorage.setItem(storageKey, 'true');
                    }
                }
            });

            // 5. Metric Updates (Daily Check)
            if (state.metricDefinitions) {
                state.metricDefinitions.forEach(metric => {
                    if (metric.frequency === 'daily') {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const hasEntry = state.metricEntries?.some(e =>
                            e.metricId === metric.id &&
                            (e.date instanceof Date ? e.date.toISOString().split('T')[0] : String(e.date).split('T')[0]) === todayStr
                        );

                        // Check if it's evening > 18:00
                        if (!hasEntry && now.getHours() >= 18) {
                            const storageKey = `notified-metric-${metric.id}-${todayStr}`;
                            if (!localStorage.getItem(storageKey)) {
                                sendNotification({
                                    title: 'Оновіть метрику',
                                    message: `Ви ще не внесли дані для "${metric.name}" сьогодні.`,
                                    type: 'info',
                                    link: `/areas/${metric.areaId}`
                                });
                                localStorage.setItem(storageKey, 'true');
                            }
                        }
                    }
                });
            }
        };

        // TEST MODE LISTENER
        const handleTestNotification = (e: any) => {
            const { type } = e.detail;
            if (type === 'task') {
                sendNotification({ title: 'Тест: Завдання', message: 'Це тестове нагадування про завдання.', type: 'info', link: '/actions' });
            } else if (type === 'deadline') {
                sendNotification({ title: 'Тест: Дедлайн', message: 'Увага! Дедлайн проекту спливає завтра.', type: 'warning', link: '/actions' });
            } else if (type === 'area') {
                sendNotification({ title: 'Тест: Сфера', message: 'Сфера "Здоров\'я" потребує вашої уваги.', type: 'error', link: '/areas' });
            } else if (type === 'metric') {
                sendNotification({ title: 'Тест: Метрика', message: 'Нагадування оновити метрику "Вага" сьогодні.', type: 'info', link: '/areas' });
            }
        };

        window.addEventListener('test-notification', handleTestNotification);

        checkNotifications();
        const intervalId = setInterval(checkNotifications, CHECK_INTERVAL);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('test-notification', handleTestNotification);
        };
    }, [actions, events, areas, dispatch, user.name, state.isLoading, state.metricDefinitions, state.metricEntries]);

    return null; // Headless component
}
