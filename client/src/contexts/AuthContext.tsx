import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from 'react';

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

const API_BASE = 'http://localhost:5000/api/v1';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // Access token lives strictly in React memory (NOT localStorage) to block XSS attacks
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const setAccessToken = useCallback((token: string) => {
        setAccessTokenState(token);
    }, []);

    /**
     * Authenticates the user and stores the access token in React state.
     * The refresh token is stored automatically in an HTTP-Only cookie by the server.
     */
    const login = useCallback(async (email: string, password: string, role: UserRole) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Sends/receives cookies
                body: JSON.stringify({ email, password, role }),
            });

            const json = await res.json();

            if (!json.success) {
                throw new Error(json.error?.message || 'Login failed.');
            }

            setAccessTokenState(json.data.accessToken);
            setUser(json.data.user);
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
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: 'include',
                });
            }
        } catch {
            // Silent fail — still clear local state regardless
        } finally {
            setAccessTokenState(null);
            setUser(null);
        }
    }, [accessToken]);

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
