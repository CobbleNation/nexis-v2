import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiGetMe, apiLogin, apiLogout, getAccessToken } from './api';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    subscriptionTier?: 'free' | 'pro';
    role?: string;
    onboardingCompleted?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => {},
    logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession() {
        try {
            const token = await getAccessToken();
            if (!token) {
                setIsLoading(false);
                return;
            }
            const me = await apiGetMe();
            setUser(me);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const userData = await apiLogin(email, password);
        setUser(userData);
    }

    async function logout() {
        await apiLogout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
