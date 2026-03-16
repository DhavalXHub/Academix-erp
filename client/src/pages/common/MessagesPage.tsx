import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api'; // generic api fetch
import ChatWindow from '@/components/ChatWindow';
import { useSocket } from '@/contexts/SocketContext';

const MessagesPage: React.FC = () => {
    const { accessToken } = useAuth();
    const { unreadMessagesByUser } = useSocket();
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Fetch potential contacts (e.g. all users for demo, or filter by course roster. We will just fetch Users API for simplicity)
    useEffect(() => {
        if (!accessToken) return;
        // In a real app we might only fetch connected peers. For Academix, we fetch directory.
        api.get('/users?limit=50', accessToken)
            .then(res => setUsers((res.data || res.users || []).filter((u: any) => u.isActive)))
            .catch(console.error);
    }, [accessToken]);

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.page}>
            <div style={styles.layout}>
                
                {/* Sidebar (Contacts) */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarHeader}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Messages</h2>
                        <input 
                            type="text" 
                            placeholder="Search contacts..." 
                            style={styles.searchInput}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <div style={styles.contactsList}>
                        {filteredUsers.length === 0 ? (
                            <div style={styles.emptyContacts}>No users found.</div>
                        ) : (
                            filteredUsers.map(u => (
                                <div 
                                    key={u._id} 
                                    style={selectedUser?._id === u._id ? styles.contactActive : styles.contactCard}
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <div style={styles.avatar}>{u.name.charAt(0)}</div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={styles.contactName}>{u.name}</div>
                                        <div style={styles.contactRole}>{u.role}</div>
                                    </div>
                                    {!!unreadMessagesByUser?.[u._id] && (
                                        <div style={styles.badge}>{unreadMessagesByUser[u._id]}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div style={styles.mainArea}>
                    {selectedUser ? (
                        <ChatWindow recipientId={selectedUser._id} recipientName={selectedUser.name} />
                    ) : (
                        <div style={styles.noSelection}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                            <h3 style={{ margin: 0, fontSize: 20, color: '#374151' }}>Your Messages</h3>
                            <p style={{ color: '#6b7280', marginTop: 8 }}>Select a contact from the sidebar to start chatting securely.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    page: { padding: '2rem', height: 'calc(100vh - 64px)', boxSizing: 'border-box', margin: '0 auto', maxWidth: 1400, fontFamily: "'Inter', sans-serif" },
    layout: { display: 'flex', height: '100%', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
    
    sidebar: { width: 320, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#f8fafc' },
    sidebarHeader: { padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#fff' },
    searchInput: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#f3f4f6', marginTop: 16, boxSizing: 'border-box' },
    contactsList: { flex: 1, overflowY: 'auto' },
    emptyContacts: { padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 14 },
    
    contactCard: { display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
    contactActive: { display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: '#e0e7ff', borderBottom: '1px solid #c7d2fe' },
    avatar: { width: 44, height: 44, borderRadius: '50%', background: '#cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, marginRight: 16, flexShrink: 0 },
    contactName: { fontSize: 15, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    contactRole: { fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginTop: 4 },
    badge: { minWidth: 22, height: 22, padding: '0 6px', borderRadius: 999, background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    mainArea: { flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f5f9', padding: 16 },
    noSelection: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }
};

export default MessagesPage;
