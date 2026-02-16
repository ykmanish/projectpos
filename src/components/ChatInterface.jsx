'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import {
  ChevronLeft,
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  Maximize2,
  MessageCircle,
  Check,
  CheckCheck,
  Info,
  Ban
} from "lucide-react";
import { BeanHead } from "beanheads";
import EmojiPicker from 'emoji-picker-react';
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import PreSendAttachmentPreview from "./PreSendAttachmentPreview";
import MessageContextMenu from "./MessageContextMenu";
import useLongPress from "@/hooks/useLongPress";
import MessageInfoModal from "./MessageInfoModal";
import UserInfoModal from "./UserInfoModal";

export default function ChatInterface({ friend, currentUserId, currentUserAvatar, onClose, onMessageUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendTyping, setFriendTyping] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [friendOnline, setFriendOnline] = useState(false);
  const [friendLastSeen, setFriendLastSeen] = useState(null);
  const [roomJoined, setRoomJoined] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  
  // Block states
  const [blockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false
  });
  
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [messageInfoData, setMessageInfoData] = useState(null);
  
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [allAttachments, setAllAttachments] = useState([]);
  
  const [previewPreSendAttachment, setPreviewPreSendAttachment] = useState(null);
  
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { socket, isConnected } = useSocket();
  const roomId = [currentUserId, friend.userId].sort().join('-');

  // Check if user can send messages
  const canSendMessages = !blockStatus.iBlockedThem && !blockStatus.theyBlockedMe;

  useEffect(() => {
    if (friend?.userId) {
      fetchFriendshipStatus();
      checkBlockStatus();
    }
  }, [friend]);

  const checkBlockStatus = async () => {
    try {
      // Check if current user blocked the friend
      const iBlockedRes = await fetch(`/api/friends/blocked/check?userId=${currentUserId}&targetId=${friend.userId}`);
      const iBlockedData = await iBlockedRes.json();
      
      // Check if friend blocked the current user
      const theyBlockedRes = await fetch(`/api/friends/blocked/check?userId=${friend.userId}&targetId=${currentUserId}`);
      const theyBlockedData = await theyBlockedRes.json();
      
      setBlockStatus({
        iBlockedThem: iBlockedData.success && iBlockedData.isBlocked,
        theyBlockedMe: theyBlockedData.success && theyBlockedData.isBlocked
      });
      
      console.log('🔍 Block status:', {
        iBlockedThem: iBlockedData.success && iBlockedData.isBlocked,
        theyBlockedMe: theyBlockedData.success && theyBlockedData.isBlocked
      });
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const fetchFriendshipStatus = async () => {
    try {
      const res = await fetch(`/api/friends/status?userId=${currentUserId}&targetUserId=${friend.userId}`);
      const data = await res.json();
      if (data.success) {
        setFriendshipStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching friendship status:', error);
    }
  };

  const handleUnfriend = async () => {
    onClose();
  };

  const handleBlock = async () => {
    setBlockStatus(prev => ({ ...prev, iBlockedThem: true }));
    onClose();
  };

  const handleUnblock = async () => {
    setBlockStatus(prev => ({ ...prev, iBlockedThem: false }));
    fetchFriendshipStatus();
  };

  const handleSendMessageFromInfo = (user) => {
    setShowUserInfo(false);
  };

  const handleMessageInfo = (message) => {
    setMessageInfoData(message);
    setShowMessageInfo(true);
  };

  const renderAvatar = (userAvatar, name, size = "w-8 h-8") => {
    if (!userAvatar) {
      return (
        <div
          className={`${size} rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold`}
        >
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      );
    }

    try {
      const parsedAvatar =
        typeof userAvatar === "string" ? JSON.parse(userAvatar) : userAvatar;

      if (parsedAvatar && parsedAvatar.beanConfig) {
        return (
          <div
            className={`${size} rounded-full overflow-hidden bg-[#e8f0fe] flex items-center justify-center`}
          >
            <BeanHead {...parsedAvatar.beanConfig} />
          </div>
        );
      }
    } catch (e) {
      console.error("Failed to parse avatar:", e);
    }

    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white font-semibold`}
      >
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const attachments = [];
    messages.forEach(msg => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          attachments.push({
            ...att,
            messageId: msg.timestamp,
            senderId: msg.senderId
          });
        });
      }
    });
    setAllAttachments(attachments);
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (attachmentPickerRef.current && !attachmentPickerRef.current.contains(event.target)) {
        setShowAttachments(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !currentUserId || !friend?.userId) {
      setRoomJoined(false);
      return;
    }

    console.log('🔌 Setting up chat for room:', roomId);
    
    socket.emit('join-chat', { roomId, userId: currentUserId });

    socket.emit('get-user-status', { userId: friend.userId }, (status) => {
      console.log('User status:', status);
      setFriendOnline(status.online);
      setFriendLastSeen(status.lastSeen);
    });

    const onJoinedRoom = ({ roomId: joinedRoom, success }) => {
      if (success && joinedRoom === roomId) {
        console.log('✅ Successfully joined room:', roomId);
        setRoomJoined(true);
        fetchMessages();
        markMessagesAsRead();
      }
    };

    const onMessage = (message) => {
      console.log('📩 Message received in chat:', message);
      if (message.roomId === roomId) {
        setMessages(prev => {
          const exists = prev.some(m => 
            m.timestamp === message.timestamp && 
            m.senderId === message.senderId
          );
          if (exists) return prev;
          return [...prev, message];
        });
        
        if (message.senderId === friend.userId) {
          setTimeout(() => markMessagesAsRead(), 500);
        }
        
        if (onMessageUpdate) {
          onMessageUpdate(message);
        }
      }
    };

    const onMessageUpdated = (data) => {
      console.log('📝 Message updated:', data);
      if (data.roomId === roomId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.timestamp === data.timestamp && msg.senderId === data.senderId
              ? { ...msg, ...data }
              : msg
          )
        );
      }
    };

    const onMessageDeleted = (data) => {
      console.log('🗑️ Message deleted:', data);
      if (data.roomId === roomId) {
        if (data.deleteForEveryone) {
          setMessages(prev =>
            prev.map(msg =>
              msg.timestamp === data.timestamp && msg.senderId === data.senderId
                ? { 
                    ...msg, 
                    deleted: true, 
                    content: "This message was deleted", 
                    attachments: [],
                    deletedAt: data.deletedAt
                  }
                : msg
            )
          );
        } else {
          setMessages(prev =>
            prev.filter(msg =>
              !(msg.timestamp === data.timestamp && msg.senderId === data.senderId)
            )
          );
        }
      }
    };

    const onMessageReaction = (data) => {
      console.log('😊 Message reaction:', data);
      if (data.roomId === roomId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.timestamp === data.timestamp && msg.senderId === data.messageOwnerId
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      }
    };

    const onMessageRead = (data) => {
      console.log('✓✓ Messages marked as read:', data);
      if (data.roomId === roomId && data.userId === friend.userId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.senderId === currentUserId && !msg.read
              ? { ...msg, read: true, readAt: data.readAt }
              : msg
          )
        );
      }
    };

    const onMessageDelivered = (data) => {
      console.log('✓ Messages delivered:', data);
      if (data.roomId === roomId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.senderId === currentUserId && !msg.delivered
              ? { ...msg, delivered: true, deliveredAt: data.deliveredAt }
              : msg
          )
        );
      }
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId !== currentUserId && userId === friend.userId) {
        setFriendTyping(isTyping);
      }
    };

    const onOnline = ({ userId, online, lastSeen }) => {
      if (userId === friend.userId) {
        setFriendOnline(online);
        if (!online && lastSeen) {
          setFriendLastSeen(lastSeen);
        }
      }
    };

    const onStatusChange = ({ userId, online, lastSeen }) => {
      if (userId === friend.userId) {
        setFriendOnline(online);
        if (!online && lastSeen) {
          setFriendLastSeen(lastSeen);
        }
      }
    };

    socket.on('joined-room', onJoinedRoom);
    socket.on('receive-message', onMessage);
    socket.on('message-updated', onMessageUpdated);
    socket.on('message-deleted', onMessageDeleted);
    socket.on('message-reaction', onMessageReaction);
    socket.on('message-read', onMessageRead);
    socket.on('message-delivered', onMessageDelivered);
    socket.on('user-typing', onTyping);
    socket.on('user-online', onOnline);
    socket.on('user-status-change', onStatusChange);

    fetchMessages();
    markMessagesAsRead();

    return () => {
      console.log('🧹 Cleaning up chat listeners');
      socket.off('joined-room', onJoinedRoom);
      socket.off('receive-message', onMessage);
      socket.off('message-updated', onMessageUpdated);
      socket.off('message-deleted', onMessageDeleted);
      socket.off('message-reaction', onMessageReaction);
      socket.off('message-read', onMessageRead);
      socket.off('message-delivered', onMessageDelivered);
      socket.off('user-typing', onTyping);
      socket.off('user-online', onOnline);
      socket.off('user-status-change', onStatusChange);
      
      socket.emit('leave-chat', { roomId, userId: currentUserId });
      setRoomJoined(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, isConnected, friend?.userId, currentUserId, roomId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}&userId=${currentUserId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await fetch('/api/chat/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userId: currentUserId }),
      });
      
      if (socket && isConnected) {
        socket.emit('mark-as-read', { roomId, userId: currentUserId });
      }
      
      if (onMessageUpdate) {
        onMessageUpdate({ roomId, markAsRead: true });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    // Check if user can send messages
    if (!canSendMessages) {
      alert(blockStatus.iBlockedThem 
        ? "You have blocked this user. Unblock to send messages."
        : "You cannot send messages to this user because they have blocked you.");
      return;
    }

    if ((!newMessage.trim() && attachments.length === 0) || !socket || !isConnected || !roomJoined) return;

    const now = new Date().toISOString();
    const messageData = {
      roomId,
      senderId: currentUserId,
      receiverId: friend.userId,
      content: newMessage.trim(),
      attachments: attachments.map(att => ({
        url: att.url,
        type: att.type,
        name: att.name,
      })),
      timestamp: now,
      delivered: true,
      deliveredAt: now,
      read: false,
      reactions: [],
      isGroupMessage: false
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage("");
    setAttachments([]);
    setShowAttachments(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

    console.log('📤 Sending direct message with deliveredAt:', messageData);
    socket.emit('send-message', messageData);

    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    }).then(() => {
      if (onMessageUpdate) {
        onMessageUpdate(messageData);
      }
    }).catch(console.error);
  };

  const handleSendWithAttachments = async () => {
    // Check if user can send messages
    if (!canSendMessages) {
      alert(blockStatus.iBlockedThem 
        ? "You have blocked this user. Unblock to send messages."
        : "You cannot send messages to this user because they have blocked you.");
      return;
    }

    if ((!newMessage.trim() && attachments.length === 0) || !socket || !isConnected || !roomJoined) return;

    setUploading(true);
    
    const uploadedAttachments = await uploadAttachments();
    
    const existingUploaded = attachments.filter(att => att.url).map(att => ({
      url: att.url,
      type: att.type,
      name: att.name,
    }));
    
    const allUploadedAttachments = [...existingUploaded, ...uploadedAttachments];

    const now = new Date().toISOString();
    const messageData = {
      roomId,
      senderId: currentUserId,
      receiverId: friend.userId,
      content: newMessage.trim(),
      attachments: allUploadedAttachments,
      timestamp: now,
      delivered: true,
      deliveredAt: now,
      read: false,
      reactions: [],
      isGroupMessage: false
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage("");
    
    attachments.forEach(att => {
      if (att.preview) {
        URL.revokeObjectURL(att.preview);
      }
    });
    setAttachments([]);
    setShowAttachments(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

    console.log('📤 Sending direct message with attachments and deliveredAt:', messageData);
    socket.emit('send-message', messageData);

    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    }).then(() => {
      if (onMessageUpdate) {
        onMessageUpdate(messageData);
      }
    }).catch(console.error).finally(() => {
      setUploading(false);
    });
  };

  const handleEditMessage = async () => {
    if (!editText.trim() || !editingMessage) return;

    const updatedMessage = {
      ...editingMessage,
      content: editText.trim(),
      edited: true,
      editedAt: new Date().toISOString(),
    };

    socket.emit('edit-message', {
      roomId,
      timestamp: editingMessage.timestamp,
      senderId: editingMessage.senderId,
      content: editText.trim(),
    });

    try {
      await fetch('/api/chat/messages/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          timestamp: editingMessage.timestamp,
          senderId: editingMessage.senderId,
          content: editText.trim(),
        }),
      });
    } catch (error) {
      console.error('Error editing message:', error);
    }

    setEditingMessage(null);
    setEditText("");
  };

  const handleDeleteMessage = async (message, forEveryone = false) => {
    if (forEveryone) {
      setMessages(prev =>
        prev.map(msg =>
          msg.timestamp === message.timestamp && msg.senderId === message.senderId
            ? { 
                ...msg, 
                deleted: true, 
                content: "This message was deleted", 
                attachments: [],
                deletedAt: new Date().toISOString()
              }
            : msg
        )
      );

      socket.emit('delete-message', {
        roomId,
        timestamp: message.timestamp,
        senderId: message.senderId,
        deleteForEveryone: true,
        isGroupMessage: false,
      });

      try {
        await fetch('/api/chat/messages/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            timestamp: message.timestamp,
            senderId: message.senderId,
            deleteForEveryone: true,
            isGroupMessage: false,
          }),
        });
      } catch (error) {
        console.error('Error deleting message for everyone:', error);
      }
    } else {
      setMessages(prev =>
        prev.filter(msg =>
          !(msg.timestamp === message.timestamp && msg.senderId === message.senderId)
        )
      );

      try {
        await fetch('/api/chat/messages/delete-for-me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            messageId: `${message.roomId}-${message.timestamp}-${message.senderId}`,
            roomId: message.roomId
          }),
        });
      } catch (error) {
        console.error('Error deleting message for me:', error);
      }
    }
    
    setContextMenu(null);
    setSelectedMessage(null);
  };

  const handleReactToMessage = async (message, emoji) => {
    const updatedReactions = message.reactions || [];
    const existingReactionIndex = updatedReactions.findIndex(
      r => r.userId === currentUserId && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      updatedReactions.splice(existingReactionIndex, 1);
    } else {
      updatedReactions.push({
        userId: currentUserId,
        emoji,
        timestamp: new Date().toISOString(),
      });
    }

    socket.emit('react-to-message', {
      roomId,
      timestamp: message.timestamp,
      messageOwnerId: message.senderId,
      reactions: updatedReactions,
    });

    try {
      await fetch('/api/chat/messages/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          timestamp: message.timestamp,
          senderId: message.senderId,
          reactions: updatedReactions,
        }),
      });
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && isConnected && roomJoined && canSendMessages) {
      socket.emit('typing', { roomId, userId: currentUserId, isTyping });
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.length > 0 && canSendMessages) {
      handleTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 1000);
    } else {
      handleTyping(false);
    }
  };

  const handleFileSelect = (e) => {
    // Check if user can send messages before allowing file selection
    if (!canSendMessages) {
      alert(blockStatus.iBlockedThem 
        ? "You have blocked this user. Unblock to send messages."
        : "You cannot send messages to this user because they have blocked you.");
      e.target.value = '';
      return;
    }

    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const fileType = file.type.split('/')[0];
      if (fileType !== 'image' && fileType !== 'video') {
        alert('Only images and videos are allowed!');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      
      setAttachments(prev => [...prev, {
        file,
        preview: previewUrl,
        type: fileType,
        name: file.name,
        size: file.size,
        uploading: false,
      }]);
    });

    setShowAttachments(false);
    e.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    const attachment = attachments[index];
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllAttachments = () => {
    attachments.forEach(att => {
      if (att.preview) {
        URL.revokeObjectURL(att.preview);
      }
    });
    setAttachments([]);
  };

  const handlePreviewPreSend = (attachment, index) => {
    setPreviewPreSendAttachment(attachment);
  };

  const uploadAttachments = async () => {
    const attachmentsToUpload = attachments.filter(att => !att.url && att.file);
    
    if (attachmentsToUpload.length === 0) {
      return attachments;
    }

    setUploading(true);
    
    const uploadedAttachments = [];
    
    for (const att of attachmentsToUpload) {
      const formData = new FormData();
      formData.append('file', att.file);
      formData.append('userId', currentUserId);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          uploadedAttachments.push({
            url: data.url,
            type: data.category,
            name: data.name,
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    setUploading(false);
    return uploadedAttachments;
  };

  const handleAttachmentClick = (attachment, index) => {
    setPreviewAttachment(attachment);
    setCurrentAttachmentIndex(index);
  };

  const handleNextAttachment = () => {
    if (currentAttachmentIndex < allAttachments.length - 1) {
      const nextIndex = currentAttachmentIndex + 1;
      setCurrentAttachmentIndex(nextIndex);
      setPreviewAttachment(allAttachments[nextIndex]);
    }
  };

  const handlePreviousAttachment = () => {
    if (currentAttachmentIndex > 0) {
      const prevIndex = currentAttachmentIndex - 1;
      setCurrentAttachmentIndex(prevIndex);
      setPreviewAttachment(allAttachments[prevIndex]);
    }
  };

  const onEmojiClick = (emojiObject) => {
    if (editingMessage) {
      setEditText(prev => prev + emojiObject.emoji);
    } else {
      setNewMessage(prev => prev + emojiObject.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleMessageLongPress = (e, message) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      x: e.clientX || rect.left + rect.width / 2,
      y: e.clientY || rect.top,
    });
    setSelectedMessage(message);
  };

  const handleMessageRightClick = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
    setSelectedMessage(message);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedMessage(null);
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (messageDate === today) return 'Today';
    if (messageDate === yesterday) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Offline';
    
    const now = new Date();
    const seenDate = new Date(lastSeen);
    const diffMs = now - seenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    
    return `Last seen ${seenDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const renderMessageStatus = (message) => {
    if (message.senderId !== currentUserId) return null;
    
    if (message.read) {
      return <CheckCheck size={16} className="text-blue-500" />;
    } else if (message.delivered) {
      return <CheckCheck size={16} className="text-gray-400" />;
    } else {
      return <Check size={16} className="text-gray-400" />;
    }
  };

  const MessageWrapper = ({ message, children, isOwn }) => {
    const longPressEvent = useLongPress(
      (e) => handleMessageLongPress(e, message),
      null,
      { threshold: 500 }
    );

    return (
      <div
        {...longPressEvent}
        onContextMenu={(e) => handleMessageRightClick(e, message)}
        className="relative group"
      >
        {children}
      </div>
    );
  };

  // Get appropriate block message
  const getBlockMessage = () => {
    if (blockStatus.iBlockedThem) {
      return "You have blocked this user. Unblock to send messages.";
    }
    if (blockStatus.theyBlockedMe) {
      return "You cannot send messages to this user because they have blocked you.";
    }
    return null;
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white rounded-3xl border-[#dadce0] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#f1f3f4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="relative flex-shrink-0">
              {renderAvatar(friend.avatar, friend.userName, "w-10 h-10")}
              {friendOnline && !blockStatus.theyBlockedMe && !blockStatus.iBlockedThem && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
              {(blockStatus.iBlockedThem || blockStatus.theyBlockedMe) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                  <Ban size={10} className="text-white" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#202124] truncate">{friend.userName}</h3>
              <p className="text-xs text-[#5f6368] truncate">
                {blockStatus.iBlockedThem ? (
                  <span className="text-red-600">You blocked this user</span>
                ) : blockStatus.theyBlockedMe ? (
                  <span className="text-red-600">This user blocked you</span>
                ) : friendTyping ? (
                  <span className="text-green-600">typing...</span>
                ) : friendOnline ? (
                  <span className="text-green-600">● Online</span>
                ) : (
                  <span>{formatLastSeen(friendLastSeen)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Info Button */}
            <button
              onClick={() => setShowUserInfo(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="User info"
            >
              <Info size={18} className="text-[#5f6368]" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-red-100 rounded-full transition-colors"
            >
              <X size={18} className="text-red-600" />
            </button>
          </div>
        </div>

        {/* Blocked Banner */}
        {(blockStatus.iBlockedThem || blockStatus.theyBlockedMe) && (
          <div className="bg-red-50 p-3 text-center  border-red-200">
            <p className="text-xs text-red-600 flex items-center justify-center gap-1">
              <Ban size={14} />
              {getBlockMessage()}
            </p>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34A853]"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-[#dadce0] mb-3" />
              <p className="text-[#5f6368]">No messages yet</p>
              <p className="text-sm text-[#5f6368] mt-1">
                {blockStatus.iBlockedThem ? (
                  "You've blocked this user. Unblock to send messages."
                ) : blockStatus.theyBlockedMe ? (
                  "This user has blocked you. You cannot send messages."
                ) : (
                  "Send a message to start chatting!"
                )}
              </p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-[#5f6368]">
                    {date}
                  </span>
                </div>
                
                {dateMessages.map((msg, index) => {
                  const isOwn = msg.senderId === currentUserId;
                  const showAvatar = !isOwn && (
                    index === 0 || 
                    dateMessages[index - 1]?.senderId !== msg.senderId
                  );

                  return (
                    <MessageWrapper key={`${msg.timestamp}-${index}`} message={msg} isOwn={isOwn}>
                      <div
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && showAvatar && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                              {renderAvatar(friend.avatar, friend.userName, "w-6 h-6")}
                              <span className="text-xs text-[#5f6368]">{friend.userName}</span>
                            </div>
                          )}
                          
                          {/* Media attachments */}
                          {msg.attachments && msg.attachments.length > 0 && !msg.deleted && (
                            <div className={`space-y-2 ${msg.content ? 'mb-2' : ''}`}>
                              {msg.attachments.map((att, idx) => {
                                const globalIndex = allAttachments.findIndex(
                                  a => a.url === att.url && a.messageId === msg.timestamp
                                );
                                
                                return (
                                  <div key={idx} className="relative group">
                                    {att.type === 'image' ? (
                                      <div className="relative">
                                        <img
                                          src={att.url}
                                          alt="Attachment"
                                          className="max-w-full rounded-2xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => handleAttachmentClick(att, globalIndex)}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                          <button
                                            onClick={() => handleAttachmentClick(att, globalIndex)}
                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                          >
                                            <Maximize2 size={20} />
                                          </button>
                                        </div>
                                      </div>
                                    ) : att.type === 'video' ? (
                                      <div className="relative">
                                        <video
                                          src={att.url}
                                          className="max-w-full rounded-2xl max-h-64 object-cover cursor-pointer"
                                          onClick={() => handleAttachmentClick(att, globalIndex)}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                          <button
                                            onClick={() => handleAttachmentClick(att, globalIndex)}
                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                          >
                                            <Maximize2 size={20} />
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Text content */}
                          {msg.content && (
                            <div
                              className={`rounded-2xl p-3 ${
                                msg.deleted 
                                  ? 'bg-gray-100 italic text-gray-500'
                                  : isOwn
                                  ? 'bg-zinc-100 text-black rounded-br-none'
                                  : 'bg-white border-[#dadce0] rounded-bl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                                {msg.edited && !msg.deleted && (
                                  <span className="text-xs text-gray-400 ml-2">(edited)</span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className={`text-xs ${isOwn ? 'text-zinc-500' : 'text-[#5f6368]'}`}>
                                  {formatTime(msg.timestamp)}
                                </p>
                                {renderMessageStatus(msg)}
                              </div>
                            </div>
                          )}
                          
                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 -mt-2 px-2">
                              {Object.entries(
                                msg.reactions.reduce((acc, r) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                  return acc;
                                }, {})
                              ).map(([emoji, count]) => (
                                <span
                                  key={emoji}
                                  className="text-xs bg-gray-100 rounded-full px-2 py-1 flex items-center gap-1"
                                >
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-gray-600">{count}</span>}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Timestamp for media-only messages */}
                          {!msg.content && msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex items-center gap-2 mt-1 px-2">
                              <p className={`text-xs ${isOwn ? 'text-right text-[#5f6368]' : 'text-left text-[#5f6368]'}`}>
                                {formatTime(msg.timestamp)}
                              </p>
                              {renderMessageStatus(msg)}
                            </div>
                          )}
                        </div>
                      </div>
                    </MessageWrapper>
                  );
                })}
              </div>
            ))
          )}
          
          {friendTyping && canSendMessages && (
            <div className="flex items-center gap-2">
              {renderAvatar(friend.avatar, friend.userName, "w-6 h-6")}
              <div className="bg-white border border-[#dadce0] rounded-2xl rounded-bl-none p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#5f6368] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-[#5f6368] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-[#5f6368] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Pre-send Attachment Preview */}
        <PreSendAttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
          onClearAll={handleClearAllAttachments}
          onPreview={handlePreviewPreSend}
        />

        {/* Edit Message Bar */}
        {editingMessage && (
          <div className="p-3 bg-blue-50 border-t border-blue-200 flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-blue-600 mb-1">Editing message</p>
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEditMessage();
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-xl focus:ring focus:ring-blue-200 focus:border-blue-400 focus:outline-none text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={handleEditMessage}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              <Send size={18} />
            </button>
            <button
              onClick={() => {
                setEditingMessage(null);
                setEditText("");
              }}
              className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-[#f1f3f4] bg-white relative">
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <div className="relative" ref={attachmentPickerRef}>
              <button
                onClick={() => {
                  if (!canSendMessages) {
                    alert(getBlockMessage());
                    return;
                  }
                  setShowAttachments(!showAttachments);
                  setShowEmojiPicker(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full relative"
                disabled={!isConnected || !roomJoined || editingMessage || !canSendMessages}
              >
                <Paperclip size={20} className={!canSendMessages ? "text-gray-400" : "text-[#5f6368]"} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />
            </div>

            {/* Emoji Button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => {
                  if (!canSendMessages) {
                    alert(getBlockMessage());
                    return;
                  }
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachments(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
                disabled={!isConnected || !roomJoined || !canSendMessages}
              >
                <span className={`text-xl ${!canSendMessages ? 'opacity-50' : ''}`}>😊</span>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
            </div>
            
            {/* Text Input */}
            <input
              type="text"
              value={editingMessage ? editText : newMessage}
              onChange={editingMessage ? (e) => setEditText(e.target.value) : handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && canSendMessages) {
                  e.preventDefault();
                  if (editingMessage) {
                    handleEditMessage();
                  } else if (attachments.length > 0) {
                    handleSendWithAttachments();
                  } else {
                    handleSendMessage();
                  }
                }
              }}
              placeholder={
                !canSendMessages 
                  ? getBlockMessage()
                  : (!isConnected ? "Connecting..." : !roomJoined ? "Joining chat..." : "Type a message...")
              }
              className="flex-1 px-4 py-4 border border-[#dadce0] rounded-3xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none"
              disabled={!isConnected || !roomJoined || uploading || !canSendMessages}
            />
            
            {/* Send Button */}
            <button
              onClick={editingMessage ? handleEditMessage : (attachments.length > 0 ? handleSendWithAttachments : handleSendMessage)}
              disabled={
                editingMessage 
                  ? !editText.trim()
                  : ((!newMessage.trim() && attachments.length === 0) || !isConnected || !roomJoined || uploading || !canSendMessages)
              }
              className="p-2 bg-[#34A853] text-white rounded-full hover:bg-[#2D9249] disabled:bg-gray-200 disabled:text-gray-400 transition-all relative"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          {!isConnected && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full">
                ⚠️ Reconnecting to server...
              </span>
            </div>
          )}
          
          {isConnected && !roomJoined && canSendMessages && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                ⏳ Joining chat room...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Picker Popup */}
      {showAttachments && (
        <div 
          ref={attachmentPickerRef}
          className="absolute bottom-20 left-4 bg-white rounded-2xl shadow-lg border border-[#dadce0] p-2 z-50"
        >
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setShowAttachments(false);
            }}
            className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <ImageIcon size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Image</p>
              <p className="text-xs text-[#5f6368]">Upload images</p>
            </div>
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setShowAttachments(false);
            }}
            className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 rounded-xl text-left"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Video size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Video</p>
              <p className="text-xs text-[#5f6368]">Upload videos</p>
            </div>
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && selectedMessage && (
        <MessageContextMenu
          message={selectedMessage}
          position={contextMenu}
          onClose={closeContextMenu}
          onEdit={() => {
            setEditingMessage(selectedMessage);
            setEditText(selectedMessage.content);
          }}
          onDelete={() => handleDeleteMessage(selectedMessage, false)}
          onDeleteForEveryone={() => handleDeleteMessage(selectedMessage, true)}
          onReact={(emoji) => handleReactToMessage(selectedMessage, emoji)}
          onCopy={handleCopyMessage}
          onMessageInfo={() => handleMessageInfo(selectedMessage)}
          isOwnMessage={selectedMessage.senderId === currentUserId}
        />
      )}

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
        onNext={handleNextAttachment}
        onPrevious={handlePreviousAttachment}
        hasNext={currentAttachmentIndex < allAttachments.length - 1}
        hasPrevious={currentAttachmentIndex > 0}
      />

      {/* Pre-send Attachment Preview Modal */}
      <AttachmentPreviewModal
        isOpen={!!previewPreSendAttachment}
        onClose={() => setPreviewPreSendAttachment(null)}
        attachment={previewPreSendAttachment}
        onNext={() => {}}
        onPrevious={() => {}}
        hasNext={false}
        hasPrevious={false}
      />

      {/* Message Info Modal */}
      <MessageInfoModal
        isOpen={showMessageInfo}
        onClose={() => setShowMessageInfo(false)}
        message={messageInfoData}
        friendName={friend.userName}
      />

      {/* User Info Modal */}
      <UserInfoModal
        isOpen={showUserInfo}
        onClose={() => setShowUserInfo(false)}
        user={friend}
        currentUserId={currentUserId}
        friendshipStatus={friendshipStatus}
        onUnfriend={handleUnfriend}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onSendMessage={handleSendMessageFromInfo}
        blockStatus={blockStatus}
      />
    </>
  );
}