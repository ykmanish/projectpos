// utils/soundUtils.js

// Check if the browser tab is visible
export const isTabVisible = () => {
  return document.visibilityState === 'visible';
};

// Track last notification times for throttling
const lastNotificationTime = {
  'new-message': 0,
  'friend-request': 0,
  'group-join': 0
};

// Track notification counts per chat when user is away
const awayNotifications = new Map(); // chatId -> { count, lastNotificationTime, notificationIds }
const MAX_AWAY_NOTIFICATIONS = 3; // Maximum notifications to show when user is away
const NOTIFICATION_COOLDOWN = 5000; // 5 seconds cooldown between notifications
const SOUND_COOLDOWN = 2000; // 2 seconds cooldown between sounds

// Play notification sound with user interaction check
export const playNotificationSound = async (soundType = 'new-message') => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    // Throttle sounds - don't play too many sounds too quickly
    const now = Date.now();
    if (now - lastNotificationTime[soundType] < SOUND_COOLDOWN) {
      return;
    }
    
    // Different sound paths based on type
    const soundPaths = {
      'new-message': '/newmsg.mp3',
      'message-sent': '/sounds/message-sent.mp3',
      'friend-request': '/sounds/friend-request.mp3',
      'group-join': '/sounds/group-join.mp3'
    };
    
    const soundPath = soundPaths[soundType] || soundPaths['new-message'];
    
    // Create audio element
    const audio = new Audio(soundPath);
    
    // Set volume (0.0 to 1.0)
    audio.volume = 0.5; // Slightly lower volume for background
    
    // Play the sound
    await audio.play();
    
    // Update last notification time
    lastNotificationTime[soundType] = now;
    
    console.log(`🔊 Played ${soundType} sound`);
  } catch (error) {
    // Handle autoplay restrictions gracefully
    if (error.name === 'NotAllowedError') {
      console.log('🔇 Autoplay prevented - waiting for user interaction');
      
      // Store that we have pending sounds
      if (typeof window !== 'undefined') {
        window.pendingSounds = window.pendingSounds || [];
        window.pendingSounds.push(soundType);
      }
    } else {
      console.error('Error playing notification sound:', error);
    }
  }
};

// Smart notification function that limits notifications when user is away
export const shouldShowNotification = (chatId, type = 'message') => {
  const now = Date.now();
  
  // If tab is visible, don't show browser notifications
  if (isTabVisible()) {
    return false;
  }
  
  // Get or create away notification tracking for this chat
  if (!awayNotifications.has(chatId)) {
    awayNotifications.set(chatId, {
      count: 0,
      lastNotificationTime: 0,
      notificationIds: [],
      lastMessageTime: now
    });
  }
  
  const chatData = awayNotifications.get(chatId);
  
  // Update last message time
  chatData.lastMessageTime = now;
  
  // Check if we're still in cooldown period for this chat
  if (now - chatData.lastNotificationTime < NOTIFICATION_COOLDOWN) {
    console.log(`⏱️ Notification cooldown for chat ${chatId}`);
    return false;
  }
  
  // If we haven't reached max notifications for away period
  if (chatData.count < MAX_AWAY_NOTIFICATIONS) {
    chatData.count++;
    chatData.lastNotificationTime = now;
    return true;
  }
  
  // We've already sent max notifications while user was away
  console.log(`📊 Already sent ${MAX_AWAY_NOTIFICATIONS} notifications for chat ${chatId} while user away`);
  return false;
};

// Reset away notifications when user comes back to the tab or opens the chat
export const resetAwayNotifications = (chatId) => {
  if (chatId && awayNotifications.has(chatId)) {
    console.log(`🔄 Resetting away notifications for chat ${chatId}`);
    awayNotifications.delete(chatId);
  } else if (!chatId) {
    // Reset all away notifications (when user returns to tab)
    console.log(`🔄 Resetting all away notifications (${awayNotifications.size} chats)`);
    awayNotifications.clear();
  }
};

// Get away notification count for a specific chat
export const getAwayNotificationCount = (chatId) => {
  if (!awayNotifications.has(chatId)) return 0;
  return awayNotifications.get(chatId).count;
};

// Show browser notification with smart limiting
export const showSmartBrowserNotification = (chatId, title, options = {}) => {
  if (typeof window === 'undefined') return false;
  
  if (!('Notification' in window)) return false;
  
  if (Notification.permission !== 'granted') return false;
  
  // Check if we should show this notification based on our smart rules
  if (!shouldShowNotification(chatId, options.type || 'message')) {
    return false;
  }
  
  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      silent: true, // We'll play our own sound
      tag: chatId, // Use chatId as tag to group notifications
      renotify: true, // Allow new notifications even with same tag
      ...options
    });
    
    // Store notification ID for potential cleanup
    const chatData = awayNotifications.get(chatId);
    if (chatData) {
      // Store notification instance for potential future actions
      setTimeout(() => {
        notification.close();
      }, 5000); // Auto close after 5 seconds
    }
    
    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Reset away notifications for this chat when clicked
      resetAwayNotifications(chatId);
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return false;
  
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Play pending sounds after user interaction
export const setupPendingSounds = () => {
  if (typeof window === 'undefined') return;
  
  const playPendingSounds = async () => {
    if (window.pendingSounds && window.pendingSounds.length > 0) {
      for (const soundType of window.pendingSounds) {
        await playNotificationSound(soundType);
      }
      window.pendingSounds = [];
    }
  };
  
  // Play pending sounds on user interaction
  document.addEventListener('click', playPendingSounds, { once: true });
  document.addEventListener('keydown', playPendingSounds, { once: true });
};

// Set up visibility change listener to reset away notifications when user returns
export const setupVisibilityListener = (onUserReturn) => {
  if (typeof window === 'undefined') return;
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('👤 User returned to tab - resetting away notifications');
      resetAwayNotifications(); // Reset all away notifications
      if (onUserReturn) onUserReturn();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Show summary notification when user returns
export const showReturnSummaryNotification = (totalUnread, chatCount) => {
  if (typeof window === 'undefined') return;
  
  if (!('Notification' in window)) return;
  
  if (Notification.permission !== 'granted') return;
  
  try {
    new Notification(`You have ${totalUnread} unread messages`, {
      body: `From ${chatCount} chats • Click to view`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      silent: true,
      tag: 'return-summary'
    });
  } catch (error) {
    console.error('Error showing summary notification:', error);
  }
};