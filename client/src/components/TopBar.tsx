import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Bell, ChevronDown, User, Settings, LogOut, Home, X } from 'lucide-react';

/* ─────────────────────────────────────────────
   Mock Notifications (dummy data)
───────────────────────────────────────────── */
const INITIAL_NOTIFICATIONS = [
    { id: 1, text: 'New assignment uploaded for CS101', time: '5 min ago', read: false, icon: '📝' },
    { id: 2, text: 'Fee payment reminder — due in 3 days', time: '1 hour ago', read: false, icon: '💳' },
    { id: 3, text: 'Quiz results published: Data Structures', time: '3 hours ago', read: true, icon: '📊' },
    { id: 4, text: 'Attendance marked for today\'s lecture', time: 'Yesterday', read: true, icon: '✅' },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const ROLE_LABELS: Record<string, string> = {
    student: 'Student',
    faculty: 'Faculty',
    admin: 'Administrator',
};

const getPageTitle = (pathname: string): string => {
    const segment = pathname.split('/').filter(Boolean).pop() || '';
    if (!segment) return 'Dashboard';
    return segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};

/* ─────────────────────────────────────────────
   TopBar Component
───────────────────────────────────────────── */
interface TopBarProps {
    pageTitle?: string;
}

const TopBar: React.FC<TopBarProps> = ({ pageTitle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    /* Close dropdowns on outside click */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        setShowProfile(false);
        await logout();
        navigate('/login');
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const title = pageTitle || getPageTitle(location.pathname);

    return (
        <header style={s.bar}>
            {/* ── Left: Home icon + Page title ── */}
            <div style={s.left}>
                <Link to="/" style={s.homeBtn} title="Back to Home">
                    <Home size={17} />
                </Link>
                <span style={s.pageTitle}>{title}</span>
            </div>

            {/* ── Center: Search bar ── */}
            <div style={s.searchWrap}>
                <Search size={15} style={{ color: '#9ca3af', flexShrink: 0 }} />
                <input
                    id="topbar-search"
                    style={s.searchInput}
                    placeholder="Search students, courses, assignments…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoComplete="off"
                />
                {searchQuery && (
                    <button
                        style={s.clearBtn}
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* ── Right: Notification bell + Profile ── */}
            <div style={s.right}>

                {/* ──── Notification Bell ──── */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        id="topbar-notifications"
                        style={s.iconBtn}
                        onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }}
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <Bell size={19} />
                        {unreadCount > 0 && (
                            <span style={s.badge}>{unreadCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div style={s.notifDropdown}>
                            {/* Header */}
                            <div style={s.dropdownHeader}>
                                <span style={s.dropdownTitle}>Notifications</span>
                                {unreadCount > 0 && (
                                    <button style={s.markAllBtn} onClick={markAllRead}>
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Items */}
                            <div style={s.notifList}>
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        style={{
                                            ...s.notifItem,
                                            background: n.read ? 'transparent' : '#eff6ff',
                                        }}
                                    >
                                        <span style={s.notifIcon}>{n.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={s.notifText}>{n.text}</p>
                                            <span style={s.notifTime}>{n.time}</span>
                                        </div>
                                        {!n.read && <span style={s.notifDot} />}
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={s.dropdownFooter}>
                                <span style={s.dropdownFooterText}>Showing {notifications.length} notifications</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ──── Profile Dropdown ──── */}
                <div ref={profileRef} style={{ position: 'relative' }}>
                    <button
                        id="topbar-profile"
                        style={s.profileBtn}
                        onClick={() => { setShowProfile(v => !v); setShowNotifications(false); }}
                        aria-label="User menu"
                    >
                        <div style={s.avatar}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div style={s.userInfo}>
                            <span style={s.userName}>{user?.name?.split(' ')[0] || 'User'}</span>
                            <span style={s.userRole}>{ROLE_LABELS[user?.role || ''] || ''}</span>
                        </div>
                        <ChevronDown
                            size={13}
                            style={{
                                color: '#9ca3af',
                                transform: showProfile ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s',
                            }}
                        />
                    </button>

                    {showProfile && (
                        <div style={s.profileDropdown}>
                            {/* User Info Header */}
                            <div style={s.profileHeader}>
                                <div style={s.profileAvatarLg}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p style={s.profileName}>{user?.name || 'User'}</p>
                                    <p style={s.profileEmail}>{user?.email || ''}</p>
                                </div>
                            </div>

                            <div style={s.menuDivider} />

                            {/* Menu Items */}
                            <Link
                                to={`/${user?.role}/profile`}
                                style={s.menuItem}
                                onClick={() => setShowProfile(false)}
                            >
                                <User size={15} style={{ color: '#6b7280' }} />
                                Profile
                            </Link>
                            <Link
                                to={`/${user?.role}/profile`}
                                style={s.menuItem}
                                onClick={() => setShowProfile(false)}
                            >
                                <Settings size={15} style={{ color: '#6b7280' }} />
                                Settings
                            </Link>

                            <div style={s.menuDivider} />

                            <button style={s.menuItemDanger} onClick={handleLogout}>
                                <LogOut size={15} />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
    bar: {
        height: 64,
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },

    /* Left */
    left: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '0 0 auto' },
    homeBtn: {
        width: 34, height: 34, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6b7280', border: '1px solid #e5e7eb', background: '#f9fafb',
        textDecoration: 'none', flexShrink: 0, transition: 'all 0.15s',
    },
    pageTitle: {
        fontWeight: 700, fontSize: 15, color: '#111827',
        letterSpacing: '-0.3px', whiteSpace: 'nowrap',
    },

    /* Search */
    searchWrap: {
        flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center', gap: 8,
        background: '#f3f4f6', borderRadius: 10, padding: '8px 14px',
        border: '1.5px solid transparent', transition: 'border-color 0.15s, background 0.15s',
    },
    searchInput: {
        flex: 1, background: 'none', border: 'none', outline: 'none',
        fontSize: 13.5, fontWeight: 500, color: '#111827',
        fontFamily: "'Inter', sans-serif",
    },
    clearBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 2,
    },

    /* Right */
    right: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flex: '0 0 auto' },
    iconBtn: {
        width: 38, height: 38, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f3f4f6', border: '1px solid #e5e7eb',
        cursor: 'pointer', color: '#374151',
        position: 'relative', transition: 'all 0.15s',
    },
    badge: {
        position: 'absolute', top: -4, right: -4,
        background: '#ef4444', color: '#fff',
        fontSize: 9, fontWeight: 800,
        width: 17, height: 17, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid #fff',
    },

    /* Profile button */
    profileBtn: {
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '5px 10px 5px 5px', cursor: 'pointer', transition: 'all 0.15s',
    },
    avatar: {
        width: 30, height: 30, borderRadius: 8,
        background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13, flexShrink: 0,
    },
    userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 },
    userName: { fontWeight: 700, fontSize: 12.5, color: '#111827' },
    userRole: { fontWeight: 500, fontSize: 11, color: '#9ca3af' },

    /* Notification dropdown */
    notifDropdown: {
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 356,
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
    },
    dropdownHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
    },
    dropdownTitle: { fontWeight: 700, fontSize: 14, color: '#111827' },
    markAllBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, color: '#2563eb', fontWeight: 600, padding: 0,
    },
    notifList: { maxHeight: 320, overflowY: 'auto' },
    notifItem: {
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid #f9fafb', transition: 'background 0.15s', cursor: 'default',
    },
    notifIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
    notifText: { margin: '0 0 3px', fontSize: 13, fontWeight: 500, color: '#1f2937', lineHeight: 1.45 },
    notifTime: { fontSize: 11, color: '#9ca3af', fontWeight: 600 },
    notifDot: {
        width: 7, height: 7, borderRadius: '50%', background: '#2563eb',
        marginTop: 5, flexShrink: 0,
    },
    dropdownFooter: {
        padding: '10px 16px', borderTop: '1px solid #f3f4f6', background: '#fafafa',
    },
    dropdownFooterText: { fontSize: 11, color: '#9ca3af', fontWeight: 600 },

    /* Profile dropdown */
    profileDropdown: {
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220,
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
    },
    profileHeader: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 14px 12px',
    },
    profileAvatarLg: {
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 16,
    },
    profileName: { margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#111827' },
    profileEmail: { margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 },
    menuDivider: { height: 1, background: '#f3f4f6' },
    menuItem: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none',
        transition: 'background 0.15s', cursor: 'pointer',
    },
    menuItemDanger: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%',
        fontSize: 13, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left',
    },
};

export default TopBar;
