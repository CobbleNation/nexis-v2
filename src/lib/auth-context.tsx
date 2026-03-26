'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    subscriptionTier?: 'free' | 'pro';
    subscriptionStartedAt?: Date | string;
    subscriptionExpiresAt?: Date | string;
    subscriptionPeriod?: 'month' | 'year';
    currentPriceOverride?: number | null;
    recurringPriceOverride?: number | null;
    autoRenew?: boolean;

    cardLast4?: string;
    cardToken?: string;

    onboardingCompleted?: boolean;
    createdAt?: Date | string;

    role?: 'user' | 'support' | 'manager' | 'admin';
    customLimits?: Record<string, any> | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check session on mount
    useEffect(() => {
        // If URL has ?logged_out=1, the user just explicitly logged out.
        const params = new URLSearchParams(window.location.search);
        if (params.get('logged_out') === '1') {
            fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
            localStorage.removeItem('zynorvia-data');

            setUser(null);
            setIsLoading(false);
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        checkSession();
    }, []);

    async function checkSession() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const fetchOpts = { cache: 'no-store' as const, signal: controller.signal };

        const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/privacy', '/terms', '/auth/verify', '/auth/verified'];

        try {
            // Try to get user with current access token
            const res = await fetch('/api/auth/me', fetchOpts);
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                return;
            }

            // Access token expired/invalid — try refresh
            const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', ...fetchOpts });
            if (!refreshRes.ok) {
                setUser(null);
                const path = window.location.pathname;
                if (!publicPaths.includes(path)) {
                    window.location.href = '/login';
                }
                return;
            }

            // Refresh succeeded — retry /me with new access token
            const retryRes = await fetch('/api/auth/me', fetchOpts);
            if (retryRes.ok) {
                const data = await retryRes.json();
                setUser(data.user);
            } else {
                setUser(null);
                const path = window.location.pathname;
                if (!publicPaths.includes(path)) {
                    window.location.href = '/login';
                }
            }
        } catch (e: any) {
            if (e?.name === 'AbortError') {
                console.warn('Auth check timed out after 10s');
            }
            setUser(null);
        } finally {
            clearTimeout(timeout);
            setIsLoading(false);
        }
    }

    async function login(credentials: any) {


        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await res.json();

        setUser(data.user);
        // Hard navigation to ensure clean state
        window.location.href = '/overview';
    }

    async function register(formData: any) {


        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Registration failed');
        }

        // No auto-login after register anymore since verification is required
        // setUser(data.user);
        // window.location.href = '/overview';
    }

    async function logout() {
        // 1. Clear local state immediately
        localStorage.removeItem('zynorvia-data');

        setUser(null);

        // 2. Clear cookies via POST (server-side, awaited)
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // Ignore — we'll still navigate away
        }

        // 3. Hard navigate to landing page instead of login for broad cookie clearing
        window.location.href = 'https://zynorvia.com/?logged_out=1';
    }

    async function updateProfile(data: Partial<User>) {
        if (!user) return;

        const updatedUser = { ...user, ...data };
        if (data.firstName || data.lastName) {
            updatedUser.name = `${data.firstName || user.firstName || ''} ${data.lastName || user.lastName || ''}`.trim();
        }
        setUser(updatedUser);

        try {
            await fetch('/api/auth/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } catch (e) {
            console.error("Failed to sync profile update", e);
        }
    }

    async function deleteAccount() {
        if (!confirm('Are you absolutely sure? This action cannot be undone.')) return;

        try {
            await fetch('/api/auth/delete', { method: 'POST' });
            localStorage.removeItem('zynorvia-data');
            setUser(null);
            router.push('/login');
        } catch (e) {
            console.error(e);
            alert("Failed to delete account");
        }
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
