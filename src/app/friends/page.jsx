// app/friends/page.js

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useSocket } from "@/context/SocketContext";
import { useFriendsLock } from "@/context/FriendsLockContext";
import {
  Calendar,
  Search,
  UserPlus,
  Merge,
  Bell,
  MessageCircle,
  CirclePlus,
  Lock,
  Ban,
  Volume2,
  VolumeX
} from "lucide-react";
import { BeanHead } from 'beanheads';

import Avatar from "@/components/Avatar";
import ChatInterface from "@/components/ChatInterface";
import GroupChatInterface from "@/components/GroupChatInterface";
import FriendRequestsModal from "@/components/FriendRequestsModal";
import UserInfoModal from "@/components/UserInfoModal";
import CreateGroupModal from "@/components/CreateGroupModal";
import JoinGroupModal from "@/components/JoinGroupModal";
import BlockedUsersModal from "@/components/BlockedUsersModal";
import ContactsModal from "@/components/ContactsModal";
import SettingsDropdown from "@/components/SettingsDropdown";
import FriendsLockOverlay from "@/components/FriendsLockOverlay";

// Import sound utilities
import { 
  isTabVisible, 
  playNotificationSound, 
  setupPendingSounds,
  requestNotificationPermission,
  showSmartBrowserNotification,
  setupVisibilityListener,
  resetAwayNotifications,
  showReturnSummaryNotification
} from "@/utils/soundUtils";

export default function FriendsPage() {
  const router = useRouter();
  const { userId, userName, avatar } = useUser();
  const { socket, isConnected } = useSocket();
  const { 
    isLocked, 
    lockEnabled, 
    lockTimeout
  } = useFriendsLock();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [mobileView, setMobileView] = useState('list');

  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupLastMessages, setGroupLastMessages] = useState({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  
  // Store decrypted message previews
  const [decryptedPreviews, setDecryptedPreviews] = useState({});
  const [decryptingQueue, setDecryptingQueue] = useState(new Set());

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const lastPlayedSoundRef = useRef({});
  
  // Track if user was away to show summary
  const wasAwayRef = useRef(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Initialize sound settings and request notification permission
  useEffect(() => {
    // Load sound preference from localStorage
    const savedSoundSetting = localStorage.getItem('soundEnabled');
    if (savedSoundSetting !== null) {
      setSoundEnabled(savedSoundSetting === 'true');
    }
    
    // Request notification permission
    requestNotificationPermission().then(granted => {
      setNotificationPermission(granted);
    });
    
    // Setup pending sounds handler
    setupPendingSounds();
  }, []);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('soundEnabled', soundEnabled);
  }, [soundEnabled]);

  // Setup visibility listener to detect when user returns
  useEffect(() => {
    const handleUserReturn = () => {
      // Calculate total unread messages
      const totalUnreadDMs = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
      const totalUnreadGroups = Object.values(groupUnreadCounts).reduce((a, b) => a + b, 0);
      const totalUnread = totalUnreadDMs + totalUnreadGroups;
      
      // Count chats with unread messages
      const chatsWithUnread = Object.keys(unreadCounts).filter(key => unreadCounts[key] > 0).length;
      const groupsWithUnread = Object.keys(groupUnreadCounts).filter(key => groupUnreadCounts[key] > 0).length;
      const totalChatsWithUnread = chatsWithUnread + groupsWithUnread;
      
      // Show summary notification if user was away and there are unread messages
      if (wasAwayRef.current && totalUnread > 0 && notificationPermission) {
        showReturnSummaryNotification(totalUnread, totalChatsWithUnread);
      }
      
      wasAwayRef.current = false;
    };
    
    // Track when user leaves tab
    const handleVisibilityChange = () => {
      if (!isTabVisible()) {
        wasAwayRef.current = true;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const cleanupVisibilityListener = setupVisibilityListener(handleUserReturn);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (cleanupVisibilityListener) cleanupVisibilityListener();
    };
  }, [unreadCounts, groupUnreadCounts, notificationPermission]);

  useEffect(() => {
    if (userId) {
      fetchChats();
      fetchGroups();
      fetchFriendRequests();
      fetchLastMessages();
      fetchGroupLastMessages();
      fetchBlockedUsers();
    }
  }, [userId]);

  // Function to play sound with debouncing
  const playSoundWithDebounce = useCallback((soundType, identifier = 'default', debounceTime = 2000) => {
    if (!soundEnabled) return;
    
    const now = Date.now();
    const lastPlayed = lastPlayedSoundRef.current[identifier] || 0;
    
    if (now - lastPlayed > debounceTime) {
      playNotificationSound(soundType);
      lastPlayedSoundRef.current[identifier] = now;
    }
  }, [soundEnabled]);

  // Function to safely remove mention formatting
  const removeMentionFormatting = (text) => {
    if (text === null || text === undefined) {
      return '';
    }
    
    if (typeof text === 'object') {
      try {
        text = JSON.stringify(text);
      } catch (e) {
        console.error('Failed to stringify object for mention formatting:', e);
        return '[Complex message]';
      }
    }
    
    const textStr = String(text);
    return textStr.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
  };

  // Function to decrypt message preview
  const decryptMessagePreview = async (message, key) => {
    if (!message) return;
    
    if (message.senderId === userId) {
      if (message.content && message.content.trim().length > 0) {
        const cleanText = removeMentionFormatting(message.content);
        setDecryptedPreviews(prev => ({
          ...prev,
          [key]: cleanText
        }));
        return;
      }
    }
    
    if (message.content && message.content.trim().length > 0) {
      const cleanText = removeMentionFormatting(message.content);
      setDecryptedPreviews(prev => ({
        ...prev,
        [key]: cleanText
      }));
      return;
    }
    
    if (!message.encryptedContent) {
      return;
    }
    
    if (decryptedPreviews[key] && decryptedPreviews[key] !== 'New message' && decryptedPreviews[key] !== '') {
      return;
    }
    
    if (decryptingQueue.has(key)) {
      return;
    }
    
    setDecryptingQueue(prev => new Set(prev).add(key));
    
    try {
      let encryptedData = message.encryptedContent;
      if (typeof encryptedData === 'string') {
        try {
          encryptedData = JSON.parse(encryptedData);
        } catch {
          encryptedData = { encrypted: encryptedData, iv: '' };
        }
      }

      const response = await fetch('/api/chat/decrypt-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedContent: encryptedData,
          senderId: message.senderId,
          receiverId: userId,
          isGroupMessage: message.isGroupMessage || false,
          groupId: message.isGroupMessage ? message.roomId : null
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.decrypted) {
        const cleanText = removeMentionFormatting(data.decrypted);
        setDecryptedPreviews(prev => ({
          ...prev,
          [key]: cleanText
        }));
      } else {
        if (message.content && message.content.trim().length > 0) {
          const cleanText = removeMentionFormatting(message.content);
          setDecryptedPreviews(prev => ({
            ...prev,
            [key]: cleanText
          }));
        } 
        else if (message.attachments && message.attachments.length > 0) {
          const attachment = message.attachments[0];
          if (attachment.type === 'image') {
            setDecryptedPreviews(prev => ({
              ...prev,
              [key]: '📷 Photo'
            }));
          } else if (attachment.type === 'video') {
            setDecryptedPreviews(prev => ({
              ...prev,
              [key]: '🎥 Video'
            }));
          } else {
            setDecryptedPreviews(prev => ({
              ...prev,
              [key]: '📎 Attachment'
            }));
          }
        } 
        else {
          setDecryptedPreviews(prev => ({
            ...prev,
            [key]: ''
          }));
        }
      }
    } catch (error) {
      console.error('Failed to decrypt preview:', error);
      setDecryptedPreviews(prev => ({
        ...prev,
        [key]: ''
      }));
    } finally {
      setDecryptingQueue(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // Get message preview with mention handling
  const getMessagePreview = (message, key) => {
    if (!message) return 'No messages yet';
    
    if (message.deleted) {
      return 'This message was deleted';
    }
    
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      if (attachment.type === 'image') {
        return '📷 Photo';
      } else if (attachment.type === 'video') {
        return '🎥 Video';
      } else {
        return '📎 Attachment';
      }
    }
    
    if (message.senderId === userId) {
      if (message.content && message.content.trim().length > 0) {
        const cleanText = removeMentionFormatting(message.content);
        return truncateMessage(cleanText);
      }
    }
    
    if (decryptedPreviews[key] && decryptedPreviews[key].trim().length > 0) {
      return truncateMessage(decryptedPreviews[key]);
    }
    
    if (message.content && message.content.trim().length > 0) {
      const cleanText = removeMentionFormatting(message.content);
      return truncateMessage(cleanText);
    }
    
    if (decryptingQueue.has(key)) {
      return 'Decrypting...';
    }
    
    if (message.encryptedContent) {
      return 'New message';
    }
    
    return 'No messages yet';
  };

  // Decrypt all last messages when they're loaded
  useEffect(() => {
    if (!lastMessages || Object.keys(lastMessages).length === 0) return;
    
    const decryptMessages = async () => {
      for (const [roomId, message] of Object.entries(lastMessages)) {
        if (message) {
          if (message.senderId === userId && message.content) {
            const cleanText = removeMentionFormatting(message.content);
            setDecryptedPreviews(prev => ({
              ...prev,
              [roomId]: cleanText
            }));
          }
          else if (message.encryptedContent && !decryptedPreviews[roomId]) {
            await decryptMessagePreview(message, roomId);
          }
          else if (message.content && message.content.trim().length > 0) {
            const cleanText = removeMentionFormatting(message.content);
            setDecryptedPreviews(prev => ({
              ...prev,
              [roomId]: cleanText
            }));
          }
        }
      }
    };
    
    decryptMessages();
  }, [lastMessages, userId]);

  // Decrypt all group last messages when they're loaded
  useEffect(() => {
    if (!groupLastMessages || Object.keys(groupLastMessages).length === 0) return;
    
    const decryptGroupMessages = async () => {
      for (const [groupId, message] of Object.entries(groupLastMessages)) {
        if (message) {
          if (message.senderId === userId && message.content) {
            const cleanText = removeMentionFormatting(message.content);
            setDecryptedPreviews(prev => ({
              ...prev,
              [groupId]: cleanText
            }));
          }
          else if (message.encryptedContent && !decryptedPreviews[groupId]) {
            await decryptMessagePreview(message, groupId);
          }
          else if (message.content && message.content.trim().length > 0) {
            const cleanText = removeMentionFormatting(message.content);
            setDecryptedPreviews(prev => ({
              ...prev,
              [groupId]: cleanText
            }));
          }
        }
      }
    };
    
    decryptGroupMessages();
  }, [groupLastMessages, userId]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const friendsRes = await fetch(`/api/friends?userId=${userId}`);
      const friendsData = await friendsRes.json();
      
      if (friendsData.success) {
        const allFriends = friendsData.friends || [];
        
        const messagesRes = await fetch(`/api/chat/messages?action=last-messages&userId=${userId}`);
        const messagesData = await messagesRes.json();
        
        if (messagesData.success) {
          const lastMessageTimes = {};
          messagesData.lastMessages.forEach(item => {
            if (item.lastMessage?.timestamp) {
              lastMessageTimes[item._id] = item.lastMessage.timestamp;
            }
          });
          
          const friendsWithChats = allFriends
            .filter(friend => {
              const roomId = [userId, friend.userId].sort().join('-');
              return lastMessageTimes[roomId];
            })
            .map(friend => {
              const roomId = [userId, friend.userId].sort().join('-');
              return {
                ...friend,
                lastMessageTime: lastMessageTimes[roomId]
              };
            });
          
          friendsWithChats.sort((a, b) => {
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
          });
          
          setChats(friendsWithChats);
        } else {
          setChats([]);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/chat/groups?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await fetch(`/api/friends/requests?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setFriendRequests(data.requests || []);
        setUnreadRequests(data.requests?.length || 0);
        
        // Play sound for new friend requests if tab is not visible
        if (data.requests?.length > unreadRequests && !isTabVisible() && notificationPermission) {
          playSoundWithDebounce('friend-request', 'friend-request', 5000);
          
          // Show limited notification for friend request
          showSmartBrowserNotification(
            'friend-requests',
            'New Friend Request',
            {
              body: `You have ${data.requests.length} pending friend request${data.requests.length > 1 ? 's' : ''}`,
              data: { type: 'friend-request' }
            }
          );
        }
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const fetchLastMessages = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/chat/messages?action=last-messages&userId=${userId}`);
      const data = await res.json();
      
      if (data.success) {
        const messagesMap = {};
        const unreadMap = {};
        
        data.lastMessages.forEach(item => {
          messagesMap[item._id] = item.lastMessage;
          unreadMap[item._id] = item.unreadCount;
        });
        
        setLastMessages(messagesMap);
        setUnreadCounts(unreadMap);
      }
    } catch (error) {
      console.error("Error fetching last messages:", error);
    }
  };

  const fetchGroupLastMessages = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/chat/messages?action=group-last-messages&userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const messagesMap = {};
        const unreadMap = {};
        
        data.groupLastMessages.forEach(item => {
          messagesMap[item._id] = item.lastMessage;
          unreadMap[item._id] = item.unreadCount;
        });
        
        setGroupLastMessages(messagesMap);
        setGroupUnreadCounts(unreadMap);
      }
    } catch (error) {
      console.error("Error fetching group last messages:", error);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch(`/api/friends/blocked?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setBlockedUsers(data.blocked || []);
        setBlockedCount(data.blocked.length);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const handleBlock = (blockedUserId) => {
    setChats(prevChats => prevChats.map(chat => 
      chat.userId === blockedUserId ? { ...chat, isBlocked: true } : chat
    ));
    
    setBlockedCount(prev => prev + 1);
    fetchBlockedUsers();
    
    if (selectedChat?.userId === blockedUserId) {
      setSelectedChat(null);
      setMobileView('list');
    }
  };

  const handleUnblock = (unblockedUserId) => {
    setChats(prevChats => prevChats.map(chat => 
      chat.userId === unblockedUserId ? { ...chat, isBlocked: false } : chat
    ));
    
    setBlockedCount(prev => Math.max(0, prev - 1));
    fetchBlockedUsers();
  };

  const handleIncomingMessage = useCallback((message) => {
    // Check if we should show notification
    const shouldNotify = () => {
      // Don't notify for own messages
      if (message.senderId === userId) return false;
      
      // Don't notify if we're in the current chat (user is already seeing messages)
      if (selectedChat?.userId === message.senderId || selectedGroup?.groupId === message.roomId) {
        return false;
      }
      
      // Check if tab is visible
      const tabVisible = isTabVisible();
      
      // If tab is visible but user is in a different chat, don't show browser notification
      // (they'll see the unread indicator)
      if (tabVisible) {
        return false;
      }
      
      // Tab is not visible - we should notify but with smart limiting
      return true;
    };

    if (message.isGroupMessage) {
      if (message.roomId) {
        setGroupLastMessages(prev => ({
          ...prev,
          [message.roomId]: message
        }));
        
        if (message.encryptedContent) {
          decryptMessagePreview(message, message.roomId);
        }
        
        const isCurrentGroup = selectedGroup?.groupId === message.roomId;
        const isSentByMe = message.senderId === userId;
        
        if (!isSentByMe && !isCurrentGroup) {
          setGroupUnreadCounts(prev => ({
            ...prev,
            [message.roomId]: (prev[message.roomId] || 0) + 1
          }));
          
          // Smart notification for group message
          if (shouldNotify()) {
            const group = groups.find(g => g.groupId === message.roomId);
            const senderName = message.senderName || 'Someone';
            
            // Play sound (with throttling)
            playSoundWithDebounce('new-message', `group-${message.roomId}`);
            
            // Show smart browser notification (limited to last 2-3)
            if (notificationPermission) {
              const notificationShown = showSmartBrowserNotification(
                `group-${message.roomId}`,
                `New message in ${group?.groupName || 'group'}`,
                {
                  body: `${senderName}: ${message.content ? (message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content) : 'Sent a message'}`,
                  data: {
                    type: 'group',
                    roomId: message.roomId,
                    senderId: message.senderId,
                    messageId: `${message.roomId}-${message.timestamp}`
                  }
                }
              );
              
              // If notification wasn't shown (limited), still increment counter
              if (!notificationShown) {
                console.log(`📱 Notification limited for group ${message.roomId} (away mode)`);
              }
            }
          }
        }
      }
    } else if (message.senderId === userId || message.receiverId === userId) {
      setLastMessages(prev => ({
        ...prev,
        [message.roomId]: message
      }));
      
      if (message.encryptedContent) {
        decryptMessagePreview(message, message.roomId);
      }
      
      setChats(prevChats => {
        const friendId = message.senderId === userId ? message.receiverId : message.senderId;
        
        const updatedChats = prevChats.map(chat => {
          if (chat.userId === friendId) {
            return {
              ...chat,
              lastMessageTime: message.timestamp
            };
          }
          return chat;
        });
        
        return updatedChats.sort((a, b) => {
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });
      });
      
      if (message.receiverId === userId) {
        const senderIdFromMessage = message.senderId;
        const isCurrentlyInThisChat = selectedChat?.userId === senderIdFromMessage;
        
        if (!isCurrentlyInThisChat) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.roomId]: (prev[message.roomId] || 0) + 1
          }));
          
          // Smart notification for direct message
          if (shouldNotify()) {
            const sender = chats.find(c => c.userId === message.senderId);
            const senderName = sender?.userName || message.senderName || 'Someone';
            
            // Play sound (with throttling)
            playSoundWithDebounce('new-message', `dm-${message.roomId}`);
            
            // Show smart browser notification (limited to last 2-3)
            if (notificationPermission) {
              const notificationShown = showSmartBrowserNotification(
                `dm-${message.roomId}`,
                `New message from ${senderName}`,
                {
                  body: message.content ? (message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content) : 'Sent a message',
                  data: {
                    type: 'dm',
                    roomId: message.roomId,
                    senderId: message.senderId,
                    messageId: `${message.roomId}-${message.timestamp}`
                  }
                }
              );
              
              // If notification wasn't shown (limited), still increment counter
              if (!notificationShown) {
                console.log(`📱 Notification limited for DM ${message.roomId} (away mode)`);
              }
            }
          }
        }
      }
    }
  }, [userId, selectedChat, selectedGroup, soundEnabled, notificationPermission, playSoundWithDebounce, groups, chats]);

  const handleMessageRead = useCallback((data) => {
    if (data.roomId) {
      if (data.isGroupMessage) {
        if (data.userId === userId) {
          setGroupUnreadCounts(prev => ({
            ...prev,
            [data.roomId]: 0
          }));
          // Reset away notifications when messages are read
          resetAwayNotifications(`group-${data.roomId}`);
        }
      } else {
        if (data.userId === userId) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.roomId]: 0
          }));
          // Reset away notifications when messages are read
          resetAwayNotifications(`dm-${data.roomId}`);
        }
      }
    }
  }, [userId]);

  const handleMessageDelivered = useCallback((data) => {
    if (data.roomId) {
      if (data.isGroupMessage) {
        setGroupLastMessages(prev => {
          const lastMsg = prev[data.roomId];
          if (lastMsg && lastMsg.timestamp === data.timestamp) {
            return {
              ...prev,
              [data.roomId]: {
                ...lastMsg,
                delivered: true,
                deliveredAt: data.deliveredAt
              }
            };
          }
          return prev;
        });
      } else {
        setLastMessages(prev => {
          const lastMsg = prev[data.roomId];
          if (lastMsg && lastMsg.timestamp === data.timestamp) {
            return {
              ...prev,
              [data.roomId]: {
                ...lastMsg,
                delivered: true,
                deliveredAt: data.deliveredAt
              }
            };
          }
          return prev;
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    socket.on('receive-message', handleIncomingMessage);
    socket.on('message-read', handleMessageRead);
    socket.on('message-delivered', handleMessageDelivered);

    return () => {
      socket.off('receive-message', handleIncomingMessage);
      socket.off('message-read', handleMessageRead);
      socket.off('message-delivered', handleMessageDelivered);
    };
  }, [socket, isConnected, userId, handleIncomingMessage, handleMessageRead, handleMessageDelivered]);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}&currentUserId=${userId}`,
      );
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const debounceTimer = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(debounceTimer);
  };

  const viewUserProfile = async (user) => {
    setSelectedUser(user);

    try {
      const res = await fetch(
        `/api/friends/status?userId=${userId}&targetUserId=${user.userId}`,
      );
      const data = await res.json();
      
      const blockRes = await fetch(`/api/friends/block/check?userId=${userId}&targetId=${user.userId}`);
      const blockData = await blockRes.json();
      
      if (blockData.success && blockData.isBlocked) {
        setFriendshipStatus('blocked');
      } else if (data.success) {
        setFriendshipStatus(data.status);
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
    }

    setShowUserModal(true);
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendshipStatus("pending_sent");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const cancelFriendRequest = async (targetUserId) => {
    try {
      const res = await fetch("/api/friends/request/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendshipStatus(null);
        searchUsers(searchQuery);
      }
    } catch (error) {
      console.error("Error cancelling friend request:", error);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const res = await fetch("/api/friends/request/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
        setUnreadRequests((prev) => prev - 1);
        fetchChats();
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const res = await fetch("/api/friends/request/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));
        setUnreadRequests((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const acceptFriendRequestFromModal = async (targetUserId) => {
    const request = friendRequests.find((r) => r.userId === targetUserId);
    if (request) {
      await acceptFriendRequest(request._id);
      setShowUserModal(false);
    }
  };

  const handleChatSelect = (chat) => {
    const isCurrentUserBlocked = chat.isBlockedByThem || false;
    const isOtherUserBlocked = chat.isBlocked || false;
    
    if (isCurrentUserBlocked) {
      alert("You cannot chat with this user because they have blocked you.");
      return;
    }
    
    setSelectedChat(chat);
    setSelectedGroup(null);
    setMobileView('chat');
    
    const roomId = getRoomId(chat.userId);
    
    setUnreadCounts(prev => ({
      ...prev,
      [roomId]: 0
    }));
    
    // Reset away notifications when user opens the chat
    resetAwayNotifications(`dm-${roomId}`);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedChat(null);
    setMobileView('chat');
    
    setGroupUnreadCounts(prev => ({
      ...prev,
      [group.groupId]: 0
    }));
    
    // Reset away notifications when user opens the group
    resetAwayNotifications(`group-${group.groupId}`);
  };

  const handleBackToList = () => {
    setMobileView('list');
    setSelectedChat(null);
    setSelectedGroup(null);
  };

  const handleMessageUpdate = useCallback((data) => {
    if (data.type === 'chat-deleted') {
      setChats(prev => prev.filter(chat => chat.userId !== data.friendId));
      setLastMessages(prev => {
        const newMap = { ...prev };
        delete newMap[data.roomId];
        return newMap;
      });
      setUnreadCounts(prev => {
        const newMap = { ...prev };
        delete newMap[data.roomId];
        return newMap;
      });
      return;
    }
    
    if (data.type === 'chat-cleared') {
      setLastMessages(prev => ({
        ...prev,
        [data.roomId]: null
      }));
      setChats(prevChats => 
        prevChats.map(chat => {
          const chatRoomId = [userId, chat.userId].sort().join('-');
          if (chatRoomId === data.roomId) {
            return {
              ...chat,
              lastMessageTime: new Date().toISOString()
            };
          }
          return chat;
        })
      );
      return;
    }
    
    if (data.markAsRead && data.roomId) {
      if (data.isGroup) {
        setGroupUnreadCounts(prev => ({
          ...prev,
          [data.roomId]: 0
        }));
        resetAwayNotifications(`group-${data.roomId}`);
      } else {
        setUnreadCounts(prev => ({
          ...prev,
          [data.roomId]: 0
        }));
        resetAwayNotifications(`dm-${data.roomId}`);
      }
    } else {
      if (data.isGroupMessage) {
        setGroupLastMessages(prev => ({
          ...prev,
          [data.roomId]: data
        }));
        
        if (data.content) {
          const cleanText = removeMentionFormatting(data.content);
          setDecryptedPreviews(prev => ({
            ...prev,
            [data.roomId]: cleanText
          }));
        }
      } else {
        setLastMessages(prev => ({
          ...prev,
          [data.roomId]: data
        }));
        
        if (data.content) {
          const cleanText = removeMentionFormatting(data.content);
          setDecryptedPreviews(prev => ({
            ...prev,
            [data.roomId]: cleanText
          }));
        }
        
        setChats(prevChats => {
          const friendId = data.senderId === userId ? data.receiverId : data.senderId;
          
          const updatedChats = prevChats.map(chat => {
            if (chat.userId === friendId) {
              return {
                ...chat,
                lastMessageTime: data.timestamp
              };
            }
            return chat;
          });
          
          return updatedChats.sort((a, b) => {
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
          });
        });
      }
    }
  }, [userId]);

  const handleCreateGroup = async (groupData) => {
    try {
      const response = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupData.name,
          description: groupData.description,
          createdBy: userId,
          members: groupData.members || [],
          avatar: groupData.avatar
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchGroups();
        setShowCreateGroup(false);
        
        // Play success sound
        if (soundEnabled) {
          playNotificationSound('group-join');
        }
      } else {
        alert(`Failed to create group: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const handleJoinGroup = async (inviteCode) => {
    try {
      const res = await fetch('/api/chat/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setGroups(prev => [...prev, data.group]);
        setSelectedGroup(data.group);
        setMobileView('chat');
        
        // Play success sound
        if (soundEnabled) {
          playNotificationSound('group-join');
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to join group' };
    }
  };

  const handleGroupUpdate = (updatedGroup) => {
    setGroups(prev => prev.map(g => 
      g.groupId === updatedGroup.groupId ? updatedGroup : g
    ));
    setSelectedGroup(updatedGroup);
  };

  const handleSendMessageFromModal = (user) => {
    if (user.isBlocked) {
      alert('You have blocked this user. Unblock them to send messages.');
      return;
    }
    
    const chatUser = {
      userId: user.userId,
      userName: user.userName,
      username: user.username,
      avatar: user.avatar,
      isBlocked: user.isBlocked || false
    };
    
    handleChatSelect(chatUser);
  };

  const handleSelectContact = (contact) => {
    const newChat = {
      userId: contact.userId,
      userName: contact.userName,
      username: contact.username,
      avatar: contact.avatar,
      isBlocked: false,
      lastMessageTime: new Date().toISOString()
    };
    
    setChats(prev => {
      const exists = prev.some(chat => chat.userId === contact.userId);
      if (!exists) {
        return [newChat, ...prev];
      }
      return prev;
    });
    
    handleChatSelect(newChat);
  };

  const getRoomId = (friendUserId) => {
    return [userId, friendUserId].sort().join('-');
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateMessage = (content, maxLength = 30) => {
    if (!content) return '';
    const contentStr = String(content);
    if (contentStr.length <= maxLength) return contentStr;
    return contentStr.substring(0, maxLength) + '...';
  };

  const getGroupInitials = (name) => {
    if (!name) return 'GR';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return (
    <FriendsLockOverlay>
      <main className="flex-1 p-4 md:p-8 bg-[#EEF1F0] dark:bg-[#000000] overflow-y-auto min-h-screen transition-colors duration-300">
        <div className="h-full flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Chats & Groups List */}
          <div className={`lg:w-96 flex-shrink-0 ${mobileView === 'chat' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl border-[#dadce0] dark:border-[#181A1E] overflow-hidden h-full flex flex-col transition-colors duration-300">
              {/* Header */}
              <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E]">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-[#101010] text-sm font-medium text-[#5f6368] dark:text-gray-400">
                    <Calendar className="w-4 h-4 text-[#34A853]" />
                    <span>{today}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Sound Toggle Button */}
                    
                    
                    {/* Settings Dropdown with Chat Lock */}
                    <SettingsDropdown />
                    <button
                      onClick={toggleSound}
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
                      title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
                    >
                      {soundEnabled ? (
                        <Volume2 size={20} className="text-green-600 dark:text-green-500" />
                      ) : (
                        <VolumeX size={20} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                    {/* Friend Requests Icon */}
                    <button
                      onClick={() => setShowRequestsModal(true)}
                      className="relative p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full"
                    >
                      <Bell size={20} className="text-green-600 dark:text-green-500" />
                      {unreadRequests > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {unreadRequests}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                <h1 className="text-2xl small font-semibold text-[#000000] dark:text-white mb-2">
                  Messages
                </h1>
                <p className="text-sm text-[#5f6368] dark:text-gray-400">
                  Chat with friends and groups
                </p>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    Connecting to server...
                  </p>
                )}
                {isConnected && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Connected
                  </p>
                )}
                
                {/* Notification status indicator */}
                {/* <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs ${soundEnabled ? 'text-green-600 dark:text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {soundEnabled ? '🔊 Sound on' : '🔇 Sound off'}
                  </span>
                  {notificationPermission && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      • Notifications on
                    </span>
                  )}
                </div> */}
              </div>

              {/* Search */}
              <div className="p-4 border-b border-[#f1f3f4] dark:border-[#181A1E]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search messages or users..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-4 pl-10 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#000000] dark:text-white rounded-2xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none text-sm"
                  />
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-gray-400"
                    size={18}
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="flex-1 overflow-y-auto p-4">
                  <h2 className="text-sm font-semibold text-[#202124] dark:text-white mb-3">
                    Search Results
                  </h2>
                  {searching ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34A853] mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <button
                          key={user.userId}
                          onClick={() => viewUserProfile(user)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#101010] rounded-xl transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar userAvatar={user.avatar} name={user.userName} size="w-10 h-10" />
                              {user.isBlocked && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <Ban size={8} className="text-white" />
                                </span>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-[#202124] dark:text-white text-sm">
                                {user.userName}
                                {user.isBlocked && (
                                  <span className="ml-2 text-xs text-red-500">(Blocked)</span>
                                )}
                              </p>
                              <p className="text-xs text-[#5f6368] dark:text-gray-400">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                          <UserPlus size={18} className="text-[#34A853]" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-[#5f6368] dark:text-gray-400">No users found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Groups & Chats Lists */}
              {!searchQuery && (
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Groups Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-[#202124] dark:text-white flex items-center gap-2">
                        Groups ({groups.length})
                      </h2>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowJoinGroup(true)}
                          className="p-2 flex gap-1 items-center text-xs bg-gray-100 dark:bg-[#101010] rounded-full text-[#5f6368] dark:text-gray-400"
                          title="Join group with code"
                        > 
                          <Merge size={16} />
                          Join
                        </button>
                        <button
                          onClick={() => setShowCreateGroup(true)}
                          className="p-2 flex gap-1 items-center text-xs bg-green-100 dark:bg-green-900/30 rounded-full text-green-800 dark:text-green-400"
                          title="Create new group"
                        > 
                          <CirclePlus size={16} />
                          Create
                        </button>
                      </div>
                    </div>
                    
                    {groups.length > 0 ? (
                      <div className="space-y-2">
                        {groups.map((group) => {
                          const lastMsg = groupLastMessages[group.groupId];
                          const unreadCount = groupUnreadCounts[group.groupId] || 0;
                          
                          let groupAvatar = null;
                          if (group.avatar) {
                            try {
                              groupAvatar = typeof group.avatar === 'string' 
                                ? JSON.parse(group.avatar) 
                                : group.avatar;
                            } catch (e) {
                              console.error('Failed to parse group avatar', e);
                            }
                          }

                          const groupName = group.groupName || group.name || 'Unnamed Group';
                          
                          return (
                            <button
                              key={group.groupId}
                              onClick={() => handleGroupSelect(group)}
                              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#101010] rounded-2xl transition-all ${
                                selectedGroup?.groupId === group.groupId ? 'bg-green-50 dark:bg-[#181A1E]' : ''
                              } ${unreadCount > 0 ? 'bg-blue-50 dark:bg-[#0c2c1a]' : ''}`}
                            >
                              {/* Group Avatar */}
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 dark:bg-[#232529] flex items-center justify-center text-[#202124] dark:text-white font-semibold text-lg flex-shrink-0">
                                {groupAvatar?.beanConfig ? (
                                  <BeanHead {...groupAvatar.beanConfig} />
                                ) : (
                                  getGroupInitials(groupName)
                                )}
                              </div>
                              
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`font-medium text-[#202124] dark:text-white text-sm truncate flex items-center gap-1 ${
                                    unreadCount > 0 ? 'font-semibold' : ''
                                  }`}>
                                    {groupName}
                                  </p>
                                  {lastMsg && (
                                    <span className="text-xs text-[#5f6368] dark:text-gray-400 ml-2 flex-shrink-0">
                                      {formatMessageTime(lastMsg.timestamp)}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <p className={`text-xs ${
                                      unreadCount > 0 ? 'text-[#202124] dark:text-white font-medium' : 'text-[#5f6368] dark:text-gray-400'
                                    } truncate`}>
                                      {lastMsg ? (
                                        <>
                                          {lastMsg.senderId === userId && (
                                            <span className="mr-1">You:</span>
                                          )}
                                          {getMessagePreview(lastMsg, group.groupId)}
                                        </>
                                      ) : (
                                        <span className="text-[#5f6368] dark:text-gray-400">{group.members?.length || 0} members</span>
                                      )}
                                    </p>
                                  </div>
                                  
                                  {unreadCount > 0 && (
                                    <span className="flex-shrink-0 bg-[#34A853] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                      {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-[#101010] rounded-2xl">
                        <p className="text-sm text-[#5f6368] dark:text-gray-400">No groups yet</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-500 mt-1">Create or join a group to start chatting</p>
                      </div>
                    )}
                  </div>

                  {/* Chats Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-[#202124] dark:text-white">
                        Direct Messages ({chats.length})
                      </h2>
                      <button
                        onClick={() => setShowContactsModal(true)}
                        className="p-2 flex gap-1 items-center text-xs bg-green-100 dark:bg-green-900/30 rounded-full text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        title="Start new chat"
                      >
                        <CirclePlus size={16} />
                        New Chat
                      </button>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34A853] mx-auto"></div>
                      </div>
                    ) : chats.length > 0 ? (
                      <div className="space-y-2">
                        {chats.map((chat) => {
                          const roomId = getRoomId(chat.userId);
                          const lastMsg = lastMessages[roomId];
                          const unreadCount = unreadCounts[roomId] || 0;
                          const isBlocked = chat.isBlocked || false;
                          
                          return (
                            <button
                              key={chat.userId}
                              onClick={() => handleChatSelect(chat)}
                              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#101010] rounded-2xl transition-all ${
                                selectedChat?.userId === chat.userId ? 'bg-green-50 dark:bg-[#181A1E]' : ''
                              } ${unreadCount > 0 && !isBlocked ? 'bg-blue-50 dark:bg-[#0c2c1a]' : ''} ${isBlocked ? 'opacity-70' : ''}`}
                            >
                              <div className="relative">
                                <Avatar userAvatar={chat.avatar} name={chat.userName} size="w-12 h-12" />
                                {chat.online && !isBlocked && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0c0c0c] rounded-full"></span>
                                )}
                                {isBlocked && (
                                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-[#0c0c0c] rounded-full flex items-center justify-center">
                                    <Ban size={10} className="text-white" />
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`font-medium text-[#202124] dark:text-white text-sm truncate flex items-center gap-1 ${
                                    unreadCount > 0 && !isBlocked ? 'font-semibold' : ''
                                  }`}>
                                    {chat.userName}
                                    {isBlocked && (
                                      <span className="text-xs text-red-500 ml-1">(Blocked)</span>
                                    )}
                                  </p>
                                  {lastMsg && !isBlocked && (
                                    <span className="text-xs text-[#5f6368] dark:text-gray-400 ml-2 flex-shrink-0">
                                      {formatMessageTime(lastMsg.timestamp)}
                                    </span>
                                  )}
                                  {isBlocked && (
                                    <span className="text-xs text-red-400 ml-2 flex-shrink-0">
                                      Blocked
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <p className={`text-xs ${
                                      unreadCount > 0 && !isBlocked ? 'text-[#202124] dark:text-white font-medium' : 'text-[#5f6368] dark:text-gray-400'
                                    } truncate`}>
                                      {isBlocked ? (
                                        <span className="text-red-400">You've blocked this user</span>
                                      ) : lastMsg ? (
                                        <>
                                          {lastMsg.senderId === userId && (
                                            <span className="mr-1">You:</span>
                                          )}
                                          {getMessagePreview(lastMsg, roomId)}
                                        </>
                                      ) : (
                                        'No messages yet'
                                      )}
                                    </p>
                                  </div>
                                  
                                  {!isBlocked && unreadCount > 0 && (
                                    <span className="flex-shrink-0 bg-[#34A853] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                                      {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 dark:bg-[#101010] rounded-2xl">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-[#5f6368] dark:text-gray-400 text-sm">No chats yet</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-500 mt-2">
                          Click "New Chat" to start messaging your friends!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Chat Area */}
          <div className={`flex-1 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
            {selectedChat ? (
              <ChatInterface
                friend={selectedChat}
                currentUserId={userId}
                currentUserAvatar={avatar}
                onClose={handleBackToList}
                onMessageUpdate={handleMessageUpdate}
                soundEnabled={soundEnabled}
              />
            ) : selectedGroup ? (
              <GroupChatInterface
                group={selectedGroup}
                currentUserId={userId}
                currentUserAvatar={avatar}
                onClose={handleBackToList}
                onMessageUpdate={handleMessageUpdate}
                onGroupUpdate={handleGroupUpdate}
                soundEnabled={soundEnabled}
              />
            ) : (
              <div className="h-full bg-white dark:bg-[#0c0c0c] rounded-3xl border-[#dadce0] dark:border-[#181A1E] flex items-center justify-center p-8 transition-colors duration-300">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <MessageCircle size={48} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl small font-semibold text-[#202124] dark:text-white mb-2">
                    No Chat Selected
                  </h3>
                  <p className="text-[#5f6368] dark:text-gray-400 text-sm">
                    Select a chat from the list or click "New Chat" to start messaging your friends.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <FriendRequestsModal
          isOpen={showRequestsModal}
          onClose={() => setShowRequestsModal(false)}
          requests={friendRequests}
          onAccept={acceptFriendRequest}
          onReject={rejectFriendRequest}
        />

        <UserInfoModal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          user={selectedUser}
          onSendRequest={sendFriendRequest}
          onCancelRequest={cancelFriendRequest}
          onAcceptRequest={acceptFriendRequestFromModal}
          friendshipStatus={friendshipStatus}
          currentUserId={userId}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onSendMessage={handleSendMessageFromModal}
        />

        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          userId={userId}
          friends={chats}
          onCreate={handleCreateGroup}
        />

        <JoinGroupModal
          isOpen={showJoinGroup}
          onClose={() => setShowJoinGroup(false)}
          onJoin={handleJoinGroup}
        />

        <BlockedUsersModal
          isOpen={showBlockedModal}
          onClose={() => setShowBlockedModal(false)}
          userId={userId}
          onUnblock={handleUnblock}
        />

        <ContactsModal
          isOpen={showContactsModal}
          onClose={() => setShowContactsModal(false)}
          onSelectContact={handleSelectContact}
          userId={userId}
        />
      </main>
    </FriendsLockOverlay>
  );
}