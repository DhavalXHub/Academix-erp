import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotifications, markAsRead } from '@/services/notificationService';
import NotificationList from './NotificationList';

const NotificationBell: React.FC = () => {
    const { accessToken } = useAuth();
    const { notifications, unreadCount, setNotifications } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!accessToken) return;
        fetchNotifications(accessToken).then(res => {
            setNotifications(res.notifications);
        }).catch(console.error);
    }, [accessToken, setNotifications]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id: string) => {
        if (!accessToken) return;
        try {
            await markAsRead(accessToken, id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    };

    return (
        <div style={styles.container} ref={containerRef}>
            <button onClick={() => setIsOpen(!isOpen)} style={styles.bellBtn}>
                <span style={{ fontSize: 20 }}>🔔</span>
                {unreadCount > 0 && (
                    <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.header}>
                        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>Notifications</h3>
                    </div>
                    <NotificationList notifications={notifications} onMarkRead={handleMarkRead} />
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: { position: 'relative', display: 'inline-block' },
    bellBtn: { background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: 0, right: 0, background: '#ef4444', color:'var(--card-bg)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, border: '2px solid #fff' },
    dropdown: { position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 340, background:'var(--card-bg)', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', zIndex: 1000, overflow: 'hidden' },
    header: { padding: '16px', borderBottom: '1px solid #e5e7eb', background: 'var(--page-bg)' },
};

export default NotificationBell;
