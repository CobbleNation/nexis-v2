import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { apiSyncGet } from '../../lib/api';
import type { Goal } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    active: { label: 'Активна', color: '#f97316', icon: 'play-circle-outline' },
    completed: { label: 'Завершена', color: '#10b981', icon: 'checkmark-circle-outline' },
    paused: { label: 'На паузі', color: '#64748b', icon: 'pause-circle-outline' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    high: { label: '🔴 Висока', color: '#ef4444' },
    medium: { label: '🟡 Середня', color: '#eab308' },
    low: { label: '🟢 Низька', color: '#22c55e' },
};

export default function GoalsScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await apiSyncGet();
            setGoals(data.goals || []);
        } catch (e) {
            console.error('Failed to load goals:', e);
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

    const filteredGoals = filter === 'all'
        ? goals
        : goals.filter(g => g.status === filter);

    return (
        <View style={styles.container}>
            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {(['active', 'completed', 'all'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'active' ? 'Активні' : f === 'completed' ? 'Завершені' : 'Всі'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
                }
            >
                {filteredGoals.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="flag-outline" size={48} color="#334155" />
                        <Text style={styles.emptyTitle}>Немає цілей</Text>
                        <Text style={styles.emptySubtitle}>Створіть цілі на сайті zynorvia.com</Text>
                    </View>
                ) : (
                    filteredGoals.map((goal) => {
                        const statusCfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;
                        const priorityCfg = goal.priority ? PRIORITY_CONFIG[goal.priority] : null;

                        return (
                            <View key={goal.id} style={styles.goalCard}>
                                <View style={styles.goalTop}>
                                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
                                        <Ionicons name={statusCfg.icon as any} size={14} color={statusCfg.color} />
                                        <Text style={[styles.statusText, { color: statusCfg.color }]}>
                                            {statusCfg.label}
                                        </Text>
                                    </View>
                                    {priorityCfg && (
                                        <Text style={styles.priorityText}>{priorityCfg.label}</Text>
                                    )}
                                </View>

                                <Text style={styles.goalTitle}>{goal.title}</Text>

                                {goal.description ? (
                                    <Text style={styles.goalDesc} numberOfLines={2}>{goal.description}</Text>
                                ) : null}

                                {/* Progress */}
                                <View style={styles.progressSection}>
                                    <View style={styles.progressHeader}>
                                        <Text style={styles.progressLabel}>Прогрес</Text>
                                        <Text style={styles.progressValue}>{goal.progress || 0}%</Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${Math.min(100, goal.progress || 0)}%`,
                                                    backgroundColor: statusCfg.color,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>

                                {/* Sub-goals */}
                                {goal.subGoals && goal.subGoals.length > 0 && (
                                    <View style={styles.subtasks}>
                                        {goal.subGoals.slice(0, 4).map((sub) => (
                                            <View key={sub.id} style={styles.subtaskRow}>
                                                <View style={[styles.subtaskCheck, sub.completed && styles.subtaskChecked]}>
                                                    {sub.completed && <Ionicons name="checkmark" size={10} color="#fff" />}
                                                </View>
                                                <Text
                                                    style={[styles.subtaskTitle, sub.completed && styles.subtaskDone]}
                                                    numberOfLines={1}
                                                >
                                                    {sub.title}
                                                </Text>
                                            </View>
                                        ))}
                                        {goal.subGoals.length > 4 && (
                                            <Text style={styles.moreText}>
                                                +{goal.subGoals.length - 4} ще
                                            </Text>
                                        )}
                                    </View>
                                )}

                                {/* Deadline */}
                                {goal.deadline && (
                                    <View style={styles.deadlineRow}>
                                        <Ionicons name="calendar-outline" size={14} color="#64748b" />
                                        <Text style={styles.deadlineText}>
                                            До {new Date(goal.deadline).toLocaleDateString('uk-UA')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
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
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1e293b',
    },
    filterTabActive: {
        backgroundColor: '#f97316',
    },
    filterText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#fff',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    emptyCard: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 48,
        alignItems: 'center',
        gap: 12,
        marginTop: 32,
    },
    emptyTitle: {
        color: '#e2e8f0',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtitle: {
        color: '#475569',
        fontSize: 14,
    },
    goalCard: {
        backgroundColor: '#1e293b',
        borderRadius: 18,
        padding: 20,
        marginBottom: 12,
    },
    goalTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    priorityText: {
        fontSize: 12,
    },
    goalTitle: {
        color: '#f8fafc',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    goalDesc: {
        color: '#94a3b8',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    progressSection: {
        marginTop: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
    progressValue: {
        color: '#f8fafc',
        fontSize: 13,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#334155',
        borderRadius: 3,
    },
    progressBarFill: {
        height: 6,
        borderRadius: 3,
    },
    subtasks: {
        marginTop: 14,
        gap: 6,
    },
    subtaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subtaskCheck: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtaskChecked: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    subtaskTitle: {
        color: '#cbd5e1',
        fontSize: 14,
        flex: 1,
    },
    subtaskDone: {
        textDecorationLine: 'line-through',
        color: '#64748b',
    },
    moreText: {
        color: '#475569',
        fontSize: 12,
        marginLeft: 26,
    },
    deadlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    deadlineText: {
        color: '#64748b',
        fontSize: 13,
    },
});
