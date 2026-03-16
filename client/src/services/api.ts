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
