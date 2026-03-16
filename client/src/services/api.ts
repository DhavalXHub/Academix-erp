/**
 * Centralized API client for all Academix ERP requests.
 *
 * IMPORTANT: Uses axios + credentials to support cookie-based refresh flows,
 * while still allowing bearer access tokens from `AuthContext`.
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    'http://localhost:5000/api/v1';

const ACCESS_TOKEN_KEY = 'academix_access_token';

type ApiEnvelope<T> =
    | { success: true; data: T }
    | { success: false; error?: { message?: string } };

const client: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

const unwrap = <T>(envelope: ApiEnvelope<T>): T => {
    if ((envelope as any)?.success) return (envelope as any).data as T;
    throw new Error((envelope as any)?.error?.message || 'Request failed.');
};

// ── Silent Refresh (401 TOKEN_EXPIRED) ──────────────────────────────────────
let isRefreshing = false;
let pending: Array<(token: string | null) => void> = [];

const resolvePending = (token: string | null) => {
    pending.forEach(fn => fn(token));
    pending = [];
};

client.interceptors.request.use((config) => {
    // If caller didn't supply Authorization, fall back to localStorage token.
    const hasAuthHeader = !!(config.headers as any)?.Authorization;
    if (!hasAuthHeader) {
        const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
            (config.headers as any) = { ...(config.headers as any), Authorization: `Bearer ${token}` };
        }
    }
    return config;
});

client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error?.response?.status;
        const code = error?.response?.data?.error?.code;
        const originalRequest = error?.config;

        const isAuthRefreshCall = typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/refresh');
        const shouldAttemptRefresh =
            status === 401 &&
            (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'NO_TOKEN') &&
            !isAuthRefreshCall &&
            !originalRequest?._retry;

        if (!shouldAttemptRefresh) throw error;

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pending.push((newToken) => {
                    if (!newToken) return reject(error);
                    originalRequest._retry = true;
                    originalRequest.headers = { ...(originalRequest.headers || {}), Authorization: `Bearer ${newToken}` };
                    resolve(client(originalRequest));
                });
            });
        }

        isRefreshing = true;
        try {
            const refreshRes = await client.post<ApiEnvelope<{ accessToken: string }>>('/auth/refresh', {});
            const newToken = unwrap(refreshRes.data).accessToken;
            window.localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
            resolvePending(newToken);

            originalRequest._retry = true;
            originalRequest.headers = { ...(originalRequest.headers || {}), Authorization: `Bearer ${newToken}` };
            return client(originalRequest);
        } catch (refreshErr) {
            window.localStorage.removeItem(ACCESS_TOKEN_KEY);
            resolvePending(null);
            throw refreshErr;
        } finally {
            isRefreshing = false;
        }
    }
);

const api = {
    get: async <T = any>(endpoint: string, token?: string | null): Promise<T> => {
        const res = await client.get<ApiEnvelope<T>>(endpoint, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return unwrap(res.data);
    },

    post: async <T = any>(
        endpoint: string,
        body: Record<string, unknown> = {},
        token?: string | null
    ): Promise<T> => {
        const res = await client.post<ApiEnvelope<T>>(endpoint, body, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return unwrap(res.data);
    },

    put: async <T = any>(
        endpoint: string,
        body: Record<string, unknown> = {},
        token?: string | null
    ): Promise<T> => {
        const res = await client.put<ApiEnvelope<T>>(endpoint, body, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return unwrap(res.data);
    },

    delete: async <T = any>(endpoint: string, token?: string | null): Promise<T> => {
        const res = await client.delete<ApiEnvelope<T>>(endpoint, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return unwrap(res.data);
    },
};

export default api;
export { client, API_BASE_URL, ACCESS_TOKEN_KEY };