import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Book, DollarSign, BarChart2, MessageSquare, Settings, LogOut, Megaphone, Home } from 'lucide-react';
import TopBar from '@/components/TopBar';

const AdminLayout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { icon: BarChart2, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Book, label: 'Courses', path: '/admin/courses' },
        { icon: DollarSign, label: 'Finance', path: '/admin/finance' },
        { icon: BarChart2, label: 'Analytics', path: '/admin/analytics' },
        { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
        { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
        { icon: Settings, label: 'Settings', path: '/admin/profile' },
    ];

    return (
        <div style={styles.layout}>
            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <Link to="/" style={styles.logoLink}>
                        <span style={styles.logoIcon}>📘</span>
                        <h2 style={styles.logoText}>Academix</h2>
                    </Link>
                    <span style={styles.roleTag}>Admin Console</span>
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
    layout: { display: 'flex', minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" },
    sidebar: {
        width: 240, background: '#fff', color: '#111827',
        display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb',
    },
    brand: { padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' },
    logoLink: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
    logoIcon: { fontSize: 20 },
    logoText: { margin: 0, fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' },
    roleTag: {
        display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700,
        color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em',
    },
    nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
    navLink: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderRadius: 10, color: '#6b7280', textDecoration: 'none',
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
        borderRadius: 10, color: '#6b7280', textDecoration: 'none',
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

export default AdminLayout;
