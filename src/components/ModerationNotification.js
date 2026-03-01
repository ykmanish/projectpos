// components/ModerationNotification.js

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Ban, Bell, VolumeX, X } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

export default function ModerationNotification() {
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUserWarned = (data) => {
      const id = Date.now();
      setNotifications(prev => [...prev, {
        id,
        type: 'warning',
        message: data.message,
        severity: data.severity,
        warnings: data.warnings,
        timestamp: new Date().toISOString()
      }]);

      // Auto remove after 8 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 8000);
    };

    const handleUserMuted = (data) => {
      const id = Date.now();
      setNotifications(prev => [...prev, {
        id,
        type: 'mute',
        message: data.message,
        muteUntil: data.muteUntil,
        timestamp: new Date().toISOString()
      }]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 10000);
    };

    const handleUserBanned = (data) => {
      const id = Date.now();
      setNotifications(prev => [...prev, {
        id,
        type: 'ban',
        message: data.message,
        bannedUntil: data.bannedUntil,
        timestamp: new Date().toISOString()
      }]);

      // Ban notifications stay longer
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 15000);
    };

    socket.on('user-warned', handleUserWarned);
    socket.on('user-muted', handleUserMuted);
    socket.on('user-banned', handleUserBanned);

    return () => {
      socket.off('user-warned', handleUserWarned);
      socket.off('user-muted', handleUserMuted);
      socket.off('user-banned', handleUserBanned);
    };
  }, [socket]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            rounded-lg shadow-lg p-4 border-l-4 animate-slide-in
            ${notification.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' : ''}
            ${notification.type === 'mute' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' : ''}
            ${notification.type === 'ban' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : ''}
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              )}
              {notification.type === 'mute' && (
                <VolumeX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              )}
              {notification.type === 'ban' && (
                <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {notification.type === 'warning' && 'Krixa Warning'}
                  {notification.type === 'mute' && 'Krixa Mute'}
                  {notification.type === 'ban' && 'Krixa Ban'}
                </h4>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {notification.message}
              </p>
              {notification.warnings && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Warning {notification.warnings}/3
                </p>
              )}
              {notification.muteUntil && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Muted until: {new Date(notification.muteUntil).toLocaleString()}
                </p>
              )}
              {notification.bannedUntil && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Banned until: {new Date(notification.bannedUntil).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}