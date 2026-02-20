'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
        checkSession();
    }, []);

    async function checkSession() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user && typeof data.user.onboardingCompleted === 'undefined') {
                    data.user.onboardingCompleted = false;
                }
                setUser(data.user);
            } else {
                // Try refresh
                const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
                if (refreshRes.ok) {
                    // Retry me
                    const retryRes = await fetch('/api/auth/me');
                    if (retryRes.ok) {
                        const data = await retryRes.json();
                        if (data.user && typeof data.user.onboardingCompleted === 'undefined') {
                            data.user.onboardingCompleted = false;
                        }
                        setUser(data.user);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
        } catch (err) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(credentials: any) {
        // Clear potential stale onboarding state
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
        window.location.href = '/overview'; // Hard navigation to clear potential ghostly cache states
    }

    async function register(formData: any) {
        // Clear potential stale onboarding state
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
        window.location.href = '/overview'; // Hard navigation to bypass cache ghosting
    }

    async function logout() {
        // Clear local data immediately for UI responsiveness
        localStorage.removeItem('nexis-data');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_active');
        setUser(null);

        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout request failed', e);
        }

        // Wait a tiny bit (150ms) before hard navigation to ensure the browser 
        // processes the HttpOnly Set-Cookie deletion headers. Fast navigations 
        // can occasionally tear down the network socket before headers are flushed.
        setTimeout(() => {
            window.location.href = '/login';
        }, 150);
    }

    async function updateProfile(data: Partial<User>) {
        if (!user) return;

        // Optimistic update
        const updatedUser = { ...user, ...data };
        // Name Logic: If first/last provided, reconstruct full name
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
            // Revert if critical, but for local-first mock it's fine
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
