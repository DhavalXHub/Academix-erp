import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Calendar, CheckSquare, MessageSquare, CreditCard, User, LogOut, LayoutDashboard } from 'lucide-react';

const StudentLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
        { icon: BookOpen, label: 'Courses', path: '/student/courses' },
        { icon: CheckSquare, label: 'Attendance', path: '/student/attendance' },
        { icon: Calendar, label: 'Quizzes', path: '/student/quizzes' },
        { icon: MessageSquare, label: 'Messages', path: '/student/messages' },
        { icon: CreditCard, label: 'Fees & Dues', path: '/student/fees' },
        { icon: User, label: 'My Profile', path: '/student/profile' },
    ];

    return (
        <div style={styles.layout}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>Academix</h2>
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
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={styles.sidebarFooter}>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={styles.main}>
                <header style={styles.header}>
                    <div style={{ flex: 1 }} />
                    <div style={styles.userInfo}>
                        <div style={styles.avatar}>{user?.name?.charAt(0) || 'S'}</div>
                        <span style={styles.userName}>{user?.name}</span>
                    </div>
                </header>
                <main style={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    layout: { display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter', sans-serif" },
    sidebar: { width: 260, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' },
    brand: { padding: '24px', borderBottom: '1px solid #f3f4f6' },
    roleTag: { display: 'inline-block', marginTop: 4, fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 },
    nav: { flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
    navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, color: '#4b5563', textDecoration: 'none', fontWeight: 500, transition: 'all 0.2s' },
    navLinkActive: { background: '#eef2ff', color: '#4f46e5', fontWeight: 600 },
    sidebarFooter: { padding: '24px 16px', borderTop: '1px solid #f3f4f6' },
    logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { height: 72, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 32px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 },
    userName: { fontWeight: 600, color: '#111827' },
    content: { flex: 1, overflowY: 'auto', padding: '32px' }
};

export default StudentLayout;
