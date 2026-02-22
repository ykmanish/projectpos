'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  useEffect(() => {
    // Wait for userId to be available (you can modify this based on your auth)
    // For now, we'll connect without userId and then emit user-online after connection
    console.log('🔌 Initializing socket connection');

    const socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
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
      
      // You can emit user-online here if you have userId from somewhere
      // For example, from localStorage or a context
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        socketIo.emit('user-online', { userId: storedUserId });
      }
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
      
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        socketIo.emit('user-online', { userId: storedUserId });
      }
    });

    // User status events
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

    // Message status events
    socketIo.on('undelivered-messages-status', (data) => {
      console.log('📦 Undelivered messages status:', data);
    });

    socketIo.on('message-delivered', (data) => {
      console.log('✓ Message delivered:', data);
    });

    socketIo.on('message-read', (data) => {
      console.log('✓✓ Message read:', data);
    });

    // Call events
    socketIo.on('incoming-call', (data) => {
      console.log('📞 Incoming call event:', data);
    });

    socketIo.on('call-answered', (data) => {
      console.log('📞 Call answered event:', data);
    });

    socketIo.on('call-rejected', (data) => {
      console.log('📞 Call rejected event:', data);
    });

    socketIo.on('call-ended', (data) => {
      console.log('📞 Call ended event:', data);
    });

    socketIo.on('call-ringing', (data) => {
      console.log('📞 Call ringing event:', data);
    });

    socketIo.on('call-failed', (data) => {
      console.log('📞 Call failed event:', data);
    });

    // Group events
    socketIo.on('member-joined', (data) => {
      console.log('👥 Member joined group:', data);
    });

    socketIo.on('member-joined-confirmed', (data) => {
      console.log('✅ Member join confirmed:', data);
    });

    socketIo.on('group-settings-updated', (data) => {
      console.log('⚙️ Group settings updated:', data);
    });

    socketIo.on('group-settings-updated-confirmed', (data) => {
      console.log('✅ Group settings update confirmed:', data);
    });

    // Bill events
    socketIo.on('bill-created', (data) => {
      console.log('💰 Bill created:', data);
    });

    socketIo.on('bill-updated', (data) => {
      console.log('💰 Bill updated:', data);
    });

    socketIo.on('bill-message-updated', (data) => {
      console.log('💰 Bill message updated:', data);
    });

    socketIo.on('bill-cancelled', (data) => {
      console.log('🚫 Bill cancelled:', data);
    });

    socketIo.on('bill-direct-update', (data) => {
      console.log('💰 Direct bill update:', data);
    });

    setSocket(socketIo);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketIo.removeAllListeners();
      socketIo.disconnect();
      setSocket(null);
    };
  }, []);

  const getUserOnlineStatus = useCallback((targetUserId) => {
    return onlineUsers.get(targetUserId) || { online: false, lastSeen: null };
  }, [onlineUsers]);

  const checkUndeliveredMessages = useCallback((roomId, targetUserId, isGroupMessage = false) => {
    if (socket && isConnected) {
      socket.emit('get-undelivered-status', { 
        roomId, 
        userId: targetUserId,
        isGroupMessage 
      });
    }
  }, [socket, isConnected]);

  const emitUserOnline = useCallback((userId) => {
    if (socket && isConnected && userId) {
      localStorage.setItem('userId', userId);
      socket.emit('user-online', { userId });
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected,
      onlineUsers,
      getUserOnlineStatus,
      checkUndeliveredMessages,
      emitUserOnline
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