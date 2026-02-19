// components/ChatInterface.js

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
  Ban,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  XCircle,
  Reply,
  CornerDownRight,
} from "lucide-react";
import { BeanHead } from "beanheads";
import EmojiPicker from 'emoji-picker-react';
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import PreSendAttachmentPreview from "./PreSendAttachmentPreview";
import MessageContextMenu from "./MessageContextMenu";
import useLongPress from "@/hooks/useLongPress";
import MessageInfoModal from "./MessageInfoModal";
import UserInfoModal from "./UserInfoModal";
import encryptionService from "@/utils/encryptionService";
import EncryptionVerificationModal from "./EncryptionVerificationModal";
import AIEnhancementModal from "./AIEnhancementModal";
import MessageSearch from "./MessageSearch";
import ReplyPreview from "./ReplyPreview";
import GIFPicker from "./GIFPicker";

export default function ChatInterface({ friend, currentUserId, currentUserAvatar, onClose, onMessageUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendTyping, setFriendTyping] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGIFPicker, setShowGIFPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [friendOnline, setFriendOnline] = useState(false);
  const [friendLastSeen, setFriendLastSeen] = useState(null);
  const [roomJoined, setRoomJoined] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");
  
  // Reply feature states
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  
  // AI Enhancement states
  const [showAIEnhancement, setShowAIEnhancement] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiEnhancedText, setAiEnhancedText] = useState("");
  const [aiError, setAiError] = useState("");
  
  const [blockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false
  });
  
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [sharedSecret, setSharedSecret] = useState(null);
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
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentPickerRef = useRef(null);
  const gifPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const messageRefs = useRef(new Map());
  
  const { socket, isConnected, getUserOnlineStatus, checkUndeliveredMessages } = useSocket();
  const roomId = [currentUserId, friend.userId].sort().join('-');

  const canSendMessages = !blockStatus.iBlockedThem && !blockStatus.theyBlockedMe;

  // Monitor friend's online status
  useEffect(() => {
    if (friend?.userId) {
      const status = getUserOnlineStatus(friend.userId);
      setFriendOnline(status.online);
      setFriendLastSeen(status.lastSeen);
    }
  }, [friend?.userId, getUserOnlineStatus]);

  // Check for undelivered messages when friend comes online
  useEffect(() => {
    if (friendOnline && roomJoined) {
      console.log('👤 Friend came online, checking undelivered messages...');
      // Update all undelivered messages to delivered
      setMessages(prev => 
        prev.map(msg => {
          if (msg.senderId === currentUserId && !msg.delivered) {
            return { 
              ...msg, 
              delivered: true, 
              deliveredAt: new Date().toISOString() 
            };
          }
          return msg;
        })
      );
    }
  }, [friendOnline, roomJoined, currentUserId]);

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (attachmentPickerRef.current && !attachmentPickerRef.current.contains(event.target)) {
        setShowAttachments(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target)) {
        setShowGIFPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize encryption
  useEffect(() => {
    if (friend?.userId && currentUserId) {
      initializeEncryption();
    }
  }, [currentUserId, friend?.userId]);

  const initializeEncryption = async () => {
    try {
      console.log('🔐 Initializing encryption for chat...');
      
      await encryptionService.initializeKeys(currentUserId);
      
      const targetKeyCheck = await fetch(`/api/chat/encryption?userId=${friend.userId}&action=my-keys`);
      if (!targetKeyCheck.ok) {
        console.log('🔑 Generating keys for friend:', friend.userId);
        await fetch('/api/chat/encryption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: friend.userId,
            action: 'generate-keys'
          })
        });
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log('✅ Both users have keys, establishing shared secret...');
      
      const secret = await encryptionService.getSharedSecret(currentUserId, friend.userId);
      setSharedSecret(secret.secret);
      setIsVerified(secret.isVerified);
      setIsEncrypted(true);
      setEncryptionReady(true);
      
      console.log('✅ Encryption ready, verified:', secret.isVerified);
    } catch (error) {
      console.error('❌ Encryption initialization failed:', error);
      setEncryptionReady(false);
    }
  };

  // AI Enhancement functions
  const handleAIEnhance = async (message, prompt) => {
    setIsAIProcessing(true);
    setAiError("");
    setAiEnhancedText("");

    try {
      const response = await fetch("/api/ai/enhance-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          prompt: prompt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAiEnhancedText(data.enhancedMessage);
      } else {
        setAiError(data.error || "Failed to enhance message");
      }
    } catch (error) {
      console.error("AI enhancement error:", error);
      setAiError("Failed to connect to AI service");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleApplyAIEnhancement = (enhancedText) => {
    setNewMessage(enhancedText);
    setShowAIEnhancement(false);
    setAiEnhancedText("");
    setAiError("");
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Decrypt all messages when sharedSecret is available
  useEffect(() => {
    if (sharedSecret && messages.length > 0) {
      decryptAllMessages();
    }
  }, [sharedSecret, messages]);

  const decryptAllMessages = async () => {
    const newDecryptedMap = new Map(decryptedMessages);
    
    for (const message of messages) {
      if (message.encryptedContent && !decryptedMessages.has(message.timestamp)) {
        try {
          let encryptedData = message.encryptedContent;
          if (typeof encryptedData === 'string') {
            try {
              encryptedData = JSON.parse(encryptedData);
            } catch {
              encryptedData = { encrypted: encryptedData, iv: '' };
            }
          }
          
          const decrypted = await encryptionService.decryptMessage(encryptedData, sharedSecret);
          newDecryptedMap.set(message.timestamp, decrypted);
        } catch (error) {
          console.error('Decryption error:', error);
          newDecryptedMap.set(message.timestamp, '[Decryption failed]');
        }
      }
    }
    
    setDecryptedMessages(newDecryptedMap);
  };

  const handleVerificationChange = (verified) => {
    console.log('🔐 Verification status changed:', verified);
    setIsVerified(verified);
  };

  useEffect(() => {
    if (friend?.userId) {
      fetchFriendshipStatus();
      checkBlockStatus();
    }
  }, [friend]);

  const checkBlockStatus = async () => {
    try {
      const iBlockedRes = await fetch(`/api/friends/blocked/check?userId=${currentUserId}&targetId=${friend.userId}`);
      const iBlockedData = await iBlockedRes.json();
      
      const theyBlockedRes = await fetch(`/api/friends/blocked/check?userId=${friend.userId}&targetId=${currentUserId}`);
      const theyBlockedData = await theyBlockedRes.json();
      
      setBlockStatus({
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

  // Reply feature functions
  const handleReplyToMessage = (message) => {
    setReplyingToMessage(message);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
  };

  const handleReplyClick = (replyTo) => {
    const messageId = `${replyTo.timestamp}-${replyTo.senderId}`;
    scrollToMessage(messageId);
    
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.classList.add("highlight-reply-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-reply-message");
      }, 2000);
    }
  };

  // Handle sending GIF directly
  const handleSendGIF = async (gif) => {
    if (!canSendMessages) {
      alert(blockStatus.iBlockedThem 
        ? "You have blocked this user. Unblock to send messages."
        : "You cannot send messages to this user because they have blocked you.");
      return;
    }

    if (!socket || !isConnected || !roomJoined) return;

    const now = new Date().toISOString();
    
    // Prepare reply data if replying to a message
    let replyTo = null;
    if (replyingToMessage && !replyingToMessage.deleted) {
      const replyContent = getMessageContent(replyingToMessage);
      replyTo = {
        messageId: `${replyingToMessage.timestamp}-${replyingToMessage.senderId}`,
        timestamp: replyingToMessage.timestamp,
        senderId: replyingToMessage.senderId,
        senderName: replyingToMessage.senderId === currentUserId ? 'You' : friend.userName,
        content: replyContent,
        hasAttachments: replyingToMessage.attachments && replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type
      };
    }

    let encryptedContent = null;

    // If encryption is enabled, encrypt the message
    if (encryptionReady && sharedSecret) {
      try {
        encryptedContent = await encryptionService.encryptMessage('', sharedSecret);
      } catch (error) {
        console.error('❌ Encryption failed:', error);
      }
    }

    // Create GIF attachment with proper structure
    const gifAttachment = {
      url: gif.images?.fixed_height?.url || gif.url,
      type: 'gif',
      name: gif.title || gif.name || 'GIF',
      gifId: gif.id,
      gifData: gif
    };

    const messageData = {
      roomId,
      senderId: currentUserId,
      receiverId: friend.userId,
      isGroupMessage: false,
      content: null,
      encryptedContent: encryptedContent,
      attachments: [gifAttachment],
      replyTo: replyTo,
      timestamp: now,
      delivered: friendOnline,
      deliveredAt: friendOnline ? now : null,
      read: false,
      readAt: null,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: !!encryptedContent,
    };

    // Create local message with the same structure
    const localMessage = {
      ...messageData,
      content: '',
    };

    setMessages((prev) => [...prev, localMessage]);
    setShowGIFPicker(false);
    setReplyingToMessage(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

    console.log("📤 Sending GIF message to friend");
    socket.emit("send-message", messageData);

    // Save to database
    fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    })
      .then(() => {
        if (onMessageUpdate) {
          onMessageUpdate(localMessage);
        }
      })
      .catch(console.error);
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
            className={`${size} rounded-full overflow-hidden bg-[#e8f0fe] dark:bg-[#232529] flex items-center justify-center`}
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

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
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

  // Socket event handlers
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
        // Process encrypted content if needed
        if (message.encryptedContent && sharedSecret) {
          let encryptedData = message.encryptedContent;
          if (typeof encryptedData === 'string') {
            try {
              encryptedData = JSON.parse(encryptedData);
            } catch {
              encryptedData = { encrypted: encryptedData, iv: '' };
            }
          }

          encryptionService
            .decryptMessage(encryptedData, sharedSecret)
            .then((decrypted) => {
              setDecryptedMessages((prev) =>
                new Map(prev).set(message.timestamp, decrypted)
              );
            })
            .catch((error) => {
              console.error("Decryption error:", error);
              setDecryptedMessages((prev) =>
                new Map(prev).set(
                  message.timestamp,
                  message.content || "[Decryption failed]"
                )
              );
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
      console.log('✓✓ Messages marked as read:', data);
      if (data.roomId === roomId) {
        setMessages(prev =>
          prev.map(msg => {
            // Update messages sent to friend that are now read
            if (msg.senderId === currentUserId && !msg.read) {
              return { ...msg, read: true, readAt: data.readAt };
            }
            return msg;
          })
        );
      }
    };

    const onMessageDelivered = (data) => {
      console.log('✓ Messages delivered:', data);
      if (data.roomId === roomId) {
        setMessages(prev =>
          prev.map(msg => {
            // Update specific message or all messages from this sender
            if (msg.senderId === currentUserId) {
              // If specific timestamp is provided, update only that message
              if (data.timestamp) {
                if (msg.timestamp === data.timestamp && !msg.delivered) {
                  return { ...msg, delivered: true, deliveredAt: data.deliveredAt };
                }
              } 
              // Otherwise update all undelivered messages from current user
              else if (!msg.delivered) {
                return { ...msg, delivered: true, deliveredAt: data.deliveredAt };
              }
            }
            return msg;
          })
        );
      }
    };

    const onUserCameOnline = (data) => {
      console.log('👤 User came online:', data);
      if (data.userId === friend.userId) {
        setFriendOnline(true);
        setFriendLastSeen(data.timestamp);
        
        // Update all undelivered messages to delivered
        setMessages(prev =>
          prev.map(msg => {
            if (msg.senderId === currentUserId && !msg.delivered) {
              return { 
                ...msg, 
                delivered: true, 
                deliveredAt: data.timestamp 
              };
            }
            return msg;
          })
        );
      }
    };

    const onCheckUndelivered = (data) => {
      console.log('🔍 Check undelivered messages:', data);
      if (data.roomId === roomId) {
        // Request status of undelivered messages
        checkUndeliveredMessages(roomId, friend.userId);
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
    socket.on('user-came-online', onUserCameOnline);
    socket.on('check-undelivered-messages', onCheckUndelivered);
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
      socket.off('user-came-online', onUserCameOnline);
      socket.off('check-undelivered-messages', onCheckUndelivered);
      socket.off('user-typing', onTyping);
      socket.off('user-online', onOnline);
      socket.off('user-status-change', onStatusChange);
      
      socket.emit('leave-chat', { roomId, userId: currentUserId });
      setRoomJoined(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, isConnected, friend?.userId, currentUserId, roomId, sharedSecret]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}&userId=${currentUserId}`);
      const data = await res.json();
      if (data.success) {
        // Process messages to ensure correct status
        const processedMessages = data.messages.map(msg => ({
          ...msg,
          // Ensure delivered and read are properly set from database
          delivered: msg.delivered || false,
          read: msg.read || false
        }));
        setMessages(processedMessages);
        console.log(`✅ Loaded ${processedMessages.length} messages`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(
        msg => msg.senderId === friend.userId && !msg.read
      );
      
      if (unreadMessages.length === 0) return;
      
      const response = await fetch('/api/chat/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          userId: currentUserId,
          messageIds: unreadMessages.map(msg => `${msg.roomId}-${msg.timestamp}-${msg.senderId}`)
        }),
      });
      
      const data = await response.json();
      
      if (data.success && socket && isConnected) {
        socket.emit('mark-as-read', { 
          roomId, 
          userId: currentUserId,
          readAt: data.readAt,
          isGroupMessage: false
        });
        
        // Update local messages to read
        setMessages(prev =>
          prev.map(msg =>
            msg.senderId === friend.userId && !msg.read
              ? { ...msg, read: true, readAt: data.readAt }
              : msg
          )
        );
      }
      
      if (onMessageUpdate) {
        onMessageUpdate({ roomId, markAsRead: true });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Function to highlight text in content
  const highlightText = (content, highlight) => {
    if (!highlight.trim() || !content) {
      return content;
    }

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark
            key={index}
            className="bg-green-300 dark:bg-green-600 text-inherit px-0.5 rounded"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    setHighlightedText(query);
    setIsSearching(true);

    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setIsSearching(false);
      return;
    }

    const results = [];
    const searchLower = query.toLowerCase();

    messages.forEach((msg) => {
      const content = getMessageContent(msg);
      if (content && content.toLowerCase().includes(searchLower)) {
        const indices = [];
        let startPos = 0;
        let index;
        const contentLower = content.toLowerCase();
        
        while ((index = contentLower.indexOf(searchLower, startPos)) > -1) {
          indices.push(index);
          startPos = index + searchLower.length;
        }

        results.push({
          messageId: `${msg.timestamp}-${msg.senderId}`,
          message: msg,
          content: content,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
          matchIndices: indices,
          matchCount: indices.length
        });
      }
    });

    results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);

    if (results.length > 0) {
      scrollToMessage(results[0].messageId);
    }

    setIsSearching(false);
  };

  const handleNextSearch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex].messageId);
  };

  const handlePreviousSearch = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex - 1;
    if (prevIndex < 0) {
      setCurrentSearchIndex(searchResults.length - 1);
      scrollToMessage(searchResults[searchResults.length - 1].messageId);
    } else {
      setCurrentSearchIndex(prevIndex);
      scrollToMessage(searchResults[prevIndex].messageId);
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setHighlightedText("");
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };

  const handleSendMessage = async () => {
    if (!canSendMessages) {
      alert(blockStatus.iBlockedThem 
        ? "You have blocked this user. Unblock to send messages."
        : "You cannot send messages to this user because they have blocked you.");
      return;
    }

    if ((!newMessage.trim() && attachments.length === 0) || !socket || !isConnected || !roomJoined) return;

    const now = new Date().toISOString();
    const originalMessage = newMessage.trim();
    
    let encryptedContent = null;
    let contentForDB = originalMessage;
    
    if (encryptionReady && sharedSecret && originalMessage) {
      try {
        encryptedContent = await encryptionService.encryptMessage(originalMessage, sharedSecret);
        contentForDB = null;
      } catch (error) {
        console.error('❌ Encryption failed:', error);
      }
    }

    let replyTo = null;
    if (replyingToMessage && !replyingToMessage.deleted) {
      const replyContent = getMessageContent(replyingToMessage);
      replyTo = {
        messageId: `${replyingToMessage.timestamp}-${replyingToMessage.senderId}`,
        timestamp: replyingToMessage.timestamp,
        senderId: replyingToMessage.senderId,
        senderName: replyingToMessage.senderId === currentUserId ? 'You' : friend.userName,
        content: replyContent,
        hasAttachments: replyingToMessage.attachments && replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type
      };
    }
    
    const messageData = {
      roomId,
      senderId: currentUserId,
      receiverId: friend.userId,
      isGroupMessage: false,
      content: contentForDB,
      encryptedContent: encryptedContent,
      attachments: attachments.map(att => ({
        url: att.url,
        type: att.type,
        name: att.name,
        gifId: att.gifId,
        gifData: att.gifData
      })),
      replyTo: replyTo,
      timestamp: now,
      delivered: friendOnline,
      deliveredAt: friendOnline ? now : null,
      read: false,
      readAt: null,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: !!encryptedContent
    };

    const localMessage = {
      ...messageData,
      content: originalMessage
    };

    if (encryptedContent && sharedSecret && originalMessage) {
      setDecryptedMessages((prev) => new Map(prev).set(now, originalMessage));
    }

    setMessages(prev => [...prev, localMessage]);
    setNewMessage("");
    setAttachments([]);
    setShowAttachments(false);
    setReplyingToMessage(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

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
    const originalMessage = newMessage.trim();
    
    let encryptedContent = null;
    let contentForDB = originalMessage;
    
    if (encryptionReady && sharedSecret && originalMessage) {
      try {
        encryptedContent = await encryptionService.encryptMessage(originalMessage, sharedSecret);
        contentForDB = null;
      } catch (error) {
        console.error('❌ Encryption failed:', error);
      }
    }

    let replyTo = null;
    if (replyingToMessage && !replyingToMessage.deleted) {
      const replyContent = getMessageContent(replyingToMessage);
      replyTo = {
        messageId: `${replyingToMessage.timestamp}-${replyingToMessage.senderId}`,
        timestamp: replyingToMessage.timestamp,
        senderId: replyingToMessage.senderId,
        senderName: replyingToMessage.senderId === currentUserId ? 'You' : friend.userName,
        content: replyContent,
        hasAttachments: replyingToMessage.attachments && replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type
      };
    }
    
    const messageData = {
      roomId,
      senderId: currentUserId,
      receiverId: friend.userId,
      isGroupMessage: false,
      content: contentForDB,
      encryptedContent: encryptedContent,
      attachments: allUploadedAttachments,
      replyTo: replyTo,
      timestamp: now,
      delivered: friendOnline,
      deliveredAt: friendOnline ? now : null,
      read: false,
      readAt: null,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: !!encryptedContent
    };

    const localMessage = {
      ...messageData,
      content: originalMessage
    };

    if (encryptedContent && sharedSecret && originalMessage) {
      setDecryptedMessages((prev) => new Map(prev).set(now, originalMessage));
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
    setReplyingToMessage(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

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
      isGroupMessage: false,
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
          isGroupMessage: false,
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
    
    setDecryptedMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(message.timestamp);
      return newMap;
    });
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
      isGroupMessage: false,
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
          isGroupMessage: false,
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

  // Fixed message status rendering with real-time updates
  const renderMessageStatus = (message) => {
    if (message.senderId !== currentUserId) return null;
    
    // Check if message is read
    if (message.read) {
      return <CheckCheck size={16} className="text-blue-500" title="Read" />;
    } 
    // Check if message is delivered
    else if (message.delivered) {
      return <CheckCheck size={16} className="text-gray-400 dark:text-gray-500" title="Delivered" />;
    } 
    // Message is sent but not delivered
    else {
      return <Check size={16} className="text-gray-400 dark:text-gray-500" title="Sent" />;
    }
  };

  // Render reply preview in a message
  const renderReplyPreview = (replyTo) => {
    if (!replyTo) return null;

    return (
      <div 
        className="mb-2 p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded border-l-4 border-green-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#222222] transition-colors"
        onClick={() => handleReplyClick(replyTo)}
      >
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
          <CornerDownRight size={12} />
          <span>Replying to {replyTo.senderName}</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
          {replyTo.hasAttachments ? (
            <span className="flex items-center gap-1">
              {replyTo.attachmentType === 'image' ? <ImageIcon size={12} /> : 
               replyTo.attachmentType === 'gif' ? <span className="font-bold">GIF</span> :
               <Video size={12} />}
              {replyTo.attachmentType === 'image' ? 'Photo' : 
               replyTo.attachmentType === 'gif' ? 'GIF' : 'Video'}
            </span>
          ) : (
            replyTo.content || ''
          )}
        </div>
      </div>
    );
  };

  const MessageWrapper = ({ message, children, isOwn }) => {
    const longPressEvent = useLongPress(
      (e) => handleMessageLongPress(e, message),
      null,
      { threshold: 500 }
    );

    const isCurrentSearchResult = searchResults[currentSearchIndex]?.messageId === `${message.timestamp}-${message.senderId}`;

    return (
      <div
        ref={el => messageRefs.current.set(`${message.timestamp}-${message.senderId}`, el)}
        {...longPressEvent}
        onContextMenu={(e) => handleMessageRightClick(e, message)}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group transition-all duration-300 ${
          isCurrentSearchResult ? ' ring-green-400 dark:ring-green-500 rounded-lg' : ''
        }`}
      >
        {!message.deleted && isOwn && (
          <button
            onClick={() => handleReplyToMessage(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-[#101010] z-10 mr-2 flex-shrink-0 self-center"
            title="Reply to this message"
          >
            <Reply size={14} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        )}
        
        {children}
        
        {!message.deleted && !isOwn && (
          <button
            onClick={() => handleReplyToMessage(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-[#101010] z-10 ml-2 flex-shrink-0 self-center"
            title="Reply to this message"
          >
            <Reply size={14} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        )}
      </div>
    );
  };

  const getBlockMessage = () => {
    if (blockStatus.iBlockedThem) {
      return "You have blocked this user. Unblock to send messages.";
    }
    if (blockStatus.theyBlockedMe) {
      return "You cannot send messages to this user because they have blocked you.";
    }
    return null;
  };

  const getMessageContent = (message) => {
    if (message.deleted) {
      return message.content;
    }
    if (message.encryptedContent) {
      return decryptedMessages.get(message.timestamp) || message.content || "";
    }
    return message.content || "";
  };

  const dropdownItems = [
    {
      id: 'encryption',
      label: isVerified ? 'Encryption Verified' : 'Encryption Info',
      icon: isVerified ? ShieldCheck : (isEncrypted ? ShieldAlert : Shield),
      onClick: () => {
        setShowDropdown(false);
        setShowEncryptionModal(true);
      },
      className: isVerified 
        ? 'text-green-600 dark:text-green-400' 
        : isEncrypted 
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-gray-600 dark:text-gray-400'
    },
    {
      id: 'user-info',
      label: 'User Info',
      icon: Info,
      onClick: () => {
        setShowDropdown(false);
        setShowUserInfo(true);
      }
    },
    {
      id: 'search',
      label: 'Search Messages',
      icon: Search,
      onClick: () => {
        setShowDropdown(false);
        setShowSearch(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  ];

  return (
    <>
      <div className="h-full flex flex-col bg-white border-none dark:bg-[#0c0c0c] rounded-3xl border dark:border-[#0c0c0c] overflow-hidden transition-colors duration-300">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between bg-white dark:bg-[#0c0c0c]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-[#202124] dark:text-white" />
            </button>
            <div className="relative flex-shrink-0">
              {renderAvatar(friend.avatar, friend.userName, "w-10 h-10")}
              {friendOnline && !blockStatus.theyBlockedMe && !blockStatus.iBlockedThem && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0c0c0c] rounded-full"></span>
              )}
              {(blockStatus.iBlockedThem || blockStatus.theyBlockedMe) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-[#0c0c0c] rounded-full flex items-center justify-center">
                  <Ban size={10} className="text-white" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#202124] dark:text-white truncate">{friend.userName}</h3>
              <p className="text-xs text-[#5f6368] dark:text-gray-400 truncate">
                {blockStatus.iBlockedThem ? (
                  <span className="text-red-600 dark:text-red-400">You blocked this user</span>
                ) : blockStatus.theyBlockedMe ? (
                  <span className="text-red-600 dark:text-red-400">This user blocked you</span>
                ) : friendTyping ? (
                  <span className="text-green-600 dark:text-green-400">typing...</span>
                ) : friendOnline ? (
                  <span className="text-green-600 dark:text-green-400">● Online</span>
                ) : (
                  <span>{formatLastSeen(friendLastSeen)}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
              >
                <MoreVertical size={20} className="text-[#5f6368] dark:text-gray-400" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-2xl shadow-lg z-50 py-2">
                  {dropdownItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors ${item.className || 'text-[#202124] dark:text-white'}`}
                    >
                      <item.icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors"
            >
              <X size={18} className="text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Blocked Banner */}
        {(blockStatus.iBlockedThem || blockStatus.theyBlockedMe) && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 text-center border-b border-red-200 dark:border-red-900/30">
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
              <Ban size={14} />
              {getBlockMessage()}
            </p>
          </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <MessageSearch
            ref={searchInputRef}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onNext={handleNextSearch}
            onPrevious={handlePreviousSearch}
            onClose={handleCloseSearch}
            resultsCount={searchResults.length}
            currentIndex={currentSearchIndex}
            isSearching={isSearching}
          />
        )}

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA] dark:bg-[#000000] transition-colors duration-300"
          style={{scrollBehavior: 'smooth'}}
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34A853]"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-[#dadce0] dark:text-[#232529] mb-3" />
              <p className="text-[#5f6368] dark:text-gray-400">No messages yet</p>
              <p className="text-sm text-[#5f6368] dark:text-gray-500 mt-1">
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
                  <span className="px-3 py-1 bg-gray-200 dark:bg-[#101010] rounded-full text-xs text-[#5f6368] dark:text-gray-400">
                    {date}
                  </span>
                </div>
                
                {dateMessages.map((msg, index) => {
                  const isOwn = msg.senderId === currentUserId;
                  const showAvatar = !isOwn && (
                    index === 0 || 
                    dateMessages[index - 1]?.senderId !== msg.senderId
                  );
                  const messageContent = getMessageContent(msg);
                  const hasTextContent = messageContent && messageContent.trim().length > 0;

                  return (
                    <MessageWrapper key={`${msg.timestamp}-${index}`} message={msg} isOwn={isOwn}>
                      <div
                        className={`max-w-[70%] transition-all duration-200 ease-out mb-2`}
                      >
                          {!isOwn && showAvatar && (
                            <div className="flex items-center gap-2 mb-1 ml-1">
                              {renderAvatar(friend.avatar, friend.userName, "w-6 h-6")}
                              <span className="text-xs text-[#5f6368] dark:text-gray-400">{friend.userName}</span>
                            </div>
                          )}
                          
                          {/* Reply preview if this message is a reply */}
                          {msg.replyTo && renderReplyPreview(msg.replyTo)}
                          
                          {/* Media attachments - including GIFs */}
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
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                          {formatTime(msg.timestamp)}
                                          <span className="ml-1">{renderMessageStatus(msg)}</span>
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
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                                          <span>{formatTime(msg.timestamp)}</span>
                                          {renderMessageStatus(msg)}
                                        </div>
                                      </div>
                                    ) : att.type === 'gif' ? (
                                      <div className="relative">
                                        <img
                                          src={att.url}
                                          alt={att.name || 'GIF'}
                                          className="max-w-full rounded-2xl max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => handleAttachmentClick(att, globalIndex)}
                                          loading="lazy"
                                        />
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                          GIF
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                          <button
                                            onClick={() => handleAttachmentClick(att, globalIndex)}
                                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                          >
                                            <Maximize2 size={20} />
                                          </button>
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                                          <span>{formatTime(msg.timestamp)}</span>
                                          {renderMessageStatus(msg)}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Text content with highlighting */}
                          {hasTextContent && (
                            <div
                              className={`rounded-2xl p-3 ${
                                msg.deleted 
                                  ? 'bg-gray-100 dark:bg-[#101010] italic text-gray-500 dark:text-gray-400'
                                  : isOwn
                                  ? 'bg-zinc-100 dark:bg-[#181A1E] text-black dark:text-white rounded-br-none'
                                  : 'bg-white dark:bg-[#101010] border-[#dadce0] dark:text-white dark:border-[#232529] rounded-tl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.deleted ? (
                                  msg.content
                                ) : (
                                  highlightedText ? highlightText(messageContent, highlightedText) : messageContent
                                )}
                                {msg.edited && !msg.deleted && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(edited)</span>
                                )}
                              </p>
                              {/* Time and status inside text bubble */}
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <p className={`text-[10px] ${isOwn ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                  {formatTime(msg.timestamp)}
                                </p>
                                {renderMessageStatus(msg)}
                              </div>
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
                                  className="text-xs bg-gray-100 dark:bg-[#101010] z-50 rounded-full px-2 py-1 flex items-center gap-1"
                                >
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-gray-600 dark:text-gray-400">{count}</span>}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </MessageWrapper>
                  );
                })}
              </div>
            ))
          )}
          
          {friendTyping && canSendMessages && (
            <div className="flex items-center gap-2 transition-all duration-200 ease-in">
              {renderAvatar(friend.avatar, friend.userName, "w-6 h-6")}
              <div className="bg-white dark:bg-[#101010] border border-[#dadce0] dark:border-[#232529] rounded-2xl rounded-bl-none p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#5f6368] dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-[#5f6368] dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-[#5f6368] dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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

        {/* Reply Preview Bar */}
        {replyingToMessage && !replyingToMessage.deleted && (
          <ReplyPreview
            message={replyingToMessage}
            friendName={friend.userName}
            currentUserId={currentUserId}
            onCancel={handleCancelReply}
            getMessageContent={getMessageContent}
          />
        )}

        {/* Edit Message Bar */}
        {editingMessage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-900/30 flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Editing message</p>
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
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 focus:outline-none text-sm"
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
              className="p-2 bg-gray-200 dark:bg-[#232529] text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-[#181A1E] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-[#f1f3f4] dark:border-[#181A1E] bg-white dark:bg-[#0c0c0c] relative">
          <div className="flex items-center gap-2">
            {/* AI Enhancement Button */}
            <button
              onClick={() => {
                if (!canSendMessages) {
                  alert(getBlockMessage());
                  return;
                }
                setShowAIEnhancement(true);
              }}
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors relative group"
              title="Enhance with AI"
              disabled={!isConnected || !roomJoined || !canSendMessages}
            >
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
              {newMessage.trim() && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              )}
            </button>

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
                  setShowGIFPicker(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full relative transition-colors"
                disabled={!isConnected || !roomJoined || editingMessage || !canSendMessages}
              >
                <Paperclip size={20} className={!canSendMessages ? "text-gray-400 dark:text-gray-600" : "text-[#5f6368] dark:text-gray-400"} />
              </button>

              {/* Attachment Picker Popup */}
              {showAttachments && (
                <div className="absolute bottom-16 left-0 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-3xl z-50 p-3 min-w-[200px] shadow-lg">
                  <div className="space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <ImageIcon size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[#202124] dark:text-white">Send Image</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-400">Share photos</p>
                      </div>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                        <Video size={20} className="text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[#202124] dark:text-white">Send Video</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-400">Share videos</p>
                      </div>
                    </button>

                    {/* GIF Button */}
                    <button
                      onClick={() => {
                        setShowGIFPicker(true);
                        setShowAttachments(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">GIF</span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-[#202124] dark:text-white">Send GIF</p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-400">Animated GIFs</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                multiple
                className="hidden"
              />
            </div>

            {/* GIF Picker */}
            {showGIFPicker && (
              <div 
                ref={gifPickerRef}
                className="absolute bottom-20 left-0 z-50"
              >
                <GIFPicker
                  onSelect={handleSendGIF}
                  onClose={() => setShowGIFPicker(false)}
                />
              </div>
            )}

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
                  setShowGIFPicker(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
                disabled={!isConnected || !roomJoined || !canSendMessages}
              >
                <span className={`text-xl ${!canSendMessages ? 'opacity-50' : ''}`}>😊</span>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker 
                    onEmojiClick={onEmojiClick}
                    theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  />
                </div>
              )}
            </div>
            
            {/* Text Input */}
            <input
              ref={inputRef}
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
                  : (!isConnected ? "Connecting..." : !roomJoined ? "Joining chat..." : "Type a message... (✨ for AI, 📷 for GIF)")
              }
              className="flex-1 px-4 py-3 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-3xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none transition-all"
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
              className="p-3 bg-[#34A853] text-white rounded-full hover:bg-[#2D9249] disabled:bg-gray-200 dark:disabled:bg-[#232529] disabled:text-gray-400 dark:disabled:text-gray-600 transition-all relative"
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
              <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full">
                ⚠️ Reconnecting to server...
              </span>
            </div>
          )}
          
          {isConnected && !roomJoined && canSendMessages && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                ⏳ Joining chat room...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Enhancement Modal */}
      <AIEnhancementModal
        isOpen={showAIEnhancement}
        onClose={() => {
          setShowAIEnhancement(false);
          setAiEnhancedText("");
          setAiError("");
        }}
        originalMessage={newMessage}
        onEnhance={handleAIEnhance}
        onApply={handleApplyAIEnhancement}
        isProcessing={isAIProcessing}
        enhancedText={aiEnhancedText}
        error={aiError}
      />

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
          onReply={() => {
            handleReplyToMessage(selectedMessage);
            closeContextMenu();
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

      {/* Encryption Verification Modal */}
      <EncryptionVerificationModal
        isOpen={showEncryptionModal}
        onClose={() => setShowEncryptionModal(false)}
        friend={friend}
        currentUserId={currentUserId}
        isVerified={isVerified}
        onVerificationChange={handleVerificationChange}
      />

      {/* Add CSS styles for highlighting */}
      <style jsx>{`
        mark {
          background-color: #fbbf24;
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
        
        .dark mark {
          background-color: rgba(245, 158, 11, 0.5);
        }
        
        .highlight-message {
          animation: highlight-pulse 2s ease-in-out;
        }
        
        .highlight-reply-message {
          animation: highlight-reply-pulse 2s ease-in-out;
        }
        
        @keyframes highlight-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
            background-color: rgba(245, 158, 11, 0.1);
          }
        }
        
        @keyframes highlight-reply-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
            background-color: rgba(59, 130, 246, 0.1);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}