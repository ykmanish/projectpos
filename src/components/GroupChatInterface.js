'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import {
  ChevronLeft,
  X,
  Send,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  Video,
  Maximize2,
  MessageCircle,
  Check,
  CheckCheck,
  UserPlus,
  Users,
  Info,
  Lock,
  Shield
} from "lucide-react";
import { BeanHead } from "beanheads";
import EmojiPicker from 'emoji-picker-react';
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import PreSendAttachmentPreview from "./PreSendAttachmentPreview";
import MessageContextMenu from "./MessageContextMenu";
import MessageInfoModal from "./MessageInfoModal";
import GroupInfoModal from "./GroupInfoModal";
import Avatar from "./Avatar";
import useLongPress from "@/hooks/useLongPress";
import encryptionService from "@/utils/encryptionService";
import GroupEncryptionModal from "./GroupEncryptionModal";

export default function GroupChatInterface({ 
  group, 
  currentUserId, 
  currentUserAvatar, 
  onClose, 
  onMessageUpdate,
  onGroupUpdate 
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupTyping, setGroupTyping] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [groupData, setGroupData] = useState(group);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [groupKey, setGroupKey] = useState(null);
  const [showGroupEncryptionModal, setShowGroupEncryptionModal] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState(new Map());
  
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
  const roomId = group.groupId;

  // Initialize encryption
  useEffect(() => {
    if (group?.groupId && currentUserId) {
      initializeGroupEncryption();
    }
  }, [currentUserId, group?.groupId]);

  const initializeGroupEncryption = async () => {
    try {
      console.log('🔐 Initializing group encryption...');
      
      await encryptionService.initializeKeys(currentUserId);
      
      if (group.members) {
        console.log('🔑 Ensuring all group members have keys...');
        for (const member of group.members) {
          const memberKeyCheck = await fetch(`/api/chat/encryption?userId=${member.userId}&action=my-keys`);
          if (!memberKeyCheck.ok) {
            console.log('🔑 Generating keys for member:', member.userId);
            await fetch('/api/chat/encryption', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: member.userId,
                action: 'generate-keys'
              })
            });
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('✅ All members have keys, getting group key...');
      const key = await encryptionService.getGroupKey(currentUserId, group.groupId);
      
      setGroupKey(key);
      setEncryptionReady(true);
      
      console.log('✅ Group encryption ready');
    } catch (error) {
      console.error('❌ Group encryption failed:', error);
      setEncryptionReady(false);
    }
  };

  // Decrypt all messages when groupKey is available
  useEffect(() => {
    if (groupKey && messages.length > 0) {
      decryptAllMessages();
    }
  }, [groupKey, messages]);

  const decryptAllMessages = async () => {
    const newDecryptedMap = new Map(decryptedMessages);
    
    for (const message of messages) {
      if (message.encryptedContent && !decryptedMessages.has(message.timestamp)) {
        try {
          const decrypted = await encryptionService.decryptMessage(message.encryptedContent, groupKey);
          newDecryptedMap.set(message.timestamp, decrypted);
        } catch (error) {
          console.error('Decryption error:', error);
          newDecryptedMap.set(message.timestamp, '[Decryption failed]');
        }
      }
    }
    
    setDecryptedMessages(newDecryptedMap);
  };

  const canSendMessage = () => {
    if (!groupData.settings?.onlyAdminsCanMessage) return true;
    const member = groupData.members?.find(m => m.userId === currentUserId);
    return member?.role === 'admin';
  };

  const getMemberName = (userId) => {
    const member = groupData.members?.find(m => m.userId === userId);
    return member?.userName || 'Unknown';
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
    if (!socket || !isConnected || !currentUserId || !group?.groupId) {
      setRoomJoined(false);
      return;
    }

    console.log('🔌 Setting up group chat for room:', roomId);
    socket.emit('join-chat', { 
      roomId, 
      userId: currentUserId,
      groupMembers: groupData.members
    });

    const onJoinedRoom = ({ roomId: joinedRoom, success }) => {
      if (success && joinedRoom === roomId) {
        console.log('✅ Successfully joined group room:', roomId);
        setRoomJoined(true);
        fetchMessages();
        markMessagesAsRead();
      }
    };

    const onMessage = (message) => {
      console.log('📩 Group message received:', message);
      if (message.roomId === roomId) {
        // If message has encrypted content and we have group key, pre-decrypt it
        if (message.encryptedContent && groupKey) {
          encryptionService.decryptMessage(message.encryptedContent, groupKey)
            .then(decrypted => {
              setDecryptedMessages(prev => new Map(prev).set(message.timestamp, decrypted));
            })
            .catch(error => {
              console.error('Decryption error:', error);
              setDecryptedMessages(prev => new Map(prev).set(message.timestamp, '[Decryption failed]'));
            });
        }
        
        setMessages(prev => {
          const exists = prev.some(m => 
            m.timestamp === message.timestamp && 
            m.senderId === message.senderId
          );
          if (exists) return prev;
          return [...prev, message];
        });
        
        if (message.senderId !== currentUserId) {
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
        // Clear decrypted cache for updated message
        setDecryptedMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.timestamp);
          return newMap;
        });
      }
    };

    const onMessageDeleted = (data) => {
      console.log('🗑️ Message deleted:', data);
      if (data.roomId === roomId) {
        if (data.deleteForEveryone) {
          setMessages(prev =>
            prev.map(msg =>
              msg.timestamp === data.timestamp && msg.senderId === data.senderId
                ? { ...msg, deleted: true, content: "This message was deleted", attachments: [] }
                : msg
            )
          );
          setDecryptedMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.timestamp);
            return newMap;
          });
        } else {
          setMessages(prev =>
            prev.filter(msg =>
              !(msg.timestamp === data.timestamp && msg.senderId === data.senderId)
            )
          );
          setDecryptedMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.timestamp);
            return newMap;
          });
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
      console.log('✓✓ Group messages marked as read:', data);
      if (data.roomId === roomId && data.userId !== currentUserId) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.senderId === currentUserId) {
              const readBy = msg.readBy || [];
              if (!readBy.includes(data.userId)) {
                readBy.push(data.userId);
              }
              return { ...msg, readBy, read: readBy.length > 0 };
            }
            return msg;
          })
        );
      }
    };

    const onMessageDelivered = (data) => {
      console.log('✓ Group messages delivered:', data);
      if (data.roomId === roomId && data.isGroupMessage) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.senderId === currentUserId && !msg.delivered) {
              return { ...msg, delivered: true, deliveredAt: data.deliveredAt };
            }
            return msg;
          })
        );

        fetch('/api/chat/messages/delivered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: data.roomId,
            deliveredAt: data.deliveredAt,
            isGroupMessage: true
          }),
        }).catch(error => {
          console.error('Error persisting delivered status:', error);
        });
      }
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId !== currentUserId) {
        setGroupTyping(prev => {
          if (isTyping) {
            return [...new Set([...prev, userId])];
          } else {
            return prev.filter(id => id !== userId);
          }
        });
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

    fetchMessages();

    return () => {
      console.log('🧹 Cleaning up group chat listeners');
      socket.off('joined-room', onJoinedRoom);
      socket.off('receive-message', onMessage);
      socket.off('message-updated', onMessageUpdated);
      socket.off('message-deleted', onMessageDeleted);
      socket.off('message-reaction', onMessageReaction);
      socket.off('message-read', onMessageRead);
      socket.off('message-delivered', onMessageDelivered);
      socket.off('user-typing', onTyping);
      
      socket.emit('leave-chat', { roomId, userId: currentUserId });
      setRoomJoined(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, isConnected, group?.groupId, currentUserId, roomId, groupKey]);

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

  const fetchGroupData = async () => {
    try {
      const res = await fetch(`/api/chat/groups?groupId=${group.groupId}&userId=${currentUserId}`);
      const data = await res.json();
      if (data.success) {
        setGroupData(data.group);
        if (onGroupUpdate) {
          onGroupUpdate(data.group);
        }
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      console.log('📖 Calling mark as read API for group:', roomId);
      
      const response = await fetch('/api/chat/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          userId: currentUserId, 
          isGroupMessage: true 
        }),
      });
      
      const data = await response.json();
      console.log('✅ Mark as read response:', data);
      
      if (socket && isConnected) {
        socket.emit('mark-as-read', { 
          roomId, 
          userId: currentUserId, 
          isGroupMessage: true 
        });
      }
      
      if (onMessageUpdate) {
        onMessageUpdate({ roomId, markAsRead: true, isGroup: true });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !socket || !isConnected || !roomJoined || !canSendMessage()) return;

    const now = new Date().toISOString();
    const originalMessage = newMessage.trim();
    
    let encryptedContent = null;
    let contentForDB = originalMessage;
    
    if (encryptionReady && groupKey && originalMessage) {
      try {
        encryptedContent = await encryptionService.encryptMessage(originalMessage, groupKey);
        contentForDB = null;
      } catch (error) {
        console.error('❌ Group encryption failed:', error);
      }
    }
    
    const messageData = {
      roomId,
      senderId: currentUserId,
      senderName: getMemberName(currentUserId),
      receiverId: 'group',
      isGroupMessage: true,
      content: contentForDB,
      encryptedContent: encryptedContent,
      attachments: attachments.map(att => ({
        url: att.url,
        type: att.type,
        name: att.name,
      })),
      timestamp: now,
      delivered: true,
      deliveredAt: now,
      read: false,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: !!encryptedContent
    };

    const localMessage = {
      ...messageData,
      content: originalMessage
    };

    // Pre-decrypt the message for display
    if (encryptedContent && groupKey && originalMessage) {
      setDecryptedMessages(prev => new Map(prev).set(now, originalMessage));
    }

    setMessages(prev => [...prev, localMessage]);
    setNewMessage("");
    setAttachments([]);
    setShowAttachments(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

    console.log('📤 Sending encrypted group message');
    socket.emit('send-message', messageData);

    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    }).then(() => {
      if (onMessageUpdate) {
        onMessageUpdate(localMessage);
      }
    }).catch(console.error);
  };

  const handleSendWithAttachments = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !socket || !isConnected || !roomJoined || !canSendMessage()) return;

    setUploading(true);
    
    const uploadedAttachments = await uploadAttachments();
    
    const existingUploaded = attachments.filter(att => att.url).map(att => ({
      url: att.url,
      type: att.type,
      name: att.name,
    }));
    
    const allUploadedAttachments = [...existingUploaded, ...uploadedAttachments];

    const now = new Date().toISOString();
    const originalMessage = newMessage.trim();

    let encryptedContent = null;
    let contentForDB = originalMessage;
    
    if (encryptionReady && groupKey && originalMessage) {
      try {
        encryptedContent = await encryptionService.encryptMessage(originalMessage, groupKey);
        contentForDB = null;
      } catch (error) {
        console.error('❌ Group encryption failed:', error);
      }
    }

    const messageData = {
      roomId,
      senderId: currentUserId,
      senderName: getMemberName(currentUserId),
      receiverId: 'group',
      isGroupMessage: true,
      content: contentForDB,
      encryptedContent: encryptedContent,
      attachments: allUploadedAttachments,
      timestamp: now,
      delivered: false,
      read: false,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: !!encryptedContent
    };

    const localMessage = {
      ...messageData,
      content: originalMessage
    };

    // Pre-decrypt the message for display
    if (encryptedContent && groupKey && originalMessage) {
      setDecryptedMessages(prev => new Map(prev).set(now, originalMessage));
    }

    setMessages(prev => [...prev, localMessage]);
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

    console.log('📤 Sending encrypted group message with attachments');
    socket.emit('send-message', messageData);

    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    }).then(() => {
      if (onMessageUpdate) {
        onMessageUpdate(localMessage);
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
      isGroupMessage: true,
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
          isGroupMessage: true,
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
      socket.emit('delete-message', {
        roomId,
        timestamp: message.timestamp,
        senderId: message.senderId,
        deleteForEveryone: true,
        isGroupMessage: true,
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
            isGroupMessage: true,
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
            roomId: message.roomId,
            timestamp: message.timestamp,
            senderId: message.senderId,
            isGroupMessage: true,
          }),
        });
      } catch (error) {
        console.error('Error deleting message for me:', error);
      }
    }
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
      isGroupMessage: true,
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
          isGroupMessage: true,
        }),
      });
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && isConnected && roomJoined) {
      socket.emit('typing', { roomId, userId: currentUserId, isTyping });
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.length > 0) {
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

  const handleUpdateSettings = async (updates) => {
    try {
      const res = await fetch('/api/chat/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.groupId,
          userId: currentUserId,
          updates
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroupData(data.group);
        if (onGroupUpdate) {
          onGroupUpdate(data.group);
        }
      }
    } catch (error) {
      console.error('Error updating group settings:', error);
    }
  };

  const handleManageMember = async (targetUserId, action) => {
    try {
      const res = await fetch('/api/chat/groups/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.groupId,
          adminId: currentUserId,
          action,
          targetUserId
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroupData(data.group);
        if (onGroupUpdate) {
          onGroupUpdate(data.group);
        }
      }
    } catch (error) {
      console.error('Error managing member:', error);
    }
  };

  const handleRegenerateInvite = async () => {
    try {
      const res = await fetch('/api/chat/groups/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.groupId,
          userId: currentUserId
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroupData(prev => ({ ...prev, inviteCode: data.inviteCode }));
      }
    } catch (error) {
      console.error('Error regenerating invite code:', error);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const res = await fetch(`/api/chat/groups?groupId=${group.groupId}&userId=${currentUserId}&action=leave`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const res = await fetch(`/api/chat/groups?groupId=${group.groupId}&userId=${currentUserId}&action=delete`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
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
    
    const totalMembers = groupData.members?.length || 0;
    const readByCount = message.readBy?.length || 0;
    const otherMembersCount = totalMembers - 1;
    
    if (readByCount >= otherMembersCount && otherMembersCount > 0) {
      return <CheckCheck size={16} className="text-blue-500" />;
    } 
    else if (message.delivered || readByCount > 0) {
      return <CheckCheck size={16} className="text-gray-400" />;
    } 
    else {
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

  // Get message content (decrypted or plain)
  const getMessageContent = (message) => {
    if (message.deleted) {
      return message.content;
    }
    if (message.encryptedContent) {
      return decryptedMessages.get(message.timestamp) || '';
    }
    return message.content || '';
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white rounded-3xl border-[#dadce0] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#f1f3f4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            {/* Group Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {(() => {
                let groupAvatar = null;
                if (groupData.avatar) {
                  try {
                    groupAvatar = typeof groupData.avatar === 'string' 
                      ? JSON.parse(groupData.avatar) 
                      : groupData.avatar;
                  } catch (e) {
                    console.error('Failed to parse group avatar', e);
                  }
                }

                if (groupAvatar?.beanConfig) {
                  return <BeanHead {...groupAvatar.beanConfig} />;
                } else {
                  const groupName = groupData.groupName || groupData.name || 'Group';
                  return groupName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                }
              })()}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#202124] truncate flex items-center gap-2">
                {groupData.groupName || groupData.name}
                {groupData.settings?.onlyAdminsCanMessage && (
                  <Lock size={14} className="text-[#5f6368]" />
                )}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-[#5f6368]">
                  <Users size={12} />
                  <span>{groupData.members?.length || 0} members</span>
                </div>
                {groupTyping.length > 0 && (
                  <span className="text-green-600">
                    {groupTyping.length === 1 
                      ? `${getMemberName(groupTyping[0])} is typing...`
                      : `${groupTyping.length} people are typing...`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Group Encryption Button */}
            

            <button
              onClick={() => {
                fetchGroupData();
                setShowGroupInfo(true);
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Group info"
            >
              <Info size={18} className="text-[#5f6368]" />
            </button>
            <button
              onClick={() => setShowGroupEncryptionModal(true)}
              className="p-2 bg-green-100 rounded-full transition-colors group relative"
              title="Group is encrypted"
            >
              <ShieldCheck size={18} className="text-green-600" />
              
             
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
            >
              <X size={18} className="text-red-600" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA]" style={{scrollBehavior: 'smooth'}}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34A853]"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-[#dadce0] mb-3" />
              <p className="text-[#5f6368]">No messages yet</p>
              <p className="text-sm text-[#5f6368] mt-1">
                Be the first to send a message!
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
                  const showSenderInfo = !isOwn && (
                    index === 0 || 
                    dateMessages[index - 1]?.senderId !== msg.senderId
                  );
                  const messageContent = getMessageContent(msg);
                  const hasTextContent = messageContent && messageContent.trim().length > 0;

                  return (
                    <MessageWrapper key={`${msg.timestamp}-${index}`} message={msg} isOwn={isOwn}>
                      <div
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 transition-all duration-200 ease-out`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && showSenderInfo && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                              {renderAvatar(
                                groupData.members?.find(m => m.userId === msg.senderId)?.avatar,
                                getMemberName(msg.senderId),
                                "w-6 h-6"
                              )}
                              <span className="text-xs text-[#5f6368]">
                                {msg.senderName || getMemberName(msg.senderId)}
                              </span>
                            </div>
                          )}
                          
                          {/* Media attachments */}
                          {msg.attachments && msg.attachments.length > 0 && !msg.deleted && (
                            <div className={`space-y-2 ${hasTextContent ? 'mb-2' : ''}`}>
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
                          
                          {/* Text content - only show if there's actual text */}
                          {hasTextContent && (
                            <div
                              className={`rounded-2xl p-3 ${
                                msg.deleted 
                                  ? 'bg-gray-100 italic text-gray-500'
                                  : isOwn
                                  ? 'bg-zinc-100 text-black rounded-br-none'
                                  : 'bg-white  border-[#dadce0] rounded-tl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.deleted ? (
                                  msg.content
                                ) : (
                                  messageContent
                                )}
                                {msg.edited && !msg.deleted && (
                                  <span className="text-xs text-gray-400 ml-2">(edited)</span>
                                )}
                              </p>
                            </div>
                          )}
                          
                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 px-2">
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
                          
                          {/* Timestamp and status - always show for all messages */}
                          <div className="flex items-center justify-end gap-1 mt-1 px-2">
                            <p className={`text-xs ${isOwn ? 'text-[#5f6368]' : 'text-[#5f6368]'}`}>
                              {formatTime(msg.timestamp)}
                            </p>
                            {renderMessageStatus(msg)}
                            {/* {msg.isEncrypted && (
                              <Shield size={10} className="text-green-600" />
                            )} */}
                          </div>
                        </div>
                      </div>
                    </MessageWrapper>
                  );
                })}
              </div>
            ))
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
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              <Send size={18} />
            </button>
            <button
              onClick={() => {
                setEditingMessage(null);
                setEditText("");
              }}
              className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-[#f1f3f4] bg-white relative">
          {!canSendMessage() && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-xs flex items-center justify-center text-red-600 bg-red-50 px-3 py-2 rounded-full">
                <Lock size={12} className="inline mr-1" />
                Only admins can send messages in this group
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <div className="relative" ref={attachmentPickerRef}>
              <button
                onClick={() => {
                  setShowAttachments(!showAttachments);
                  setShowEmojiPicker(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full relative transition-colors"
                disabled={!isConnected || !roomJoined || editingMessage || !canSendMessage()}
              >
                <Paperclip size={20} className="text-[#5f6368]" />
              </button>

              {showAttachments && (
                <div className="absolute bottom-16 left-0 bg-white border border-[#dadce0] rounded-2xl shadow-xl z-50 p-3 min-w-[200px]">
                  <div className="space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <ImageIcon size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[#202124]">Send Image</p>
                        <p className="text-xs text-[#5f6368]">Share photos</p>
                      </div>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <Video size={20} className="text-red-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[#202124]">Send Video</p>
                        <p className="text-xs text-[#5f6368]">Share videos</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Emoji Button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachments(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={!isConnected || !roomJoined || !canSendMessage()}
              >
                <span className="text-xl">😊</span>
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-14 left-0 z-50">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width={320}
                    height={400}
                    searchDisabled
                    skinTonesDisabled
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </div>
            
            {/* Text Input */}
            <input
              type="text"
              value={editingMessage ? editText : newMessage}
              onChange={editingMessage ? (e) => setEditText(e.target.value) : handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
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
              placeholder={!isConnected ? "Connecting..." : !roomJoined ? "Joining chat..." : !canSendMessage() ? "Only admins can send messages" : "Type a message..."}
              className="flex-1 px-4 py-3 border border-[#dadce0] rounded-3xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none transition-all"
              disabled={!isConnected || !roomJoined || uploading || !canSendMessage()}
            />
            
            {/* Send Button */}
            <button
              onClick={editingMessage ? handleEditMessage : (attachments.length > 0 ? handleSendWithAttachments : handleSendMessage)}
              disabled={
                editingMessage 
                  ? !editText.trim()
                  : ((!newMessage.trim() && attachments.length === 0) || !isConnected || !roomJoined || uploading || !canSendMessage())
              }
              className="p-3 bg-[#34A853] text-white rounded-full hover:bg-[#2D9249] disabled:bg-gray-200 disabled:text-gray-400 transition-all relative"
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
          
          {isConnected && !roomJoined && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-xs text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                ⏳ Joining group chat...
              </span>
            </div>
          )}
        </div>
      </div>

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
          onMessageInfo={() => {
            setMessageInfoData(selectedMessage);
            setShowMessageInfo(true);
          }}
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
        friendName={groupData.name}
        isGroupMessage={true}
        groupMembers={groupData.members}
      />

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        group={groupData}
        currentUserId={currentUserId}
        onUpdateSettings={handleUpdateSettings}
        onManageMember={handleManageMember}
        onRegenerateInvite={handleRegenerateInvite}
        onLeaveGroup={handleLeaveGroup}
        onDeleteGroup={handleDeleteGroup}
      />

      {/* Group Encryption Modal */}
      <GroupEncryptionModal
        isOpen={showGroupEncryptionModal}
        onClose={() => setShowGroupEncryptionModal(false)}
        group={groupData}
      />
    </>
  );
}