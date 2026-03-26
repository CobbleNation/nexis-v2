// API Base URL - Switch between local dev and production
// For local testing: use your Mac's local IP
// For production: use https://zynorvia.com
const API_BASE = __DEV__ 
    ? 'http://192.168.31.185:3000' 
    : 'https://zynorvia.com';

import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'zynorvia_access_token';
const REFRESH_TOKEN_KEY = 'zynorvia_refresh_token';

// --- Token Storage ---
export async function getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// --- Authenticated Fetch ---
async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    let accessToken = await getAccessToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // If 401, try to refresh
    if (res.status === 401 && accessToken) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshRes.ok) {
                const data = await refreshRes.json();
                await setTokens(data.accessToken, data.refreshToken);

                // Retry original request with new token
                headers['Authorization'] = `Bearer ${data.accessToken}`;
                res = await fetch(`${API_BASE}${path}`, { ...options, headers });
            } else {
                // Refresh failed — clear tokens
                await clearTokens();
            }
        }
    }

    return res;
}

// --- API Methods ---
export async function apiLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Не вдалося увійти');
    }

    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return data.user;
}

export async function apiGetMe() {
    const res = await authFetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
}

export async function apiSyncGet() {
    const res = await authFetch('/api/sync');
    if (!res.ok) throw new Error('Sync failed');
    return res.json();
}

export async function apiSyncPost(type: string, data: any) {
    const res = await authFetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({ type, data }),
    });
    if (!res.ok) throw new Error('Sync failed');
    return res.json();
}

export async function apiLogout() {
    await clearTokens();
}
