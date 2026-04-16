import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Calendar, CheckSquare, MessageSquare, CreditCard, User, LogOut, LayoutDashboard, Home, FileText } from 'lucide-react';
import TopBar from '@/components/TopBar';

const StudentLayout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { icon: BookOpen, label: 'Courses', path: '/student/courses' },
        { icon: CheckSquare, label: 'Attendance', path: '/student/attendance' },
        { icon: FileText, label: 'Assignments', path: '/student/assignments' },
        { icon: Calendar, label: 'Quizzes', path: '/student/quizzes' },
        { icon: MessageSquare, label: 'Messages', path: '/student/messages' },
        { icon: CreditCard, label: 'Fees & Dues', path: '/student/fees' },
        { icon: User, label: 'Profile', path: '/student/profile' },
    ];

    return (
        <div style={styles.layout}>
            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <Link to="/" style={styles.logoLink}>
                        <span style={styles.logoIcon}>📘</span>
                        <h2 style={styles.logoText}>Academix</h2>
                    </Link>
                    <span style={styles.roleTag}>Student Portal</span>
                </div>
                
                <nav style={styles.nav}>
                    {navItems.map((item, idx) => (
                        <NavLink
                            key={idx}
                            to={item.path}
                            style={({ isActive }) => ({
                                ...styles.navLink,
                                ...(isActive ? styles.navLinkActive : {})
                            })}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={styles.sidebarFooter}>
                    <Link to="/" style={styles.homeLink}><Home size={16} /> Back to Home</Link>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <div style={styles.main}>
                <TopBar />
                <main style={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    layout: { display: 'flex', minHeight: '100vh', background: 'var(--page-bg)', fontFamily: "'Inter', sans-serif" },
    sidebar: {
        width: 240, background:'var(--card-bg)', borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column',
    },
    brand: { padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' },
    logoLink: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
    logoIcon: { fontSize: 20 },
    logoText: { margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' },
    roleTag: {
        display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700,
        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
    },
    nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
    navLink: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderRadius: 10, color: 'var(--text-muted)', textDecoration: 'none',
        fontWeight: 500, fontSize: 13.5, transition: 'all 0.15s',
    },
    navLinkActive: {
        background: '#eff6ff', color: '#2563eb', fontWeight: 600,
    },
    sidebarFooter: {
        padding: '16px 12px', borderTop: '1px solid #f3f4f6',
        display: 'flex', flexDirection: 'column', gap: 4,
    },
    homeLink: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderRadius: 10, color: 'var(--text-muted)', textDecoration: 'none',
        fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
    },
    logoutBtn: {
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10, background: 'transparent',
        border: 'none', color: '#ef4444', fontWeight: 600, fontSize: 13,
        cursor: 'pointer', transition: 'background 0.15s',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    content: { flex: 1, overflowY: 'auto', padding: '28px' },
};

export default StudentLayout;
