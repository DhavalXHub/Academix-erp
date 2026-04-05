import React, { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

type RoleOption = { value: UserRole; label: string; emoji: string; description: string };

const ROLES: RoleOption[] = [
    { value: 'student', label: 'Student', emoji: '🎓', description: 'Access your courses, grades & attendance' },
    { value: 'faculty', label: 'Faculty', emoji: '🏫', description: 'Manage classes, quizzes & assignments' },
    { value: 'admin', label: 'Admin', emoji: '⚙️', description: 'Oversee the entire institution' },
];

const DEMO_CREDS: Record<UserRole, { email: string; password: string }> = {
    student: { email: 'student1@academix.edu', password: 'password123' },
    faculty: { email: 'faculty1@academix.edu', password: 'password123' },
    admin: { email: 'admin@academix.edu', password: 'password123' },
};

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
            navigate(from ?? ROLE_DASHBOARD[selectedRole], { replace: true });
        } catch (err: any) {
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    const fillDemo = (role: UserRole) => {
        setSelectedRole(role);
        setEmail(DEMO_CREDS[role].email);
        setPassword(DEMO_CREDS[role].password);
        setErrorMessage('');
    };

    return (
        <div style={styles.page}>
            {/* Subtle background elements */}
            <div style={styles.bgCircle1} />
            <div style={styles.bgCircle2} />

            {/* Back to Home */}
            <Link to="/" style={styles.backBtn}>← Back to Home</Link>

            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logo}>
                        <span style={{ fontSize: 24 }}>📘</span>
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
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb';
                                        (e.currentTarget as HTMLButtonElement).style.background = '#f0f7ff';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
                                        (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                                    }}
                                >
                                    <span style={styles.roleEmoji}>{r.emoji}</span>
                                    <div>
                                        <span style={styles.roleCardLabel}>{r.label}</span>
                                        <span style={styles.roleCardDesc}>{r.description}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Login Form */}
                {selectedRole && (
                    <form onSubmit={handleSubmit} style={styles.form} noValidate>
                        <div style={styles.roleBadge}>
                            <span>{ROLES.find(r => r.value === selectedRole)?.emoji} {ROLES.find(r => r.value === selectedRole)?.label}</span>
                            <button
                                type="button" style={styles.changeRole}
                                onClick={() => { setSelectedRole(null); setErrorMessage(''); setEmail(''); setPassword(''); }}
                            >Change</button>
                        </div>

                        {errorMessage && (
                            <div style={styles.errorBox} role="alert">⚠️ {errorMessage}</div>
                        )}

                        <div style={styles.fieldWrapper}>
                            <label htmlFor="email" style={styles.label}>Email address</label>
                            <input
                                id="email" type="email" autoComplete="email" required
                                style={styles.input} placeholder="you@academix.edu"
                                value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading}
                            />
                        </div>

                        <div style={styles.fieldWrapper}>
                            <label htmlFor="password" style={styles.label}>Password</label>
                            <div style={styles.inputWrapper}>
                                <input
                                    id="password" type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password" required
                                    style={{ ...styles.input, paddingRight: '3rem' }} placeholder="••••••••"
                                    value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading}
                                />
                                <button
                                    type="button" style={styles.eyeBtn}
                                    onClick={() => setShowPassword(v => !v)}
                                >{showPassword ? '🙈' : '👁️'}</button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            style={{ ...styles.submitBtn, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                            disabled={isLoading}
                        >
                            {isLoading ? '⏳ Signing in...' : 'Sign in →'}
                        </button>
                    </form>
                )}

                {/* Demo Credentials Section */}
                <div style={styles.demoSection}>
                    <p style={styles.demoTitle}>Quick Demo Login</p>
                    <div style={styles.demoBtnRow}>
                        {ROLES.map(r => (
                            <button key={r.value} style={styles.demoBtn} onClick={() => fillDemo(r.value)}>
                                {r.emoji} {r.label}
                            </button>
                        ))}
                    </div>
                    <p style={styles.demoHint}>Click a role above to auto-fill demo credentials</p>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f0f4f8', fontFamily: "'Inter', 'Segoe UI', sans-serif",
        position: 'relative', overflow: 'hidden', padding: '1rem',
    },
    bgCircle1: {
        position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents: 'none',
    },
    bgCircle2: {
        position: 'absolute', bottom: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', pointerEvents: 'none',
    },
    backBtn: {
        position: 'absolute', top: 24, left: 24, fontSize: 13, fontWeight: 600,
        color: '#6b7280', textDecoration: 'none', zIndex: 20,
        padding: '8px 16px', borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.15s',
    },
    card: {
        background: '#fff', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        position: 'relative', zIndex: 10,
    },
    header: { textAlign: 'center', marginBottom: '2rem' },
    logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1.25rem' },
    logoText: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#111827' },
    title: { fontSize: 24, fontWeight: 800, margin: '0 0 0.4rem', color: '#111827', letterSpacing: '-0.5px' },
    subtitle: { color: '#6b7280', fontSize: 14, margin: 0, fontWeight: 500 },
    roleLabel: { textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: '1rem', fontWeight: 600 },
    roleGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
    roleCard: {
        background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '14px 16px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
        textAlign: 'left', transition: 'all 0.15s', width: '100%',
    },
    roleEmoji: { fontSize: 28, minWidth: 40, textAlign: 'center' },
    roleCardLabel: { fontWeight: 700, fontSize: 15, display: 'block', color: '#111827' },
    roleCardDesc: { fontSize: 12, color: '#6b7280', display: 'block', marginTop: 2, fontWeight: 500 },
    roleBadge: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
        padding: '10px 14px', fontSize: 14, fontWeight: 600, marginBottom: '1.25rem', color: '#1e40af',
    },
    changeRole: {
        background: 'none', border: 'none', color: '#2563eb',
        cursor: 'pointer', fontSize: 13, fontWeight: 600,
    },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    errorBox: {
        background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
        padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 500,
    },
    fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 13, fontWeight: 600, color: '#374151' },
    input: {
        background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10,
        padding: '11px 14px', fontSize: 14, color: '#111827', outline: 'none',
        width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
        fontFamily: "'Inter', sans-serif", fontWeight: 500,
    },
    inputWrapper: { position: 'relative' },
    eyeBtn: {
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1,
    },
    submitBtn: {
        background: '#2563eb', border: 'none', borderRadius: 12, padding: '12px',
        fontSize: 15, fontWeight: 700, color: '#fff',
        cursor: 'pointer', transition: 'all 0.15s', marginTop: 4,
        boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
    },
    demoSection: {
        marginTop: '1.5rem', textAlign: 'center', padding: '16px',
        background: '#f9fafb', borderRadius: 14, border: '1px solid #e5e7eb',
    },
    demoTitle: { margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' },
    demoBtnRow: { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 },
    demoBtn: {
        padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff',
        fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151', transition: 'all 0.15s',
    },
    demoHint: { margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500 },
};

export default LoginPage;
