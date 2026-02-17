// hooks/useSlowMode.js
import { useState, useRef, useCallback, useEffect } from 'react';

export function useSlowMode(initialSettings = { enabled: false, cooldown: 30 }, userId = null, isAdmin = false) {
  const [slowMode, setSlowMode] = useState(initialSettings);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const lastMessageTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Load last message time from localStorage on mount
  useEffect(() => {
    if (userId) {
      const savedTime = localStorage.getItem(`slowMode_lastMessage_${userId}`);
      if (savedTime) {
        lastMessageTimeRef.current = parseInt(savedTime);
        
        // Check if cooldown should still be active
        if (slowMode.enabled) {
          const now = Date.now();
          const timeSinceLastMessage = (now - lastMessageTimeRef.current) / 1000;
          
          if (timeSinceLastMessage < slowMode.cooldown) {
            setCooldownActive(true);
          } else {
            // Clear expired cooldown
            localStorage.removeItem(`slowMode_lastMessage_${userId}`);
            lastMessageTimeRef.current = null;
          }
        }
      }
    }
  }, [userId, slowMode.enabled, slowMode.cooldown]);

  // Check if user can send a message based on slow mode
  const canSendMessage = useCallback(() => {
    // Admins bypass slow mode completely
    if (isAdmin) return true;
    
    if (!slowMode.enabled) return true;
    
    if (!lastMessageTimeRef.current) return true;
    
    const now = Date.now();
    const timeSinceLastMessage = (now - lastMessageTimeRef.current) / 1000; // in seconds
    
    return timeSinceLastMessage >= slowMode.cooldown;
  }, [slowMode, isAdmin]);

  // Get time remaining until next message is allowed
  const getTimeRemaining = useCallback(() => {
    if (isAdmin) return 0;
    if (!slowMode.enabled || !lastMessageTimeRef.current) return 0;
    
    const now = Date.now();
    const timeSinceLastMessage = (now - lastMessageTimeRef.current) / 1000;
    const remaining = Math.max(0, slowMode.cooldown - timeSinceLastMessage);
    
    return Math.ceil(remaining);
  }, [slowMode, isAdmin]);

  // Register that a message was sent
  const registerMessageSent = useCallback(() => {
    if (slowMode.enabled && !isAdmin) {
      const now = Date.now();
      lastMessageTimeRef.current = now;
      localStorage.setItem(`slowMode_lastMessage_${userId}`, now.toString());
      setCooldownActive(true);
    }
  }, [slowMode.enabled, isAdmin, userId]);

  // Reset cooldown (useful when slow mode is disabled)
  const resetCooldown = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`slowMode_lastMessage_${userId}`);
    }
    lastMessageTimeRef.current = null;
    setCooldownActive(false);
    setTimeRemaining(0);
  }, [userId]);

  // Update settings
  const updateSlowMode = useCallback((settings) => {
    setSlowMode(settings);
    if (!settings.enabled) {
      resetCooldown();
    }
  }, [resetCooldown]);

  // Timer effect for cooldown countdown
  useEffect(() => {
    if (slowMode.enabled && lastMessageTimeRef.current && !isAdmin) {
      const updateTimer = () => {
        const remaining = getTimeRemaining();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setCooldownActive(false);
          if (userId) {
            localStorage.removeItem(`slowMode_lastMessage_${userId}`);
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      };

      // Update immediately
      updateTimer();

      // Set up interval if cooldown is active
      if (cooldownActive) {
        timerRef.current = setInterval(updateTimer, 1000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slowMode.enabled, cooldownActive, getTimeRemaining, isAdmin, userId]);

  return {
    slowMode,
    cooldownActive,
    timeRemaining,
    canSendMessage,
    registerMessageSent,
    updateSlowMode,
    resetCooldown
  };
}