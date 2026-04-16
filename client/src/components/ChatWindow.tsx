import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket, Message } from '@/contexts/SocketContext';
import { getConversation, sendMessage, markConversationRead } from '@/services/messageService';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
    recipientId: string;
    recipientName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName }) => {
    const { accessToken, user } = useAuth();
    const { socket, typingByUser, setUnreadMessagesByUser } = useSocket();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const typingTimer = useRef<number | null>(null);

    // Initial load history
    useEffect(() => {
        if (!accessToken || !recipientId) return;
        setIsLoading(true);
        getConversation(accessToken, recipientId)
            .then(res => setMessages(res.messages))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [accessToken, recipientId]);

    // Mark conversation read when opened (clears unread badges)
    useEffect(() => {
        if (!accessToken || !recipientId) return;
        markConversationRead(accessToken, recipientId)
            .then(() => {
                setUnreadMessagesByUser(prev => ({ ...prev, [recipientId]: 0 }));
            })
            .catch(() => {});
    }, [accessToken, recipientId, setUnreadMessagesByUser]);

    // Live Socket listener
    useEffect(() => {
        if (!socket) return;
        
        const handleNewMessage = (msg: Message) => {
            // Check if the incoming message belongs to this active conversation window
            const rId = typeof msg.recipient === 'string' ? msg.recipient : msg.recipient._id;
            const sId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;

            if (
                (sId === recipientId && rId === user?.id) || 
                (sId === user?.id && rId === recipientId)
            ) {
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.on('receiveMessage', handleNewMessage);
        
        return () => {
            socket.off('receiveMessage', handleNewMessage);
        };
    }, [socket, recipientId, user]);

    // Auto-scroll
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !accessToken) return;

        try {
            const res = await sendMessage(accessToken, recipientId, newMessage);
            // Append optimistically or use what the server returns. Our server returns populated message.
            setMessages(prev => [...prev, res.message]);
            setNewMessage('');
            socket?.emit('stopTyping', { toUserId: recipientId, fromUserId: user?.id });
        } catch (err: any) {
            alert(err.message || 'Failed to send message.');
        }
    };

    const handleTypingChange = (val: string) => {
        setNewMessage(val);
        if (!socket || !user?.id) return;

        socket.emit('typing', { toUserId: recipientId, fromUserId: user.id });

        if (typingTimer.current) window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => {
            socket.emit('stopTyping', { toUserId: recipientId, fromUserId: user.id });
        }, 700);
    };

    const isTyping = !!typingByUser?.[recipientId];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.avatar}>{recipientName.charAt(0)}</div>
                <div>
                    <h3 style={styles.name}>{recipientName}</h3>
                    <p style={styles.status}>{isTyping ? 'Typing…' : 'Online'}</p>
                </div>
            </div>

            <div style={styles.chatArea}>
                {isLoading ? (
                    <div style={styles.infoText}>Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div style={styles.infoText}>No messages yet. Send a greeting!</div>
                ) : (
                    messages.map(msg => <MessageBubble key={msg._id} message={msg} />)
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} style={styles.inputArea}>
                <input 
                    type="text" 
                    placeholder={`Message ${recipientName}...`} 
                    style={styles.input} 
                    value={newMessage}
                    onChange={e => handleTypingChange(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()} style={styles.sendBtn}>
                    Send
                </button>
            </form>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: { display: 'flex', flexDirection: 'column', height: '100%', background:'var(--card-bg)', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
    header: { padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: 'var(--page-bg)', display: 'flex', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color:'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, marginRight: 12 },
    name: { margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' },
    status: { margin: 0, fontSize: 12, color: '#10b981', fontWeight: 600 },
    
    chatArea: { flex: 1, padding: '20px', overflowY: 'auto', background: 'var(--page-bg)' },
    infoText: { textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic', marginTop: '2rem' },
    
    inputArea: { padding: '16px', background:'var(--card-bg)', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 12 },
    input: { flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid #d1d5db', fontSize: 15, outline: 'none', background: 'var(--border-color)' },
    sendBtn: { padding: '0 24px', borderRadius: 24, background: 'var(--primary)', color:'var(--card-bg)', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', opacity: 1 }
};

export default ChatWindow;
