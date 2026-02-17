'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useUser } from './UserContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { userId } = useUser();

  useEffect(() => {
    if (!userId) {
      console.log('❌ No userId, not connecting socket');
      return;
    }

    console.log('🔌 Initializing socket connection for user:', userId);

    // Create socket instance
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
      
      // Register user as online
      console.log('👤 Registering user as online:', userId);
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
      // Re-register as online after reconnect
      console.log('👤 Re-registering user as online:', userId);
      socketIo.emit('user-online', { userId });
    });

    socketIo.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    socketIo.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error.message);
    });

    socketIo.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
    });

    // Global listener for debugging (remove in production)
    // socketIo.onAny((eventName, ...args) => {
    //   console.log('📡 Socket event received:', eventName, args);
    // });

    // Set socket to state
    setSocket(socketIo);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      socketIo.removeAllListeners();
      socketIo.disconnect();
      setSocket(null);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
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