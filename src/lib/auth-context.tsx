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
    onboardingCompleted?: boolean;
    cardLast4?: string;
    cardToken?: string;
    role?: 'user' | 'admin' | 'manager' | 'support';
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
        // Skip session recovery and force null.
        const params = new URLSearchParams(window.location.search);
        if (params.get('logged_out') === '1') {
            // Force-clear any remaining cookies via POST
            fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
            setUser(null);
            setIsLoading(false);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        checkSession();
    }, []);

    async function checkSession() {
        try {
            // Try to get user with current access token
            const res = await fetch('/api/auth/me', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.user && typeof data.user.onboardingCompleted === 'undefined') {
                    data.user.onboardingCompleted = false;
                }
                setUser(data.user);
                return;
            }

            // Access token expired/invalid — try refresh
            const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-store' });
            if (!refreshRes.ok) {
                setUser(null);
                return;
            }

            // Refresh succeeded — retry /me with new access token
            const retryRes = await fetch('/api/auth/me', { cache: 'no-store' });
            if (retryRes.ok) {
                const data = await retryRes.json();
                if (data.user && typeof data.user.onboardingCompleted === 'undefined') {
                    data.user.onboardingCompleted = false;
                }
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(credentials: any) {
        // Clear potential stale state
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_active');

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
        if (data.user && typeof data.user.onboardingCompleted === 'undefined') {
            data.user.onboardingCompleted = false;
        }
        setUser(data.user);
        // Hard navigation to ensure clean state
        window.location.href = '/overview';
    }

    async function register(formData: any) {
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_active');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Registration failed');
        }

        const data = await res.json();
        if (data.user && typeof data.user.onboardingCompleted === 'undefined') {
            data.user.onboardingCompleted = false;
        }
        setUser(data.user);
        window.location.href = '/overview';
    }

    async function logout() {
        // 1. Clear local state immediately
        localStorage.removeItem('nexis-data');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_active');
        setUser(null);

        // 2. Clear cookies via POST (server-side, awaited)
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // Ignore — we'll still navigate away
        }

        // 3. Hard navigate to login page with flag
        // The flag ensures AuthProvider won't try to restore session on the login page
        window.location.href = '/login?logged_out=1';
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
            localStorage.removeItem('nexis-data');
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
