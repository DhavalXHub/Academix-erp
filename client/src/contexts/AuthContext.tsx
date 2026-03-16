import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
    useEffect,
} from 'react';
import api, { ACCESS_TOKEN_KEY, client } from '@/services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'admin';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface AuthContextType {
    user: AuthUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    setAccessToken: (token: string) => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Hook ───────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an <AuthProvider>');
    }
    return context;
};

// ── Provider ───────────────────────────────────────────────────────────────────

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // NOTE: accessToken is persisted in localStorage to keep users logged in across refresh.
    // Refresh token remains HTTP-only cookie (server-side).
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const setAccessToken = useCallback((token: string) => {
        setAccessTokenState(token);
        window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }, []);

    const clearSession = useCallback(() => {
        setAccessTokenState(null);
        setUser(null);
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    }, []);

    const fetchMe = useCallback(async (token: string) => {
        const me = await api.get<AuthUser>('/auth/me', token);
        setUser(me);
    }, []);

    /**
     * autoLogin() runs once on startup:
     * - if localStorage has an accessToken: try /auth/me
     * - else (or if token invalid/expired): try /auth/refresh (cookie) then /auth/me
     */
    const autoLogin = useCallback(async () => {
        setIsLoading(true);
        try {
            const stored = window.localStorage.getItem(ACCESS_TOKEN_KEY);
            if (stored) {
                setAccessTokenState(stored);
                try {
                    await fetchMe(stored);
                    return;
                } catch {
                    // fall through to refresh
                }
            }

            // Refresh using HTTP-only cookie (no Authorization required)
            const refreshRes = await client.post('/auth/refresh', {});
            const newToken: string | undefined = refreshRes?.data?.data?.accessToken;
            if (!newToken) throw new Error('Refresh did not return access token.');

            window.localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
            setAccessTokenState(newToken);
            await fetchMe(newToken);
        } catch {
            clearSession();
        } finally {
            setIsLoading(false);
        }
    }, [clearSession, fetchMe]);

    useEffect(() => {
        autoLogin();
    }, [autoLogin]);

    /**
     * Authenticates the user and stores the access token in React state.
     * The refresh token is stored automatically in an HTTP-Only cookie by the server.
     */
    const login = useCallback(async (email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        try {
            const res = await api.post<{ accessToken: string; user: AuthUser }>(
                '/auth/login',
                { email, password, role } as unknown as Record<string, unknown>
            );
            setAccessTokenState(res.accessToken);
            window.localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
            setUser(res.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Logs the user out, calling the server to revoke the refresh token,
     * then clearing local auth state.
     */
    const logout = useCallback(async () => {
        try {
            if (accessToken) {
                await api.post('/auth/logout', {}, accessToken);
            }
        } catch {
            // Silent fail — still clear local state regardless
        } finally {
            clearSession();
        }
    }, [accessToken, clearSession]);

    const value: AuthContextType = {
        user,
        accessToken,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        login,
        logout,
        setAccessToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
