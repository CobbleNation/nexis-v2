import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [user, isLoading]);

    if (isLoading || !user) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#1e293b',
                    borderTopColor: '#334155',
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 88,
                },
                tabBarActiveTintColor: '#f97316',
                tabBarInactiveTintColor: '#64748b',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#0f172a',
                    shadowColor: 'transparent',
                    elevation: 0,
                },
                headerTintColor: '#f8fafc',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Огляд',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                    headerTitle: 'Zynorvia',
                }}
            />
            <Tabs.Screen
                name="goals"
                options={{
                    title: 'Цілі',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="flag-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="actions"
                options={{
                    title: 'Дії',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="checkbox-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Профіль',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
