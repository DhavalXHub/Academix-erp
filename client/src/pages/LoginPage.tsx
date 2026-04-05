import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

type RoleOption = { value: UserRole; label: string; emoji: string; description: string };

const ROLES: RoleOption[] = [
    { value: 'student', label: 'Student', emoji: '🎓', description: 'Access your courses, grades & attendance' },
    { value: 'faculty', label: 'Faculty', emoji: '🏫', description: 'Manage classes, quizzes & assignments' },
    { value: 'admin', label: 'Admin', emoji: '⚙️', description: 'Oversee the entire institution' },
];

const ROLE_DASHBOARD: Record<UserRole, string> = {
    student: '/student/dashboard',
    faculty: '/faculty/dashboard',
    admin: '/admin/dashboard',
};

const LoginPage: React.FC = () => {
    const { login, isLoading, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // After login, redirect to where the user originally wanted to go
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || null;

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(ROLE_DASHBOARD[user.role], { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedRole) {
            setErrorMessage('Please select a role before continuing.');
            return;
        }
        setErrorMessage('');

        try {
            await login(email, password, selectedRole);
            // Redirect to intended destination or role-specific dashboard
            navigate(from ?? ROLE_DASHBOARD[selectedRole], { replace: true });
        } catch (err: any) {
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div style={styles.page}>
            {/* ── Background decorative blobs ──────────────────────────── */}
            <div style={styles.blob1} />
            <div style={styles.blob2} />

            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logo}>
                        <span style={styles.logoIcon}>📘</span>
                        <span style={styles.logoText}>Academix</span>
                    </div>
                    <h1 style={styles.title}>Welcome back</h1>
                    <p style={styles.subtitle}>Sign in to your Smart Campus portal</p>
                </div>

                {/* Role Selection */}
                {!selectedRole && (
                    <div>
                        <p style={styles.roleLabel}>Choose your role to continue</p>
                        <div style={styles.roleGrid}>
                            {ROLES.map((r) => (
                                <button
                                    key={r.value}
                                    style={styles.roleCard}
                                    onClick={() => setSelectedRole(r.value)}
                                    aria-label={`Login as ${r.label}`}
                                >
                                    <span style={styles.roleEmoji}>{r.emoji}</span>
                                    <span style={styles.roleCardLabel}>{r.label}</span>
                                    <span style={styles.roleCardDesc}>{r.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Login Form (shown after role selection) */}
                {selectedRole && (
                    <form onSubmit={handleSubmit} style={styles.form} noValidate>
                        {/* Selected role badge */}
                        <div style={styles.roleBadge}>
                            <span>{ROLES.find(r => r.value === selectedRole)?.emoji} {ROLES.find(r => r.value === selectedRole)?.label}</span>
                            <button
                                type="button"
                                style={styles.changeRole}
                                onClick={() => { setSelectedRole(null); setErrorMessage(''); }}
                            >
                                Change
                            </button>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div style={styles.errorBox} role="alert">
                                ⚠️ {errorMessage}
                            </div>
                        )}

                        {/* Email */}
                        <div style={styles.fieldWrapper}>
                            <label htmlFor="email" style={styles.label}>Email address</label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                style={styles.input}
                                placeholder="you@academix.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div style={styles.fieldWrapper}>
                            <label htmlFor="password" style={styles.label}>Password</label>
                            <div style={styles.inputWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    style={{ ...styles.input, paddingRight: '3rem' }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    style={styles.eyeBtn}
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            style={{
                                ...styles.submitBtn,
                                opacity: isLoading ? 0.7 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? '⏳ Signing in...' : 'Sign in →'}
                        </button>
                    </form>
                )}

                {/* Demo Credentials hint */}
                <div style={styles.demoHint}>
                    <strong>Demo:</strong> student1@academix.edu / password123
                </div>
            </div>
        </div>
    );
};

// ── Inline styles (no Tailwind dependency in this plain-HTML project) ─────────
const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        padding: '1rem',
    },
    blob1: {
        position: 'absolute', top: '-15%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
    },
    blob2: {
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none',
    },
    card: {
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 10,
        color: '#fff',
    },
    header: { textAlign: 'center', marginBottom: '2rem' },
    logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1.5rem' },
    logoIcon: { fontSize: 28 },
    logoText: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#e0e7ff' },
    title: { fontSize: 26, fontWeight: 700, margin: '0 0 0.5rem', color: '#fff' },
    subtitle: { color: '#a5b4fc', fontSize: 14, margin: 0 },
    roleLabel: { textAlign: 'center', color: '#c7d2fe', fontSize: 14, marginBottom: '1rem' },
    roleGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
    roleCard: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '1rem 1.25rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        gap: 14, color: '#fff', textAlign: 'left', transition: 'all 0.2s',
        width: '100%',
    },
    roleEmoji: { fontSize: 24, minWidth: 32 },
    roleCardLabel: { fontWeight: 600, fontSize: 15, display: 'block' },
    roleCardDesc: { fontSize: 12, color: '#a5b4fc', display: 'block', marginTop: 2 },
    roleBadge: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
        borderRadius: 8, padding: '0.5rem 0.75rem',
        fontSize: 14, fontWeight: 500, marginBottom: '1.25rem',
    },
    changeRole: {
        background: 'none', border: 'none', color: '#a5b4fc',
        cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
    },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    errorBox: {
        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: 8, padding: '0.75rem 1rem', fontSize: 14, color: '#fca5a5',
    },
    fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 13, fontWeight: 500, color: '#c7d2fe' },
    input: {
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 10, padding: '0.75rem 1rem', fontSize: 15,
        color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    inputWrapper: { position: 'relative' },
    eyeBtn: {
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1,
    },
    submitBtn: {
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        border: 'none', borderRadius: 10, padding: '0.85rem',
        fontSize: 16, fontWeight: 600, color: '#fff',
        cursor: 'pointer', transition: 'opacity 0.2s, transform 0.1s',
        marginTop: 4, letterSpacing: '0.3px',
    },
    demoHint: {
        marginTop: '1.5rem', textAlign: 'center', fontSize: 12,
        color: '#6b7280', background: 'rgba(255,255,255,0.04)',
        borderRadius: 8, padding: '0.6rem', border: '1px dashed rgba(255,255,255,0.1)',
    },
};

export default LoginPage;
