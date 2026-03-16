import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getUnreadCounts } from '@/services/messageService';

export interface Notification {
    _id: string;
    type: string;
    message: string;
    linkAction: string;
    isRead: boolean;
    createdAt: string;
}

export interface Message {
    _id: string;
    sender: any;
    recipient: any;
    content: string;
    readAt: string | null;
    createdAt: string;
}

interface SocketContextData {
    socket: Socket | null;
    notifications: Notification[];
    unreadCount: number;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    unreadMessagesByUser: Record<string, number>;
    typingByUser: Record<string, boolean>;
    setUnreadMessagesByUser: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const SocketContext = createContext<SocketContextData>({
    socket: null,
    notifications: [],
    unreadCount: 0,
    setNotifications: () => {},
    unreadMessagesByUser: {},
    typingByUser: {},
    setUnreadMessagesByUser: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, accessToken } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadMessagesByUser, setUnreadMessagesByUser] = useState<Record<string, number>>({});
    const [typingByUser, setTypingByUser] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Initialize connection
        const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
             console.log('Connected to socket server');
             // Join personal room
             newSocket.emit('connectUser', user.id);
        });

        newSocket.on('newNotification', (notif: Notification) => {
            setNotifications(prev => [notif, ...prev]);
        });

        newSocket.on('receiveMessage', (msg: Message) => {
            const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
            const recipientId = typeof msg.recipient === 'string' ? msg.recipient : msg.recipient?._id;
            // Only count if it's for me
            if (recipientId && user?.id && recipientId === user.id && senderId) {
                setUnreadMessagesByUser(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1,
                }));
            }
        });

        newSocket.on('typing', ({ fromUserId }: { fromUserId: string }) => {
            if (!fromUserId) return;
            setTypingByUser(prev => ({ ...prev, [fromUserId]: true }));
        });
        newSocket.on('stopTyping', ({ fromUserId }: { fromUserId: string }) => {
            if (!fromUserId) return;
            setTypingByUser(prev => ({ ...prev, [fromUserId]: false }));
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    // Initial unread counts snapshot (from DB)
    useEffect(() => {
        if (!accessToken || !user) return;
        getUnreadCounts(accessToken)
            .then(res => setUnreadMessagesByUser(res.counts || {}))
            .catch(() => {});
    }, [accessToken, user?.id]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <SocketContext.Provider value={{
            socket,
            notifications,
            unreadCount,
            setNotifications,
            unreadMessagesByUser,
            typingByUser,
            setUnreadMessagesByUser,
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
