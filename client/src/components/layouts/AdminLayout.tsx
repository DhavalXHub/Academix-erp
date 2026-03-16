import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Book, DollarSign, BarChart2, MessageSquare, Settings, LogOut } from 'lucide-react';

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Note: Replaced "Dashboard" with "LayoutDashboard" logically but using SVG/lucide alias or standard string icons here.
    // Using simple icons for brevity.
    const navItems = [
        { icon: BarChart2, label: 'Telemetry', path: '/admin/dashboard' },
        { icon: Users, label: 'Manage Users', path: '/admin/users' },
        { icon: Book, label: 'Course Catalog', path: '/admin/courses' },
        { icon: DollarSign, label: 'Finance Engine', path: '/admin/finance' },
        { icon: BarChart2, label: 'Deep Analytics', path: '/admin/analytics' },
        { icon: MessageSquare, label: 'Broadcasts', path: '/admin/messages' },
        { icon: Settings, label: 'System Settings', path: '/admin/profile' },
    ];

    return (
        <div style={styles.layout}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.brand}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>Academix</h2>
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
                        <div style={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
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
    layout: { display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
    sidebar: { width: 260, background: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column' },
    brand: { padding: '24px', borderBottom: '1px solid #1e293b' },
    roleTag: { display: 'inline-block', marginTop: 4, fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
    nav: { flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
    navLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, color: '#cbd5e1', textDecoration: 'none', fontWeight: 500, transition: 'all 0.2s' },
    navLinkActive: { background: '#4f46e5', color: '#fff', fontWeight: 600 },
    sidebarFooter: { padding: '24px 16px', borderTop: '1px solid #1e293b' },
    logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'transparent', border: 'none', color: '#f87171', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: { height: 72, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 32px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 },
    userName: { fontWeight: 600, color: '#0f172a' },
    content: { flex: 1, overflowY: 'auto', padding: '32px' }
};

export default AdminLayout;
