import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { apiSyncGet, apiSyncPost } from '../../lib/api';
import type { Action } from '../../lib/types';
import { Ionicons } from '@expo/vector-icons';

export default function ActionsScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actions, setActions] = useState<Action[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [addingTask, setAddingTask] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await apiSyncGet();
            setActions(data.actions || []);
        } catch (e) {
            console.error('Failed to load actions:', e);
        } finally {
            setIsLoading(false);
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    async function toggleAction(action: Action) {
        // Optimistic update
        setActions(prev =>
            prev.map(a => a.id === action.id ? { ...a, completed: !a.completed } : a)
        );

        try {
            await apiSyncPost('TOGGLE_ACTION', { id: action.id });
        } catch {
            // Revert on error
            setActions(prev =>
                prev.map(a => a.id === action.id ? { ...a, completed: !a.completed } : a)
            );
        }
    }

    async function addTask() {
        if (!newTitle.trim()) return;
        setAddingTask(true);

        const todayStr = new Date().toISOString().split('T')[0];
        const newAction: Action = {
            id: `mob_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            title: newTitle.trim(),
            type: 'task',
            status: 'pending',
            completed: false,
            date: todayStr,
        };

        try {
            await apiSyncPost('ADD_ACTION', {
                ...newAction,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            setActions(prev => [newAction, ...prev]);
            setNewTitle('');
            setShowAdd(false);
        } catch (e) {
            Alert.alert('Помилка', 'Не вдалося додати задачу');
        } finally {
            setAddingTask(false);
        }
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayActions = actions.filter(a => a.date === todayStr);
    const otherActions = actions.filter(a => a.date !== todayStr && !a.completed);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />
                }
            >
                {/* Add Task */}
                {showAdd ? (
                    <View style={styles.addCard}>
                        <TextInput
                            style={styles.addInput}
                            value={newTitle}
                            onChangeText={setNewTitle}
                            placeholder="Назва задачі..."
                            placeholderTextColor="#64748b"
                            autoFocus
                            onSubmitEditing={addTask}
                            returnKeyType="done"
                        />
                        <View style={styles.addActions}>
                            <TouchableOpacity
                                style={styles.addCancelBtn}
                                onPress={() => { setShowAdd(false); setNewTitle(''); }}
                            >
                                <Text style={styles.addCancelText}>Скасувати</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addConfirmBtn, addingTask && { opacity: 0.6 }]}
                                onPress={addTask}
                                disabled={addingTask}
                            >
                                {addingTask ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.addConfirmText}>Додати</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                {/* Today */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Сьогодні · {todayActions.filter(a => a.completed).length}/{todayActions.length}
                    </Text>
                    {todayActions.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="sunny-outline" size={32} color="#475569" />
                            <Text style={styles.emptyText}>Немає задач на сьогодні</Text>
                        </View>
                    ) : (
                        todayActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.taskItem}
                                onPress={() => toggleAction(action)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.taskCheck, action.completed && styles.taskChecked]}>
                                    {action.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                                <View style={styles.taskContent}>
                                    <Text
                                        style={[styles.taskTitle, action.completed && styles.taskTitleDone]}
                                        numberOfLines={2}
                                    >
                                        {action.title}
                                    </Text>
                                    {action.startTime && (
                                        <Text style={styles.taskMeta}>
                                            🕐 {action.startTime}
                                            {action.duration ? ` · ${action.duration} хв` : ''}
                                        </Text>
                                    )}
                                </View>
                                {action.priority === 'high' && (
                                    <View style={styles.priorityDot} />
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Other tasks */}
                {otherActions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Інші задачі</Text>
                        {otherActions.slice(0, 20).map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.taskItem}
                                onPress={() => toggleAction(action)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.taskCheck, action.completed && styles.taskChecked]}>
                                    {action.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                                <View style={styles.taskContent}>
                                    <Text
                                        style={[styles.taskTitle, action.completed && styles.taskTitleDone]}
                                        numberOfLines={1}
                                    >
                                        {action.title}
                                    </Text>
                                    {action.date && (
                                        <Text style={styles.taskMeta}>
                                            📅 {new Date(action.date).toLocaleDateString('uk-UA')}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            {!showAdd && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowAdd(true)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}
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
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        paddingTop: 8,
    },
    addCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f97316',
    },
    addInput: {
        fontSize: 16,
        color: '#f8fafc',
        paddingVertical: 8,
        marginBottom: 12,
    },
    addActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    addCancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addCancelText: {
        color: '#64748b',
        fontWeight: '600',
    },
    addConfirmBtn: {
        backgroundColor: '#f97316',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addConfirmText: {
        color: '#fff',
        fontWeight: '700',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: 12,
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
        width: 24,
        height: 24,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#475569',
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskChecked: {
        backgroundColor: '#f97316',
        borderColor: '#f97316',
    },
    taskContent: {
        flex: 1,
        gap: 2,
    },
    taskTitle: {
        color: '#e2e8f0',
        fontSize: 15,
        fontWeight: '500',
    },
    taskTitleDone: {
        textDecorationLine: 'line-through',
        color: '#64748b',
    },
    taskMeta: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 2,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f97316',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
});
