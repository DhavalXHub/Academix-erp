import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
}

const SocketContext = createContext<SocketContextData>({
    socket: null,
    notifications: [],
    unreadCount: 0,
    setNotifications: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

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

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <SocketContext.Provider value={{ socket, notifications, unreadCount, setNotifications }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
