import React, { useState, useRef, useEffect, useCallback } from 'react';
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
   Mock Search Suggestions (dummy data)
───────────────────────────────────────────── */
interface SearchSuggestion {
    id: number;
    label: string;
    category: string;
    icon: string;
    path: string;
}
const ALL_SUGGESTIONS: SearchSuggestion[] = [
    { id: 1,  label: 'Dashboard',       category: 'Page',       icon: '🏠', path: 'dashboard' },
    { id: 2,  label: 'Courses',         category: 'Page',       icon: '📚', path: 'courses' },
    { id: 3,  label: 'Attendance',      category: 'Page',       icon: '📋', path: 'attendance' },
    { id: 4,  label: 'Assignments',     category: 'Page',       icon: '📝', path: 'assignments' },
    { id: 5,  label: 'Quizzes',         category: 'Page',       icon: '🧪', path: 'quizzes' },
    { id: 6,  label: 'Messages',        category: 'Page',       icon: '💬', path: 'messages' },
    { id: 7,  label: 'Profile',         category: 'Page',       icon: '👤', path: 'profile' },
    { id: 8,  label: 'CS101 – Intro to Computer Science', category: 'Course', icon: '💻', path: 'courses' },
    { id: 9,  label: 'MA201 – Calculus II',               category: 'Course', icon: '📐', path: 'courses' },
    { id: 10, label: 'PH101 – Physics Fundamentals',      category: 'Course', icon: '⚛️', path: 'courses' },
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
   Hover-aware style helpers
───────────────────────────────────────────── */
function useHover(): [boolean, { onMouseEnter: () => void; onMouseLeave: () => void }] {
    const [hovered, setHovered] = useState(false);
    return [
        hovered,
        {
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
        },
    ];
}

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
    const [searchFocused, setSearchFocused] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const notifRef  = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const searchRef  = useRef<HTMLDivElement>(null);

    /* ── Close dropdowns when clicking outside ── */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfile(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchFocused(false);
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

    const markOneRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    /* ── Search: filter suggestions ── */
    const filteredSuggestions = useCallback(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return ALL_SUGGESTIONS.filter(s =>
            s.label.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
        ).slice(0, 6);
    }, [searchQuery]);

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        const role = user?.role || 'student';
        navigate(`/${role}/${suggestion.path}`);
        setSearchQuery('');
        setSearchFocused(false);
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const title = pageTitle || getPageTitle(location.pathname);
    const showSearchResults = searchFocused && searchQuery.trim().length > 0;
    const results = filteredSuggestions();

    return (
        <header style={s.bar}>
            {/* ── Left: Home icon + Page title ── */}
            <div style={s.left}>
                <HomeBtn />
                <span style={s.pageTitle}>{title}</span>
            </div>

            {/* ── Center: Search bar ── */}
            <div
                ref={searchRef}
                style={{
                    ...s.searchWrap,
                    ...(searchFocused ? s.searchWrapFocused : {}),
                    position: 'relative',
                }}
            >
                <Search size={15} style={{ color: searchFocused ? '#2563eb' : '#9ca3af', flexShrink: 0, transition: 'color 0.15s' }} />
                <input
                    id="topbar-search"
                    style={s.searchInput}
                    placeholder="Search pages, courses, assignments…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    autoComplete="off"
                    aria-label="Search"
                />
                {searchQuery && (
                    <button
                        style={s.clearBtn}
                        onClick={() => { setSearchQuery(''); setSearchFocused(true); }}
                        title="Clear search"
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}

                {/* ── Search Results Dropdown ── */}
                {showSearchResults && (
                    <div style={s.searchDropdown}>
                        {results.length === 0 ? (
                            <div style={s.searchNoResult}>
                                <span style={{ fontSize: 22 }}>🔍</span>
                                <span>No results for "<strong>{searchQuery}</strong>"</span>
                            </div>
                        ) : (
                            <>
                                <div style={s.searchDropdownHeader}>Quick Results</div>
                                {results.map(item => (
                                    <SearchResultItem
                                        key={item.id}
                                        item={item}
                                        onClick={() => handleSuggestionClick(item)}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Right: Notification bell + Profile ── */}
            <div style={s.right}>

                {/* ──── Notification Bell ──── */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <NotifButton
                        unreadCount={unreadCount}
                        active={showNotifications}
                        onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }}
                    />

                    {showNotifications && (
                        <div style={s.notifDropdown}>
                            {/* Header */}
                            <div style={s.dropdownHeader}>
                                <span style={s.dropdownTitle}>
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span style={s.unreadPill}>{unreadCount} new</span>
                                    )}
                                </span>
                                {unreadCount > 0 && (
                                    <button style={s.markAllBtn} onClick={markAllRead}>
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Items */}
                            <div style={s.notifList}>
                                {notifications.map(n => (
                                    <NotifItem key={n.id} n={n} onRead={() => markOneRead(n.id)} />
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={s.dropdownFooter}>
                                <span style={s.dropdownFooterText}>
                                    {unreadCount === 0
                                        ? '🎉 You\'re all caught up!'
                                        : `${notifications.length} total notifications`}
                                </span>
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
                                <div style={{ minWidth: 0 }}>
                                    <p style={s.profileName}>{user?.name || 'User'}</p>
                                    <p style={s.profileEmail}>{user?.email || ''}</p>
                                    <span style={s.profileRoleBadge}>{ROLE_LABELS[user?.role || ''] || 'User'}</span>
                                </div>
                            </div>

                            <div style={s.menuDivider} />

                            {/* Menu Items */}
                            <ProfileMenuItem
                                to={`/${user?.role}/profile`}
                                icon={<User size={15} />}
                                label="Profile"
                                onClick={() => setShowProfile(false)}
                            />
                            <ProfileMenuItem
                                to={`/${user?.role}/profile`}
                                icon={<Settings size={15} />}
                                label="Settings"
                                onClick={() => setShowProfile(false)}
                            />

                            <div style={s.menuDivider} />

                            <LogoutMenuItem onClick={handleLogout} />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

/* ─────────────────────────────────────────────
   Sub-components (hover-aware)
───────────────────────────────────────────── */

/* Home button */
const HomeBtn: React.FC = () => {
    const [hovered, hoverProps] = useHover();
    return (
        <Link
            to="/"
            title="Back to Home"
            style={{
                ...s.homeBtn,
                ...(hovered ? s.homeBtnHover : {}),
            }}
            {...hoverProps}
        >
            <Home size={17} />
        </Link>
    );
};

/* Notification button */
interface NotifButtonProps {
    unreadCount: number;
    active: boolean;
    onClick: () => void;
}
const NotifButton: React.FC<NotifButtonProps> = ({ unreadCount, active, onClick }) => {
    const [hovered, hoverProps] = useHover();
    return (
        <button
            id="topbar-notifications"
            style={{
                ...s.iconBtn,
                ...(hovered || active ? s.iconBtnHover : {}),
            }}
            onClick={onClick}
            aria-label="Notifications"
            title="Notifications"
            {...hoverProps}
        >
            <Bell size={19} />
            {unreadCount > 0 && (
                <span style={s.badge}>{unreadCount}</span>
            )}
        </button>
    );
};

/* Notification item */
interface NotifItemProps {
    n: typeof INITIAL_NOTIFICATIONS[number];
    onRead: () => void;
}
const NotifItem: React.FC<NotifItemProps> = ({ n, onRead }) => {
    const [hovered, hoverProps] = useHover();
    return (
        <div
            style={{
                ...s.notifItem,
                background: hovered ? '#f5f3ff' : n.read ? 'transparent' : '#eff6ff',
            }}
            onClick={onRead}
            role="button"
            tabIndex={0}
            {...hoverProps}
        >
            <span style={s.notifIcon}>{n.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...s.notifText, fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                <span style={s.notifTime}>{n.time}</span>
            </div>
            {!n.read && <span style={s.notifDot} />}
        </div>
    );
};

/* Search result item */
interface SearchResultItemProps {
    item: SearchSuggestion;
    onClick: () => void;
}
const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, onClick }) => {
    const [hovered, hoverProps] = useHover();
    return (
        <div
            style={{ ...s.searchResultItem, ...(hovered ? s.searchResultItemHover : {}) }}
            onClick={onClick}
            role="button"
            tabIndex={0}
            {...hoverProps}
        >
            <span style={s.searchResultIcon}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <span style={s.searchResultLabel}>{item.label}</span>
            </div>
            <span style={s.searchResultCategory}>{item.category}</span>
        </div>
    );
};

/* Profile menu item */
interface ProfileMenuItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}
const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({ to, icon, label, onClick }) => {
    const [hovered, hoverProps] = useHover();
    return (
        <Link
            to={to}
            style={{
                ...s.menuItem,
                ...(hovered ? s.menuItemHover : {}),
            }}
            onClick={onClick}
            {...hoverProps}
        >
            <span style={{ color: hovered ? '#4f46e5' : '#6b7280', transition: 'color 0.15s' }}>{icon}</span>
            {label}
        </Link>
    );
};

/* Logout menu item */
const LogoutMenuItem: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const [hovered, hoverProps] = useHover();
    return (
        <button
            id="topbar-logout"
            style={{
                ...s.menuItemDanger,
                ...(hovered ? s.menuItemDangerHover : {}),
            }}
            onClick={onClick}
            {...hoverProps}
        >
            <LogOut size={15} />
            Sign out
        </button>
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
    homeBtnHover: {
        background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb',
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
    searchWrapFocused: {
        background: '#fff', borderColor: '#2563eb',
        boxShadow: '0 0 0 3px rgba(37,99,235,0.08)',
    },
    searchInput: {
        flex: 1, background: 'none', border: 'none', outline: 'none',
        fontSize: 13.5, fontWeight: 500, color: '#111827',
        fontFamily: "'Inter', sans-serif",
    },
    clearBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 2,
        borderRadius: 4, transition: 'color 0.1s',
    },

    /* Search dropdown */
    searchDropdown: {
        position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
        background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
        boxShadow: '0 16px 48px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden',
    },
    searchDropdownHeader: {
        padding: '10px 14px 6px',
        fontSize: 11, fontWeight: 700, color: '#9ca3af',
        letterSpacing: '0.06em', textTransform: 'uppercase',
    },
    searchResultItem: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        cursor: 'pointer', transition: 'background 0.12s',
    },
    searchResultItemHover: {
        background: '#f5f3ff',
    },
    searchResultIcon: { fontSize: 18, flexShrink: 0, width: 28, textAlign: 'center' },
    searchResultLabel: { fontSize: 13.5, fontWeight: 500, color: '#111827' },
    searchResultCategory: {
        fontSize: 11, fontWeight: 600, color: '#9ca3af',
        background: '#f3f4f6', borderRadius: 99, padding: '2px 8px', flexShrink: 0,
    },
    searchNoResult: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '24px 16px', color: '#6b7280', fontSize: 13.5, fontWeight: 500,
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
    iconBtnHover: {
        background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb',
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
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360,
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
    },
    dropdownHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
    },
    dropdownTitle: {
        fontWeight: 700, fontSize: 14, color: '#111827',
        display: 'flex', alignItems: 'center', gap: 8,
    },
    unreadPill: {
        background: '#eff6ff', color: '#2563eb',
        borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700,
    },
    markAllBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, color: '#2563eb', fontWeight: 600, padding: 0,
    },
    notifList: { maxHeight: 320, overflowY: 'auto' },
    notifItem: {
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.15s',
    },
    notifIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
    notifText: { margin: '0 0 3px', fontSize: 13, color: '#1f2937', lineHeight: 1.45 },
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
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 228,
        background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
    },
    profileHeader: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 14px 12px',
    },
    profileAvatarLg: {
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 17,
    },
    profileName: { margin: '0 0 1px', fontSize: 13, fontWeight: 700, color: '#111827' },
    profileEmail: {
        margin: '0 0 5px', fontSize: 11, color: '#9ca3af', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
    },
    profileRoleBadge: {
        background: '#eff6ff', color: '#2563eb', borderRadius: 99,
        padding: '1px 8px', fontSize: 10, fontWeight: 700,
    },
    menuDivider: { height: 1, background: '#f3f4f6' },
    menuItem: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none',
        transition: 'background 0.15s', cursor: 'pointer',
    },
    menuItemHover: {
        background: '#f5f3ff', color: '#4f46e5',
    },
    menuItemDanger: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%',
        fontSize: 13, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
    },
    menuItemDangerHover: {
        background: '#fef2f2',
    },
};

export default TopBar;
