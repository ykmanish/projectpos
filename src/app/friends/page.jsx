"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useSocket } from "@/context/SocketContext";
import {
  Calendar,
  Search,
  UserPlus,
  Users,
  Merge,
  Bell,
  MessageCircle,
  Check,
  CheckCheck,
  CirclePlus,
  LogIn,
  Hash,
  Lock,
  Ban
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

export default function FriendsPage() {
  const router = useRouter();
  const { userId, userName, avatar } = useUser();
  const { socket, isConnected } = useSocket();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState([]);
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

  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupLastMessages, setGroupLastMessages] = useState({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    if (userId) {
      fetchFriends();
      fetchGroups();
      fetchFriendRequests();
      fetchLastMessages();
      fetchGroupLastMessages();
      fetchBlockedUsers();
    }
  }, [userId]);

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
    console.log('🚫 Blocking user:', blockedUserId);
    
    // Update the friends list to mark user as blocked - KEEP THEM IN LIST
    setFriends(prevFriends => {
      const updated = prevFriends.map(friend => 
        friend.userId === blockedUserId 
          ? { ...friend, isBlocked: true } 
          : friend
      );
      console.log('📋 Updated friends list:', updated);
      return updated;
    });
    
    // Update blocked users count
    setBlockedCount(prev => prev + 1);
    
    // Refresh blocked users list
    fetchBlockedUsers();
    
    // If this user is currently selected in chat, close the chat
    if (selectedChat?.userId === blockedUserId) {
      setSelectedChat(null);
      setMobileView('list');
    }
  };

  const handleUnblock = (unblockedUserId) => {
    console.log('✅ Unblocking user:', unblockedUserId);
    
    // Update the friends list to mark user as unblocked
    setFriends(prevFriends => {
      const updated = prevFriends.map(friend => 
        friend.userId === unblockedUserId 
          ? { ...friend, isBlocked: false } 
          : friend
      );
      console.log('📋 Updated friends list after unblock:', updated);
      return updated;
    });
    
    // Update blocked users count
    setBlockedCount(prev => Math.max(0, prev - 1));
    
    // Refresh blocked users list
    fetchBlockedUsers();
  };

  const handleIncomingMessage = useCallback((message) => {
    console.log('🔔 NEW MESSAGE RECEIVED IN FRIENDS PAGE:', message);
    
    if (message.isGroupMessage) {
      // Handle group message
      if (message.roomId) {
        console.log('📥 Updating group last message for:', message.roomId);
        setGroupLastMessages(prev => ({
          ...prev,
          [message.roomId]: message
        }));
        
        // Update unread count if not currently in this group AND not sent by current user
        const isCurrentGroup = selectedGroup?.groupId === message.roomId;
        const isSentByMe = message.senderId === userId;
        
        console.log('🔍 Group message check:', {
          isCurrentGroup,
          isSentByMe,
          selectedGroupId: selectedGroup?.groupId,
          messageRoomId: message.roomId
        });
        
        if (!isSentByMe && !isCurrentGroup) {
          console.log('➕ Incrementing unread count for group:', message.roomId);
          setGroupUnreadCounts(prev => ({
            ...prev,
            [message.roomId]: (prev[message.roomId] || 0) + 1
          }));
        }
      }
    } else if (message.senderId === userId || message.receiverId === userId) {
      // Handle direct message
      console.log('📥 Updating direct message for:', message.roomId);
      setLastMessages(prev => ({
        ...prev,
        [message.roomId]: message
      }));
      
      if (message.receiverId === userId) {
        const senderIdFromMessage = message.senderId;
        const isCurrentlyInThisChat = selectedChat?.userId === senderIdFromMessage;
        
        if (!isCurrentlyInThisChat) {
          console.log('➕ Incrementing unread count for direct chat:', message.roomId);
          setUnreadCounts(prev => ({
            ...prev,
            [message.roomId]: (prev[message.roomId] || 0) + 1
          }));
        }
      }
    }
  }, [userId, selectedChat, selectedGroup]);

  const handleMessageRead = useCallback((data) => {
    console.log('✓✓ Message read event received:', data);
    if (data.roomId) {
      if (data.isGroupMessage) {
        // For groups, only clear when current user marks as read
        if (data.userId === userId) {
          console.log('🔄 Clearing group unread count for:', data.roomId);
          setGroupUnreadCounts(prev => ({
            ...prev,
            [data.roomId]: 0
          }));
        }
      } else {
        // For direct messages
        if (data.userId === userId) {
          console.log('🔄 Clearing direct message unread count for:', data.roomId);
          setUnreadCounts(prev => ({
            ...prev,
            [data.roomId]: 0
          }));
        }
      }
    }
  }, [userId]);

  const handleMessageDelivered = useCallback((data) => {
    console.log('✓ Message delivered event:', data);
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

    console.log('🔌 Setting up socket listeners in FriendsPage');

    socket.on('receive-message', handleIncomingMessage);
    socket.on('message-read', handleMessageRead);
    socket.on('message-delivered', handleMessageDelivered);

    return () => {
      console.log('🧹 Cleaning up socket listeners in FriendsPage');
      socket.off('receive-message', handleIncomingMessage);
      socket.off('message-read', handleMessageRead);
      socket.off('message-delivered', handleMessageDelivered);
    };
  }, [socket, isConnected, userId, handleIncomingMessage, handleMessageRead, handleMessageDelivered]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        console.log('👥 Fetched friends:', data.friends);
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
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
        
        console.log('📨 Fetched last messages:', messagesMap);
        console.log('🔢 Fetched unread counts:', unreadMap);
        
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
        
        console.log('📨 Fetched group last messages:', messagesMap);
        console.log('🔢 Fetched group unread counts:', unreadMap);
        
        setGroupLastMessages(messagesMap);
        setGroupUnreadCounts(unreadMap);
      }
    } catch (error) {
      console.error("Error fetching group last messages:", error);
    }
  };

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
      // First check friendship status
      const res = await fetch(
        `/api/friends/status?userId=${userId}&targetUserId=${user.userId}`,
      );
      const data = await res.json();
      
      // Then check if user is blocked
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
        fetchFriends();
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

 // In the handleChatSelect function, add block check
const handleChatSelect = (friend) => {
  // Check if either user has blocked the other
  const isCurrentUserBlocked = friend.isBlockedByThem || false; // You'll need to add this field
  const isOtherUserBlocked = friend.isBlocked || false;
  
  if (isCurrentUserBlocked) {
    alert("You cannot chat with this user because they have blocked you.");
    return;
  }
  
  // Allow opening chat even with blocked users (but with restrictions)
  setSelectedChat(friend);
  setSelectedGroup(null);
  setMobileView('chat');
  
  const roomId = getRoomId(friend.userId);
  console.log('💬 Opening chat for room:', roomId);
  
  setUnreadCounts(prev => ({
    ...prev,
    [roomId]: 0
  }));
};


  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedChat(null);
    setMobileView('chat');
    
    console.log('💬 Opening group chat for:', group.groupId);
    
    // Clear unread count for this group immediately
    setGroupUnreadCounts(prev => ({
      ...prev,
      [group.groupId]: 0
    }));
  };

  const handleBackToList = () => {
    setMobileView('list');
    setSelectedChat(null);
    setSelectedGroup(null);
  };

  const handleMessageUpdate = useCallback((data) => {
    console.log('📤 Message update from ChatInterface:', data);
    
    if (data.markAsRead && data.roomId) {
      if (data.isGroup) {
        console.log('🔄 Clearing group unread from message update:', data.roomId);
        setGroupUnreadCounts(prev => ({
          ...prev,
          [data.roomId]: 0
        }));
      } else {
        console.log('🔄 Clearing direct unread from message update:', data.roomId);
        setUnreadCounts(prev => ({
          ...prev,
          [data.roomId]: 0
        }));
      }
    } else {
      // New message sent, update last message
      if (data.isGroupMessage) {
        console.log('📤 Updating group last message after send:', data.roomId);
        setGroupLastMessages(prev => ({
          ...prev,
          [data.roomId]: data
        }));
      } else {
        console.log('📤 Updating direct last message after send:', data.roomId);
        setLastMessages(prev => ({
          ...prev,
          [data.roomId]: data
        }));
      }
    }
  }, []);

  const handleCreateGroup = async (groupData) => {
    try {
      console.log('Creating group with data:', groupData);
      
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
      console.log('API Response:', data);
      
      if (data.success) {
        console.log('Group created successfully:', data.group);
        await fetchGroups();
        setShowCreateGroup(false);
      } else {
        console.error('Failed to create group:', data.error);
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
    // Check if user is blocked
    if (user.isBlocked) {
      alert('You have blocked this user. Unblock them to send messages.');
      return;
    }
    handleChatSelect(user);
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
    if (!content) return 'No messages yet';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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

  return (
    <main className="flex-1 p-4 md:p-8 bg-[#EEF1F0] overflow-y-auto min-h-screen">
      <div className="h-full flex flex-col lg:flex-row gap-6">
        {/* Left Panel - Friends & Groups List */}
        <div className={`lg:w-96 flex-shrink-0 ${mobileView === 'chat' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-3xl border-[#dadce0] overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#f1f3f4]">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-sm font-medium text-[#5f6368]">
                  <Calendar className="w-4 h-4 text-[#34A853]" />
                  <span>{today}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Blocked Icon - Always visible and clickable */}
                  <button
                    onClick={() => setShowBlockedModal(true)}
                    className="relative p-2 hover:bg-gray-100 rounded-full"
                    title="Blocked users"
                  >
                    <Ban size={20} className="text-red-500" />
                    {blockedCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {blockedCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Friend Requests Icon */}
                  <button
                    onClick={() => setShowRequestsModal(true)}
                    className="relative p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Bell size={20} className="text-green-600" />
                    {unreadRequests > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadRequests}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <h1 className="text-2xl small font-semibold text-[#000000] mb-2">
                Messages
              </h1>
              <p className="text-sm text-[#5f6368]">
                Chat with friends and groups
              </p>
              {!isConnected && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Connecting to server...
                </p>
              )}
              {isConnected && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </p>
              )}
            </div>

            {/* Search */}
            <div className="p-4 border-b border-[#f1f3f4]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search friends or users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-4 pl-10 border border-[#dadce0] rounded-2xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none text-sm"
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6368]"
                  size={18}
                />
              </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-sm font-semibold text-[#202124] mb-3">
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
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all"
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
                            <p className="font-medium text-[#202124] text-sm">
                              {user.userName}
                              {user.isBlocked && (
                                <span className="ml-2 text-xs text-red-500">(Blocked)</span>
                              )}
                            </p>
                            <p className="text-xs text-[#5f6368]">
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
                    <p className="text-sm text-[#5f6368]">No users found</p>
                  </div>
                )}
              </div>
            )}

            {/* Groups & Friends Lists */}
            {!searchQuery && (
              <div className="flex-1 overflow-y-auto p-4">
                {/* Groups Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-[#202124] flex items-center gap-2">
                      Groups ({groups.length})
                    </h2>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowJoinGroup(true)}
                        className="p-2 flex gap-1 items-center text-xs bg-gray-100 rounded-full text-[#5f6368]"
                        title="Join group with code"
                      > 
                        <Merge size={16} />
                        Join Group
                      </button>
                      <button
                        onClick={() => setShowCreateGroup(true)}
                        className="p-2 flex gap-1 items-center text-xs bg-green-100 rounded-full text-green-800"
                        title="Create new group"
                      > 
                        <CirclePlus size={16} />
                        Create Group
                      </button>
                    </div>
                  </div>
                  
                  {groups.length > 0 ? (
                    <div className="space-y-2">
                      {groups.map((group) => {
                        const lastMsg = groupLastMessages[group.groupId];
                        const unreadCount = groupUnreadCounts[group.groupId] || 0;
                        
                        // Parse group avatar
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
                            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all ${
                              selectedGroup?.groupId === group.groupId ? 'bg-green-50' : ''
                            } ${unreadCount > 0 ? 'bg-blue-50' : ''}`}
                          >
                            {/* Group Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                              {groupAvatar?.beanConfig ? (
                                <BeanHead {...groupAvatar.beanConfig} />
                              ) : (
                                getGroupInitials(groupName)
                              )}
                            </div>
                            
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium text-[#202124] text-sm truncate flex items-center gap-1 ${
                                  unreadCount > 0 ? 'font-semibold' : ''
                                }`}>
                                  {groupName}
                                  {group.settings?.onlyAdminsCanMessage && (
                                    <Lock size={12} className="text-[#5f6368]" />
                                  )}
                                </p>
                                {lastMsg && (
                                  <span className="text-xs text-[#5f6368] ml-2 flex-shrink-0">
                                    {formatMessageTime(lastMsg.timestamp)}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <p className={`text-xs ${
                                    unreadCount > 0 ? 'text-[#202124] font-medium' : 'text-[#5f6368]'
                                  } truncate`}>
                                    {lastMsg ? (
                                      <>
                                        {lastMsg.senderId === userId && (
                                          <span className="mr-1">You:</span>
                                        )}
                                        {lastMsg.content ? truncateMessage(lastMsg.content) : '📎 Attachment'}
                                      </>
                                    ) : (
                                      <span className="text-[#5f6368]">{group.members?.length || 0} members</span>
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
                    <div className="text-center flex flex-col items-center justify-center py-6 bg-gray-50 rounded-2xl">
                      <p className="text-sm text-[#5f6368]">No groups yet</p>
                    </div>
                  )}
                </div>

                {/* Friends Section - ALL friends shown, including blocked */}
                <div>
                  <h2 className="text-sm font-semibold text-[#202124] mb-3 flex items-center justify-between">
                    <span>Direct Messages ({friends.length})</span>
                  </h2>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34A853] mx-auto"></div>
                    </div>
                  ) : friends.length > 0 ? (
                    <div className="space-y-2">
                      {friends.map((friend) => {
                        const roomId = getRoomId(friend.userId);
                        const lastMsg = lastMessages[roomId];
                        const unreadCount = unreadCounts[roomId] || 0;
                        const isBlocked = friend.isBlocked || false;
                        
                        console.log('🔍 Rendering friend:', friend.userName, 'isBlocked:', isBlocked);
                        
                        return (
                          <button
                            key={friend.userId}
                            onClick={() => handleChatSelect(friend)}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all ${
                              selectedChat?.userId === friend.userId ? 'bg-green-50' : ''
                            } ${unreadCount > 0 && !isBlocked ? 'bg-blue-50' : ''} ${isBlocked ? 'opacity-70' : ''}`}
                          >
                            <div className="relative">
                              <Avatar userAvatar={friend.avatar} name={friend.userName} size="w-12 h-12" />
                              {friend.online && !isBlocked && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                              )}
                              {isBlocked && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                                  <Ban size={10} className="text-white" />
                                </span>
                              )}
                            </div>
                            
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium text-[#202124] text-sm truncate flex items-center gap-1 ${
                                  unreadCount > 0 && !isBlocked ? 'font-semibold' : ''
                                }`}>
                                  {friend.userName}
                                  {isBlocked && (
                                    <span className="text-xs text-red-500 ml-1">(Blocked)</span>
                                  )}
                                </p>
                                {lastMsg && !isBlocked && (
                                  <span className="text-xs text-[#5f6368] ml-2 flex-shrink-0">
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
                                    unreadCount > 0 && !isBlocked ? 'text-[#202124] font-medium' : 'text-[#5f6368]'
                                  } truncate`}>
                                    {isBlocked ? (
                                      <span className="text-red-400">You've blocked this user</span>
                                    ) : lastMsg ? (
                                      <>
                                        {lastMsg.senderId === userId && (
                                          <span className="mr-1">You:</span>
                                        )}
                                        {lastMsg.content ? truncateMessage(lastMsg.content) : '📎 Attachment'}
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
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-[#5f6368] text-sm">No friends yet</p>
                      <p className="text-xs text-[#5f6368] mt-2">
                        Search for people to connect with!
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
            />
          ) : selectedGroup ? (
            <GroupChatInterface
              group={selectedGroup}
              currentUserId={userId}
              currentUserAvatar={avatar}
              onClose={handleBackToList}
              onMessageUpdate={handleMessageUpdate}
              onGroupUpdate={handleGroupUpdate}
            />
          ) : (
            <div className="h-full bg-white rounded-3xl border-[#dadce0] flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={48} className="text-green-600" />
                </div>
                <h3 className="text-xl small font-semibold text-[#202124] mb-2">
                  No Chat Selected
                </h3>
                <p className="text-[#5f6368] text-sm">
                  Select a friend or group from the list to start chatting. Connect with others and share your positivity journey!
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
        friends={friends}
        onCreate={handleCreateGroup}
      />

      <JoinGroupModal
        isOpen={showJoinGroup}
        onClose={() => setShowJoinGroup(false)}
        onJoin={handleJoinGroup}
      />

      {/* Blocked Users Modal */}
      <BlockedUsersModal
        isOpen={showBlockedModal}
        onClose={() => setShowBlockedModal(false)}
        userId={userId}
        onUnblock={handleUnblock}
      />
    </main>
  );
}
