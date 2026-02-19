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
        if (slowMode.enabled && !isAdmin) {
          const now = Date.now();
          const timeSinceLastMessage = (now - lastMessageTimeRef.current) / 1000;
          
          if (timeSinceLastMessage < slowMode.cooldown) {
            setCooldownActive(true);
          } else {
            // Clear expired cooldown
            localStorage.removeItem(`slowMode_lastMessage_${userId}`);
            lastMessageTimeRef.current = null;
          }
        } else {
          // If slow mode is disabled or user is admin, clear the cooldown
          localStorage.removeItem(`slowMode_lastMessage_${userId}`);
          lastMessageTimeRef.current = null;
        }
      }
    }
  }, [userId, slowMode.enabled, slowMode.cooldown, isAdmin]);

  // Check if user can send a message based on slow mode
  const canSendMessage = useCallback(() => {
    // Admins bypass slow mode completely
    if (isAdmin) return true;
    
    // If slow mode is disabled, always allow
    if (!slowMode.enabled) return true;
    
    // If no message has been sent yet, allow
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
      setTimeRemaining(slowMode.cooldown);
    }
  }, [slowMode.enabled, slowMode.cooldown, isAdmin, userId]);

  // Reset cooldown (useful when slow mode is disabled or settings change)
  const resetCooldown = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`slowMode_lastMessage_${userId}`);
    }
    lastMessageTimeRef.current = null;
    setCooldownActive(false);
    setTimeRemaining(0);
    
    // Clear any running timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [userId]);

  // Update settings - this will be called when slow mode changes via socket
  const updateSlowMode = useCallback((settings) => {
    console.log('🔄 Updating slow mode settings:', settings);
    setSlowMode(settings);
    
    // If slow mode is disabled, reset cooldown
    if (!settings.enabled) {
      resetCooldown();
    } else {
      // If slow mode is enabled, check if we need to recalculate cooldown
      if (lastMessageTimeRef.current) {
        const now = Date.now();
        const timeSinceLastMessage = (now - lastMessageTimeRef.current) / 1000;
        
        if (timeSinceLastMessage >= settings.cooldown) {
          // Cooldown has expired with new settings
          resetCooldown();
        } else {
          // Cooldown is still active, update remaining time
          setCooldownActive(true);
          setTimeRemaining(Math.ceil(settings.cooldown - timeSinceLastMessage));
        }
      }
    }
  }, [resetCooldown]);

  // Timer effect for cooldown countdown
  useEffect(() => {
    // Clear any existing timer when dependencies change
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only run timer if conditions are met
    if (slowMode.enabled && lastMessageTimeRef.current && !isAdmin) {
      const updateTimer = () => {
        const remaining = getTimeRemaining();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setCooldownActive(false);
          if (userId) {
            localStorage.removeItem(`slowMode_lastMessage_${userId}`);
          }
          lastMessageTimeRef.current = null;
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      };

      // Update immediately
      updateTimer();

      // Set up interval if cooldown is active
      if (cooldownActive && getTimeRemaining() > 0) {
        timerRef.current = setInterval(updateTimer, 1000);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slowMode.enabled, cooldownActive, getTimeRemaining, isAdmin, userId, slowMode.cooldown]);

  // Effect to handle slow mode being disabled remotely
  useEffect(() => {
    if (!slowMode.enabled) {
      resetCooldown();
    }
  }, [slowMode.enabled, resetCooldown]);

  // Effect to handle cooldown state changes
  useEffect(() => {
    if (cooldownActive) {
      setTimeRemaining(getTimeRemaining());
    }
  }, [cooldownActive, getTimeRemaining]);

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