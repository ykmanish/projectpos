// context/FriendsLockContext.js

'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from './UserContext';

const FriendsLockContext = createContext(undefined);

export function FriendsLockProvider({ children }) {
  const { userId } = useUser();
  const [isLocked, setIsLocked] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [lockTimeout, setLockTimeout] = useState(5);
  const [showLockModal, setShowLockModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const activityTimerRef = useRef(null);

  // Load lock settings from localStorage
  useEffect(() => {
    if (userId) {
      loadLockSettings();
    }
  }, [userId]);

  const loadLockSettings = () => {
    try {
      const savedSettings = localStorage.getItem(`friends_lock_${userId}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setPasscode(settings.passcode || '');
        setLockEnabled(settings.enabled || false);
        setLockTimeout(settings.timeout || 5);
        
        // Check if should be locked
        const lastActivityTime = localStorage.getItem(`friends_last_activity_${userId}`);
        if (lastActivityTime && settings.enabled) {
          const inactiveTime = (Date.now() - parseInt(lastActivityTime)) / 1000 / 60;
          if (inactiveTime >= settings.timeout) {
            setIsLocked(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading lock settings:', error);
    } finally {
      setInitialized(true);
    }
  };

  // Update last activity
  const updateActivity = useCallback(() => {
    if (!lockEnabled || !userId) return;
    
    localStorage.setItem(`friends_last_activity_${userId}`, Date.now().toString());
    
    // Reset timer
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    
    if (lockEnabled && lockTimeout > 0) {
      activityTimerRef.current = setTimeout(() => {
        const lastActivityTime = localStorage.getItem(`friends_last_activity_${userId}`);
        if (lastActivityTime) {
          const inactiveTime = (Date.now() - parseInt(lastActivityTime)) / 1000 / 60;
          if (inactiveTime >= lockTimeout) {
            setIsLocked(true);
          }
        }
      }, lockTimeout * 60 * 1000);
    }
  }, [lockEnabled, lockTimeout, userId]);

  // Auto-lock check interval
  useEffect(() => {
    if (!lockEnabled || !userId) return;

    const checkLock = () => {
      const lastActivityTime = localStorage.getItem(`friends_last_activity_${userId}`);
      if (lastActivityTime) {
        const inactiveTime = (Date.now() - parseInt(lastActivityTime)) / 1000 / 60;
        if (inactiveTime >= lockTimeout) {
          setIsLocked(true);
        }
      }
    };

    const interval = setInterval(checkLock, 30000);
    return () => clearInterval(interval);
  }, [lockEnabled, lockTimeout, userId]);

  // Set up activity listeners
  useEffect(() => {
    if (!lockEnabled) return;

    const handleActivity = () => {
      updateActivity();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [lockEnabled, updateActivity]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, []);

  const enableLock = (newPasscode, newTimeout) => {
    if (!userId) return;
    
    const settings = {
      enabled: true,
      passcode: newPasscode,
      timeout: parseInt(newTimeout)
    };
    
    localStorage.setItem(`friends_lock_${userId}`, JSON.stringify(settings));
    localStorage.setItem(`friends_last_activity_${userId}`, Date.now().toString());
    
    setPasscode(newPasscode);
    setLockEnabled(true);
    setLockTimeout(parseInt(newTimeout));
    setIsLocked(false);
    setShowLockModal(false);
  };

  const disableLock = () => {
    if (!userId) return;
    
    localStorage.removeItem(`friends_lock_${userId}`);
    localStorage.removeItem(`friends_last_activity_${userId}`);
    setLockEnabled(false);
    setPasscode('');
    setIsLocked(false);
  };

  const unlock = (enteredPasscode) => {
    if (enteredPasscode === passcode) {
      setIsLocked(false);
      if (userId) {
        localStorage.setItem(`friends_last_activity_${userId}`, Date.now().toString());
      }
      updateActivity();
      return true;
    }
    return false;
  };

  const lockNow = () => {
    setIsLocked(true);
  };

  const value = {
    isLocked,
    lockEnabled,
    showLockModal,
    setShowLockModal,
    enableLock,
    disableLock,
    unlock,
    lockNow,
    lockTimeout,
    initialized
  };

  return (
    <FriendsLockContext.Provider value={value}>
      {children}
    </FriendsLockContext.Provider>
  );
}

export function useFriendsLock() {
  const context = useContext(FriendsLockContext);
  if (context === undefined) {
    throw new Error('useFriendsLock must be used within FriendsLockProvider');
  }
  return context;
}