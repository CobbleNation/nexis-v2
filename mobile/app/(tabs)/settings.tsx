import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { apiSyncGet } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({ goals: 0, tasks: 0, habits: 0 });

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const data = await apiSyncGet();
            setStats({
                goals: data.goals?.length || 0,
                tasks: data.actions?.filter((a: any) => a.type === 'task')?.length || 0,
                habits: data.habits?.length || 0,
            });
        } catch {
            // ignore 
        }
    }

    async function handleLogout() {
        Alert.alert(
            'Вихід',
            'Ви впевнені, що хочете вийти?',
            [
                { text: 'Скасувати', style: 'cancel' },
                {
                    text: 'Вийти',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    }

    const tierLabel = user?.subscriptionTier === 'pro' ? 'PRO' : 'Free';
    const tierColor = user?.subscriptionTier === 'pro' ? '#f97316' : '#64748b';
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'Користувач'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
                <View style={[styles.tierBadge, { backgroundColor: tierColor + '20' }]}>
                    <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Ionicons name="flag" size={18} color="#3b82f6" />
                    <Text style={styles.statNum}>{stats.goals}</Text>
                    <Text style={styles.statLbl}>Цілі</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Ionicons name="checkbox" size={18} color="#f97316" />
                    <Text style={styles.statNum}>{stats.tasks}</Text>
                    <Text style={styles.statLbl}>Задачі</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Ionicons name="flame" size={18} color="#10b981" />
                    <Text style={styles.statNum}>{stats.habits}</Text>
                    <Text style={styles.statLbl}>Звички</Text>
                </View>
            </View>

            {/* Links */}
            <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Додатково</Text>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="globe-outline" size={20} color="#94a3b8" />
                    <Text style={styles.menuItemText}>Відкрити на сайті</Text>
                    <Ionicons name="open-outline" size={16} color="#475569" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="information-circle-outline" size={20} color="#94a3b8" />
                    <Text style={styles.menuItemText}>Версія 1.0.0</Text>
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Вийти з акаунту</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 48,
        paddingTop: 8,
    },
    profileCard: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#f8fafc',
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f8fafc',
    },
    userEmail: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    tierBadge: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 10,
    },
    tierText: {
        fontSize: 13,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 18,
        padding: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#334155',
    },
    statNum: {
        fontSize: 20,
        fontWeight: '800',
        color: '#f8fafc',
    },
    statLbl: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    menuSection: {
        marginBottom: 20,
    },
    menuSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 16,
        marginBottom: 6,
        gap: 12,
    },
    menuItemText: {
        flex: 1,
        color: '#e2e8f0',
        fontSize: 15,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 14,
        padding: 18,
        gap: 10,
        borderWidth: 1,
        borderColor: '#ef444440',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '700',
    },
});
