import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../lib/auth';
import { apiSyncGet } from '../../lib/api';
import type { Goal, Action, Habit } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function OverviewScreen() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await apiSyncGet();
            setGoals(data.goals || []);
            setActions(data.actions || []);
            setHabits(data.habits || []);
        } catch (e) {
            console.error('Failed to load data:', e);
        } finally {
            setIsLoading(false);
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayActions = actions.filter(a => a.date === todayStr || (!a.date && !a.completed));
    const completedToday = todayActions.filter(a => a.completed).length;
    const activeGoals = goals.filter(g => g.status === 'active');
    const avgProgress = activeGoals.length > 0
        ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length)
        : 0;
    const totalStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
            }
        >
            {/* Greeting */}
            <View style={styles.greetingSection}>
                <Text style={styles.greeting}>
                    Привіт, {user?.name?.split(' ')[0] || 'Користувач'} 👋
                </Text>
                <Text style={styles.dateText}>
                    {new Date().toLocaleDateString('uk-UA', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                    })}
                </Text>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderLeftColor: '#f97316' }]}>
                    <Ionicons name="checkbox-outline" size={20} color="#f97316" />
                    <Text style={styles.statNumber}>{completedToday}/{todayActions.length}</Text>
                    <Text style={styles.statLabel}>Задачі</Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                    <Ionicons name="flag-outline" size={20} color="#3b82f6" />
                    <Text style={styles.statNumber}>{activeGoals.length}</Text>
                    <Text style={styles.statLabel}>Цілі</Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                    <Ionicons name="flame-outline" size={20} color="#10b981" />
                    <Text style={styles.statNumber}>{totalStreaks}</Text>
                    <Text style={styles.statLabel}>Стрік</Text>
                </View>
            </View>

            {/* Goals Progress */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Прогрес цілей</Text>
                {activeGoals.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="flag-outline" size={32} color="#475569" />
                        <Text style={styles.emptyText}>Немає активних цілей</Text>
                    </View>
                ) : (
                    activeGoals.slice(0, 5).map((goal) => (
                        <View key={goal.id} style={styles.goalItem}>
                            <View style={styles.goalHeader}>
                                <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                                <Text style={styles.goalProgress}>{goal.progress || 0}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${Math.min(100, goal.progress || 0)}%` },
                                    ]}
                                />
                            </View>
                        </View>
                    ))
                )}
            </View>

            {/* Today's Tasks */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Сьогодні</Text>
                {todayActions.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="sunny-outline" size={32} color="#475569" />
                        <Text style={styles.emptyText}>Щоб задач немає — відпочинь!</Text>
                    </View>
                ) : (
                    todayActions.slice(0, 8).map((action) => (
                        <View key={action.id} style={styles.taskItem}>
                            <View style={[styles.taskCheck, action.completed && styles.taskChecked]}>
                                {action.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </View>
                            <Text
                                style={[styles.taskTitle, action.completed && styles.taskTitleCompleted]}
                                numberOfLines={1}
                            >
                                {action.title}
                            </Text>
                            {action.startTime && (
                                <Text style={styles.taskTime}>{action.startTime}</Text>
                            )}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    greetingSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    greeting: {
        fontSize: 26,
        fontWeight: '800',
        color: '#f8fafc',
        letterSpacing: -0.3,
    },
    dateText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
        textTransform: 'capitalize',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 3,
        gap: 6,
    },
    statNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f8fafc',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: 14,
    },
    emptyCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        gap: 10,
    },
    emptyText: {
        color: '#475569',
        fontSize: 14,
    },
    goalItem: {
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
        marginBottom: 8,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    goalTitle: {
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    goalProgress: {
        color: '#f97316',
        fontSize: 14,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#334155',
        borderRadius: 3,
    },
    progressBarFill: {
        height: 6,
        backgroundColor: '#f97316',
        borderRadius: 3,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
        marginBottom: 6,
        gap: 12,
    },
    taskCheck: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskChecked: {
        backgroundColor: '#f97316',
        borderColor: '#f97316',
    },
    taskTitle: {
        flex: 1,
        color: '#e2e8f0',
        fontSize: 15,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#64748b',
    },
    taskTime: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
});
