// context/SocketContext.js

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useUser } from './UserContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const { userId } = useUser();

  useEffect(() => {
    if (!userId) {
      console.log('❌ No userId, not connecting socket');
      return;
    }

    console.log('🔌 Initializing socket connection for user:', userId);

    const socketIo = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketIo.on('connect', () => {
      console.log('✅ Socket connected successfully with ID:', socketIo.id);
      setIsConnected(true);
      socketIo.emit('user-online', { userId });
    });

    socketIo.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketIo.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

    socketIo.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      socketIo.emit('user-online', { userId });
    });

    // Listen for user coming online
    socketIo.on('user-came-online', (data) => {
      console.log('👤 User came online:', data);
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          online: true,
          lastSeen: data.timestamp
        });
        return newMap;
      });
    });

    socketIo.on('user-status-change', (data) => {
      console.log('🔄 User status changed:', data);
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          online: data.online,
          lastSeen: data.lastSeen
        });
        return newMap;
      });
    });

    socketIo.on('user-online', (data) => {
      console.log('👤 User online status:', data);
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          online: data.online,
          lastSeen: data.lastSeen
        });
        return newMap;
      });
    });

    socketIo.on('undelivered-messages-status', (data) => {
      console.log('📦 Undelivered messages status:', data);
    });

    setSocket(socketIo);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketIo.removeAllListeners();
      socketIo.disconnect();
      setSocket(null);
    };
  }, [userId]);

  const getUserOnlineStatus = useCallback((targetUserId) => {
    return onlineUsers.get(targetUserId) || { online: false, lastSeen: null };
  }, [onlineUsers]);

  const checkUndeliveredMessages = useCallback((roomId, targetUserId) => {
    if (socket && isConnected) {
      socket.emit('get-undelivered-status', { roomId, userId: targetUserId });
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected,
      onlineUsers,
      getUserOnlineStatus,
      checkUndeliveredMessages
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}