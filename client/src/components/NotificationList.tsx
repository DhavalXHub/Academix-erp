import React from 'react';
import { Notification } from '../../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns'; // optional if installed, else fallback

interface NotificationListProps {
    notifications: Notification[];
    onMarkRead: (id: string) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onMarkRead }) => {
    if (notifications.length === 0) {
        return <div style={styles.empty}>No notifications right now.</div>;
    }

    const formatTime = (iso: string) => {
        try {
            const date = new Date(iso);
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch { return iso; }
    };

    return (
        <div style={styles.container}>
            {notifications.map(n => (
                <div key={n._id} style={n.isRead ? styles.itemRead : styles.itemUnread}>
                    <div style={styles.content}>
                        <div style={styles.header}>
                            <span style={styles.typeBadge(n.type)}>{n.type.replace('_', ' ')}</span>
                            <span style={styles.time}>{formatTime(n.createdAt)}</span>
                        </div>
                        <p style={styles.message}>{n.message}</p>
                        {n.linkAction && (
                            <a href={n.linkAction} style={styles.link}>View Details</a>
                        )}
                    </div>
                    {!n.isRead && (
                        <button onClick={() => onMarkRead(n._id)} style={styles.readBtn}>✓</button>
                    )}
                </div>
            ))}
        </div>
    );
};

const styles: Record<string, any> = {
    empty: { padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: 14, fontStyle: 'italic' },
    container: { display: 'flex', flexDirection: 'column', maxHeight: 400, overflowY: 'auto' },
    itemUnread: { display: 'flex', alignItems: 'flex-start', padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#eff6ff', transition: 'background 0.2s' },
    itemRead: { display: 'flex', alignItems: 'flex-start', padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#fff', opacity: 0.75 },
    content: { flex: 1 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    time: { fontSize: 11, color: '#9ca3af' },
    message: { margin: 0, fontSize: 14, color: '#1f2937', lineHeight: 1.4 },
    link: { display: 'inline-block', marginTop: 8, fontSize: 13, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 },
    readBtn: { marginLeft: 12, background: 'none', border: '1px solid #93c5fd', color: '#3b82f6', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
    typeBadge: (type: string) => {
        let bg = '#e0e7ff', col = '#4338ca';
        if (type.includes('quiz')) { bg = '#dcfce7'; col = '#15803d'; }
        if (type.includes('assignment')) { bg = '#fee2e2'; col = '#b91c1c'; }
        return { padding: '2px 8px', borderRadius: 99, background: bg, color: col, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' };
    }
};

export default NotificationList;
