/**
 * Centralized API client for all Academix ERP requests.
 *
 * Usage:
 *   import api from './api';
 *   const data = await api.get('/courses', token);
 *   const result = await api.post('/auth/login', body);
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

interface RequestOptions {
    body?: Record<string, unknown>;
    token?: string | null;
}

const buildHeaders = (token?: string | null): HeadersInit => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (res: Response) => {
    const json = await res.json();
    if (!json.success) {
        throw new Error(json.error?.message || `Request failed with status ${res.status}`);
    }
    return json.data;
};

const api = {
    get: async (endpoint: string, token?: string | null) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            credentials: 'include',
            headers: buildHeaders(token),
        });
        return handleResponse(res);
    },

    post: async (endpoint: string, body: Record<string, unknown> = {}, token?: string | null) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            credentials: 'include',
            headers: buildHeaders(token),
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    },

    put: async (endpoint: string, body: Record<string, unknown> = {}, token?: string | null) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            credentials: 'include',
            headers: buildHeaders(token),
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    },

    delete: async (endpoint: string, token?: string | null) => {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: buildHeaders(token),
        });
        return handleResponse(res);
    },
};

export default api;
