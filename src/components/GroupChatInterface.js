// components/GroupChatInterface.js

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
  Users,
  Settings2,
  Lock,
  AtSign,
  UserPlus,
  Sparkles,
  Snowflake,
  MoreVertical,
  Search,
  ArrowUp,
  ArrowDown,
  XCircle,
  Reply,
  CornerDownRight,
} from "lucide-react";
import { BeanHead } from "beanheads";
import EmojiPicker from "emoji-picker-react";
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import PreSendAttachmentPreview from "./PreSendAttachmentPreview";
import MessageContextMenu from "./MessageContextMenu";
import MessageInfoModal from "./MessageInfoModal";
import GroupInfoModal from "./GroupInfoModal";
import Avatar from "./Avatar";
import useLongPress from "@/hooks/useLongPress";
import encryptionService from "@/utils/encryptionService";
import GroupEncryptionModal from "./GroupEncryptionModal";
import MentionSuggestions from "./MentionSuggestions";
import AIEnhancementModal from "./AIEnhancementModal";
import SlowModeModal from "./SlowModeModal";
import SlowModeBadge from "./SlowModeBadge";
import { useSlowMode } from "@/hooks/useSlowMode";
import MessageSearch from "./MessageSearch";
import ReplyPreview from "./ReplyPreview"; // We'll create this component

export default function GroupChatInterface({
  group,
  currentUserId,
  currentUserAvatar,
  onClose,
  onMessageUpdate,
  onGroupUpdate,
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
  const [showSlowModeModal, setShowSlowModeModal] = useState(false);
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

  // Check if current user is admin
  const isCurrentUserAdmin = groupData.members?.find(m => m.userId === currentUserId)?.role === 'admin';

  // Slow mode settings
  const [slowModeSettings, setSlowModeSettings] = useState({
    enabled: group?.settings?.slowMode?.enabled || false,
    cooldown: group?.settings?.slowMode?.cooldown || 30
  });

  // Initialize slow mode hook with userId for persistence and admin status
  const {
    slowMode: localSlowMode,
    cooldownActive,
    timeRemaining,
    canSendMessage: canSendInSlowMode,
    registerMessageSent,
    updateSlowMode: updateLocalSlowMode,
    resetCooldown
  } = useSlowMode(slowModeSettings, currentUserId, isCurrentUserAdmin);

  // AI Enhancement states
  const [showAIEnhancement, setShowAIEnhancement] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiEnhancedText, setAiEnhancedText] = useState("");
  const [aiError, setAiError] = useState("");

  // Mention states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [filteredMembers, setFilteredMembers] = useState([]);

  const [encryptionReady, setEncryptionReady] = useState(false);
  const [groupKey, setGroupKey] = useState(null);
  const [showGroupEncryptionModal, setShowGroupEncryptionModal] =
    useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState(new Map());

  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [messageInfoData, setMessageInfoData] = useState(null);

  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [allAttachments, setAllAttachments] = useState([]);

  const [previewPreSendAttachment, setPreviewPreSendAttachment] =
    useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  // New state for join notifications
  const [joinNotifications, setJoinNotifications] = useState([]);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const messageRefs = useRef(new Map());
  const replyMessageRefs = useRef(new Map());

  const { socket, isConnected } = useSocket();
  const roomId = group.groupId;

  // Initialize encryption
  useEffect(() => {
    if (group?.groupId && currentUserId) {
      initializeGroupEncryption();
    }
  }, [currentUserId, group?.groupId]);

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initializeGroupEncryption = async () => {
    try {
      console.log("🔐 Initializing group encryption...");

      await encryptionService.initializeKeys(currentUserId);

      if (group.members) {
        console.log("🔑 Ensuring all group members have keys...");
        for (const member of group.members) {
          try {
            await fetch(
              `/api/chat/encryption?userId=${member.userId}&action=my-keys`,
            );
          } catch (error) {
            console.log("⚠️ Member may need keys:", member.userId);
          }
        }
      }

      console.log("✅ Getting group key...");
      const key = await encryptionService.getGroupKey(
        currentUserId,
        group.groupId,
      );

      setGroupKey(key);
      setEncryptionReady(true);

      console.log("✅ Group encryption ready");
    } catch (error) {
      console.error("❌ Group encryption failed:", error);
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
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
      if (
        message.encryptedContent &&
        !decryptedMessages.has(message.timestamp)
      ) {
        try {
          let encryptedData = message.encryptedContent;
          if (typeof encryptedData === "string") {
            try {
              encryptedData = JSON.parse(encryptedData);
            } catch {
              encryptedData = { encrypted: encryptedData, iv: "" };
            }
          }

          const decrypted = await encryptionService.decryptMessage(
            encryptedData,
            groupKey,
          );
          newDecryptedMap.set(message.timestamp, decrypted);
        } catch (error) {
          console.error("Decryption error:", error);
          newDecryptedMap.set(
            message.timestamp,
            message.content || "[Decryption failed]",
          );
        }
      }
    }

    setDecryptedMessages(newDecryptedMap);
  };

  // Updated canSendMessage function with admin bypass
  const canSendMessage = useCallback(() => {
    // Check if user is admin - admins bypass all restrictions
    if (isCurrentUserAdmin) return true;
    
    // Check admin message permission first (only if not admin)
    if (groupData.settings?.onlyAdminsCanMessage) {
      return false;
    }
    
    // Then check slow mode
    if (!canSendInSlowMode()) {
      return false;
    }
    
    return true;
  }, [groupData.settings?.onlyAdminsCanMessage, isCurrentUserAdmin, canSendInSlowMode]);

  const getMemberName = (userId) => {
    const member = groupData.members?.find((m) => m.userId === userId);
    return member?.userName || "Unknown";
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = (messageId) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Add a temporary highlight effect to the message container
      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, joinNotifications]);

  useEffect(() => {
    const attachments = [];
    messages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          attachments.push({
            ...att,
            messageId: msg.timestamp,
            senderId: msg.senderId,
          });
        });
      }
    });
    setAllAttachments(attachments);
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current &&
        emojiPickerRef.current.contains(event.target)
      ) {
        return;
      }

      if (
        attachmentPickerRef.current &&
        attachmentPickerRef.current.contains(event.target)
      ) {
        return;
      }

      const mentionElement = document.querySelector(".mention-suggestions");
      if (mentionElement && mentionElement.contains(event.target)) {
        return;
      }

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        attachmentPickerRef.current &&
        !attachmentPickerRef.current.contains(event.target)
      ) {
        setShowAttachments(false);
      }

      if (mentionElement && !mentionElement.contains(event.target)) {
        setShowMentions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !currentUserId || !group?.groupId) {
      setRoomJoined(false);
      return;
    }

    console.log("🔌 Setting up group chat for room:", roomId);
    socket.emit("join-chat", {
      roomId,
      userId: currentUserId,
      groupMembers: groupData.members,
    });

    const onJoinedRoom = ({ roomId: joinedRoom, success }) => {
      if (success && joinedRoom === roomId) {
        console.log("✅ Successfully joined group room:", roomId);
        setRoomJoined(true);
        fetchMessages();
        markMessagesAsRead();
      }
    };

    const onMemberJoined = (data) => {
      console.log("👋 Member joined group:", data);

      // Add join notification
      const notification = {
        id: `join-${data.timestamp}`,
        type: "join",
        userId: data.userId,
        userName: data.userName,
        timestamp: data.timestamp,
      };

      setJoinNotifications((prev) => [...prev, notification]);

      // Update group data with new member
      setGroupData((prev) => {
        if (!prev) return prev;

        // Check if member already exists
        const memberExists = prev.members?.some(
          (m) => m.userId === data.userId,
        );
        if (memberExists) return prev;

        const newMember = {
          userId: data.userId,
          userName: data.userName,
          username: data.username,
          avatar: data.avatar,
          role: "member",
          joinedAt: data.timestamp,
        };

        const updatedMembers = [...(prev.members || []), newMember];

        return {
          ...prev,
          members: updatedMembers,
        };
      });

      // Remove notification after 5 seconds
      setTimeout(() => {
        setJoinNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }, 5000);

      // Important: Re-fetch messages for the new member to get decryption keys
      if (data.userId === currentUserId) {
        console.log("🔄 This user just joined, re-initializing encryption...");
        initializeGroupEncryption().then(() => {
          fetchMessages();
        });
      }
    };

    const onMessage = (message) => {
      console.log("📩 Group message received:", message);
      if (message.roomId === roomId) {
        // Only add message if it's after user joined
        const userJoinTime = groupData.members?.find(
          (m) => m.userId === currentUserId,
        )?.joinedAt;
        if (userJoinTime && message.timestamp > userJoinTime) {
          if (message.encryptedContent && groupKey) {
            let encryptedData = message.encryptedContent;
            if (typeof encryptedData === "string") {
              try {
                encryptedData = JSON.parse(encryptedData);
              } catch {
                encryptedData = { encrypted: encryptedData, iv: "" };
              }
            }

            encryptionService
              .decryptMessage(encryptedData, groupKey)
              .then((decrypted) => {
                setDecryptedMessages((prev) =>
                  new Map(prev).set(message.timestamp, decrypted),
                );
              })
              .catch((error) => {
                console.error("Decryption error:", error);
                setDecryptedMessages((prev) =>
                  new Map(prev).set(
                    message.timestamp,
                    message.content || "[Decryption failed]",
                  ),
                );
              });
          }

          setMessages((prev) => {
            const exists = prev.some(
              (m) =>
                m.timestamp === message.timestamp &&
                m.senderId === message.senderId,
            );
            if (exists) return prev;
            return [...prev, message];
          });
        }

        if (message.senderId !== currentUserId) {
          setTimeout(() => markMessagesAsRead(), 500);
        }

        if (onMessageUpdate) {
          onMessageUpdate(message);
        }
      }
    };

    const onMessageUpdated = (data) => {
      console.log("📝 Message updated:", data);
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.timestamp === data.timestamp && msg.senderId === data.senderId
              ? { ...msg, ...data }
              : msg,
          ),
        );
        setDecryptedMessages((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.timestamp);
          return newMap;
        });
      }
    };

    const onMessageDeleted = (data) => {
      console.log("🗑️ Message deleted:", data);
      if (data.roomId === roomId) {
        if (data.deleteForEveryone) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.timestamp === data.timestamp && msg.senderId === data.senderId
                ? {
                    ...msg,
                    deleted: true,
                    content: "This message was deleted",
                    attachments: [],
                  }
                : msg,
            ),
          );
          setDecryptedMessages((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.timestamp);
            return newMap;
          });
        } else {
          setMessages((prev) =>
            prev.filter(
              (msg) =>
                !(
                  msg.timestamp === data.timestamp &&
                  msg.senderId === data.senderId
                ),
            ),
          );
          setDecryptedMessages((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.timestamp);
            return newMap;
          });
        }
      }
    };

    const onMessageReaction = (data) => {
      console.log("😊 Message reaction:", data);
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.timestamp === data.timestamp &&
            msg.senderId === data.messageOwnerId
              ? { ...msg, reactions: data.reactions }
              : msg,
          ),
        );
      }
    };

    const onMessageRead = (data) => {
      console.log("✓✓ Group messages marked as read:", data);
      if (data.roomId === roomId && data.userId !== currentUserId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.senderId === currentUserId) {
              const readBy = msg.readBy || [];
              if (!readBy.includes(data.userId)) {
                readBy.push(data.userId);
              }
              return { ...msg, readBy, read: readBy.length > 0 };
            }
            return msg;
          }),
        );
      }
    };

    const onMessageDelivered = (data) => {
      console.log("✓ Group messages delivered:", data);
      if (data.roomId === roomId && data.isGroupMessage) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.senderId === currentUserId && !msg.delivered) {
              return { ...msg, delivered: true, deliveredAt: data.deliveredAt };
            }
            return msg;
          }),
        );
      }
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId !== currentUserId) {
        setGroupTyping((prev) => {
          if (isTyping) {
            return [...new Set([...prev, userId])];
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      }
    };

    socket.on("joined-room", onJoinedRoom);
    socket.on("member-joined", onMemberJoined);
    socket.on("receive-message", onMessage);
    socket.on("message-updated", onMessageUpdated);
    socket.on("message-deleted", onMessageDeleted);
    socket.on("message-reaction", onMessageReaction);
    socket.on("message-read", onMessageRead);
    socket.on("message-delivered", onMessageDelivered);
    socket.on("user-typing", onTyping);

    fetchMessages();

    return () => {
      console.log("🧹 Cleaning up group chat listeners");
      socket.off("joined-room", onJoinedRoom);
      socket.off("member-joined", onMemberJoined);
      socket.off("receive-message", onMessage);
      socket.off("message-updated", onMessageUpdated);
      socket.off("message-deleted", onMessageDeleted);
      socket.off("message-reaction", onMessageReaction);
      socket.off("message-read", onMessageRead);
      socket.off("message-delivered", onMessageDelivered);
      socket.off("user-typing", onTyping);

      socket.emit("leave-chat", { roomId, userId: currentUserId });
      setRoomJoined(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    socket,
    isConnected,
    group?.groupId,
    currentUserId,
    roomId,
    groupKey,
    groupData.members,
  ]);

  const shareGroupKeyWithNewMember = useCallback(
    async (newMemberId) => {
      try {
        if (!encryptionReady || !groupKey) {
          console.log("⚠️ Cannot share group key - encryption not ready");
          return;
        }

        console.log("🔐 Sharing group key with new member:", newMemberId);

        const response = await fetch("/api/chat/encryption/share-group-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: roomId,
            currentUserId,
            newMemberId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log("✅ Group key shared successfully");
        } else {
          console.log("⚠️ Failed to share group key:", data.error);
        }
      } catch (error) {
        console.error("Error sharing group key:", error);
      }
    },
    [encryptionReady, groupKey, currentUserId, roomId],
  );

  const fetchMessages = async () => {
    try {
      const userJoinTime = groupData.members?.find(
        (m) => m.userId === currentUserId,
      )?.joinedAt;
      let url = `/api/chat/messages?roomId=${roomId}&userId=${currentUserId}`;

      // Only fetch messages after user joined
      if (userJoinTime) {
        url += `&after=${userJoinTime}`;
        console.log(`🔍 Fetching messages after: ${userJoinTime}`);
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        console.log(`✅ Loaded ${data.messages.length} messages`);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupData = async () => {
    try {
      const res = await fetch(
        `/api/chat/groups?groupId=${group.groupId}&userId=${currentUserId}`,
      );
      const data = await res.json();
      if (data.success) {
        setGroupData(data.group);
        if (onGroupUpdate) {
          onGroupUpdate(data.group);
        }
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      console.log("📖 Calling mark as read API for group:", roomId);

      const response = await fetch("/api/chat/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          userId: currentUserId,
          isGroupMessage: true,
        }),
      });

      const data = await response.json();
      console.log("✅ Mark as read response:", data);

      if (socket && isConnected) {
        socket.emit("mark-as-read", {
          roomId,
          userId: currentUserId,
          isGroupMessage: true,
        });
      }

      if (onMessageUpdate) {
        onMessageUpdate({ roomId, markAsRead: true, isGroup: true });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Reply feature functions
  const handleReplyToMessage = (message) => {
    setReplyingToMessage(message);
    // Focus on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
  };

  const handleReplyClick = (replyTo) => {
    // Scroll to the original message
    const messageId = `${replyTo.timestamp}-${replyTo.senderId}`;
    scrollToMessage(messageId);
    
    // Highlight the message briefly
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.classList.add("highlight-reply-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-reply-message");
      }, 2000);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && textAfterAt.length > 0) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);

        const filtered =
          groupData.members?.filter(
            (member) =>
              member.userId !== currentUserId &&
              (member.userName
                ?.toLowerCase()
                .includes(textAfterAt.toLowerCase()) ||
                member.username
                  ?.toLowerCase()
                  .includes(textAfterAt.toLowerCase())),
          ) || [];

        setFilteredMembers(filtered);
        setShowMentions(filtered.length > 0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    if (value.length > 0) {
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

  const handleTyping = (isTyping) => {
    if (socket && isConnected && roomJoined) {
      socket.emit("typing", { roomId, userId: currentUserId, isTyping });
    }
  };

  const handleSelectMention = (member) => {
    console.log("🎯 Handling mention selection for:", member);

    if (mentionStartIndex === -1) {
      console.log("❌ No mention start index found");
      return;
    }

    try {
      const beforeMention = newMessage.substring(0, mentionStartIndex);
      const afterMention = newMessage.substring(
        mentionStartIndex + mentionQuery.length + 1,
      );

      const mentionText = `@[${member.userName}](${member.userId}) `;
      const newText = beforeMention + mentionText + afterMention;

      console.log("📝 Updating message with mention:", {
        beforeMention,
        mentionText,
        afterMention,
      });

      setNewMessage(newText);
      setShowMentions(false);
      setMentionQuery("");
      setMentionStartIndex(-1);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = beforeMention.length + mentionText.length;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          console.log("👆 Input focused, cursor at position:", newCursorPos);
        }
      }, 10);
    } catch (error) {
      console.error("Error inserting mention:", error);
      setShowMentions(false);
    }
  };

  const parseMessageContent = (content) => {
    if (!content) return [];

    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: "mention",
        name: match[1],
        userId: match[2],
        content: `@${match[1]}`,
      });

      lastIndex = mentionRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex),
      });
    }

    return parts;
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
        // Find all occurrences of the search term
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

    // Sort results by timestamp (oldest first for better navigation)
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

  // Updated handleSendMessage with reply and slow mode
  const handleSendMessage = async () => {
    if (
      (!newMessage.trim() && attachments.length === 0) ||
      !socket ||
      !isConnected ||
      !roomJoined ||
      !canSendMessage()
    )
      return;

    // Register message sent for slow mode (only if not admin)
    if (!isCurrentUserAdmin) {
      registerMessageSent();
    }

    const now = new Date().toISOString();
    const originalMessage = newMessage.trim();

    // Prepare reply data if replying to a message
    let replyTo = null;
    if (replyingToMessage && !replyingToMessage.deleted) {
      const replyContent = getMessageContent(replyingToMessage);
      replyTo = {
        messageId: `${replyingToMessage.timestamp}-${replyingToMessage.senderId}`,
        timestamp: replyingToMessage.timestamp,
        senderId: replyingToMessage.senderId,
        senderName: replyingToMessage.senderId === currentUserId ? 'You' : getMemberName(replyingToMessage.senderId),
        content: replyContent,
        hasAttachments: replyingToMessage.attachments && replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type
      };
    }

    let contentForDB = originalMessage;
    let encryptedContent = null;

    if (encryptionReady && groupKey && originalMessage) {
      try {
        encryptedContent = await encryptionService.encryptMessage(
          originalMessage,
          groupKey,
        );
        contentForDB = null;
      } catch (error) {
        console.error("❌ Group encryption failed:", error);
        contentForDB = originalMessage;
      }
    }

    const messageData = {
      roomId,
      senderId: currentUserId,
      senderName: getMemberName(currentUserId),
      receiverId: "group",
      isGroupMessage: true,
      content: contentForDB,
      encryptedContent: encryptedContent,
      attachments: attachments.map((att) => ({
        url: att.url,
        type: att.type,
        name: att.name,
      })),
      replyTo: replyTo, // Add reply information
      timestamp: now,
      delivered: true,
      deliveredAt: now,
      read: false,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: !!encryptedContent,
    };

    const localMessage = {
      ...messageData,
      content: originalMessage,
    };

    if (encryptedContent && groupKey && originalMessage) {
      setDecryptedMessages((prev) => new Map(prev).set(now, originalMessage));
    }

    setMessages((prev) => [...prev, localMessage]);
    setNewMessage("");
    setAttachments([]);
    setShowAttachments(false);
    setReplyingToMessage(null); // Clear reply after sending

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

    console.log("📤 Sending encrypted group message");
    socket.emit("send-message", messageData);

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

  // Updated handleSendWithAttachments with reply and slow mode
  const handleSendWithAttachments = async () => {
    if (
      (!newMessage.trim() && attachments.length === 0) ||
      !socket ||
      !isConnected ||
      !roomJoined ||
      !canSendMessage()
    )
      return;

    // Register message sent for slow mode (only if not admin)
    if (!isCurrentUserAdmin) {
      registerMessageSent();
    }

    setUploading(true);

    const uploadedAttachments = await uploadAttachments();

    const existingUploaded = attachments
      .filter((att) => att.url)
      .map((att) => ({
        url: att.url,
        type: att.type,
        name: att.name,
      }));

    const allUploadedAttachments = [
      ...existingUploaded,
      ...uploadedAttachments,
    ];

    const now = new Date().toISOString();
    const originalMessage = newMessage.trim();

    // Prepare reply data if replying to a message
    let replyTo = null;
    if (replyingToMessage && !replyingToMessage.deleted) {
      const replyContent = getMessageContent(replyingToMessage);
      replyTo = {
        messageId: `${replyingToMessage.timestamp}-${replyingToMessage.senderId}`,
        timestamp: replyingToMessage.timestamp,
        senderId: replyingToMessage.senderId,
        senderName: replyingToMessage.senderId === currentUserId ? 'You' : getMemberName(replyingToMessage.senderId),
        content: replyContent,
        hasAttachments: replyingToMessage.attachments && replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type
      };
    }

    let encryptedContent = null;
    let contentForDB = originalMessage;

    if (encryptionReady && groupKey && originalMessage) {
      try {
        encryptedContent = await encryptionService.encryptMessage(
          originalMessage,
          groupKey,
        );
        contentForDB = null;
      } catch (error) {
        console.error("❌ Group encryption failed:", error);
        contentForDB = originalMessage;
      }
    }

    const messageData = {
      roomId,
      senderId: currentUserId,
      senderName: getMemberName(currentUserId),
      receiverId: "group",
      isGroupMessage: true,
      content: contentForDB,
      encryptedContent: encryptedContent,
      attachments: allUploadedAttachments,
      replyTo: replyTo, // Add reply information
      timestamp: now,
      delivered: false,
      read: false,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: !!encryptedContent,
    };

    const localMessage = {
      ...messageData,
      content: originalMessage,
    };

    if (encryptedContent && groupKey && originalMessage) {
      setDecryptedMessages((prev) => new Map(prev).set(now, originalMessage));
    }

    setMessages((prev) => [...prev, localMessage]);
    setNewMessage("");

    attachments.forEach((att) => {
      if (att.preview) {
        URL.revokeObjectURL(att.preview);
      }
    });
    setAttachments([]);
    setShowAttachments(false);
    setReplyingToMessage(null); // Clear reply after sending

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      handleTyping(false);
    }

    console.log("📤 Sending encrypted group message with attachments");
    socket.emit("send-message", messageData);

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
      .catch(console.error)
      .finally(() => {
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

    socket.emit("edit-message", {
      roomId,
      timestamp: editingMessage.timestamp,
      senderId: editingMessage.senderId,
      content: editText.trim(),
      isGroupMessage: true,
    });

    try {
      await fetch("/api/chat/messages/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          timestamp: editingMessage.timestamp,
          senderId: editingMessage.senderId,
          content: editText.trim(),
          isGroupMessage: true,
        }),
      });
    } catch (error) {
      console.error("Error editing message:", error);
    }

    setEditingMessage(null);
    setEditText("");
  };

  const handleDeleteMessage = async (message, forEveryone = false) => {
    if (forEveryone) {
      socket.emit("delete-message", {
        roomId,
        timestamp: message.timestamp,
        senderId: message.senderId,
        deleteForEveryone: true,
        isGroupMessage: true,
      });

      try {
        await fetch("/api/chat/messages/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            timestamp: message.timestamp,
            senderId: message.senderId,
            deleteForEveryone: true,
            isGroupMessage: true,
          }),
        });
      } catch (error) {
        console.error("Error deleting message for everyone:", error);
      }
    } else {
      setMessages((prev) =>
        prev.filter(
          (msg) =>
            !(
              msg.timestamp === message.timestamp &&
              msg.senderId === message.senderId
            ),
        ),
      );

      try {
        await fetch("/api/chat/messages/delete-for-me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        console.error("Error deleting message for me:", error);
      }
    }
  };

  const handleReactToMessage = async (message, emoji) => {
    const updatedReactions = message.reactions || [];
    const existingReactionIndex = updatedReactions.findIndex(
      (r) => r.userId === currentUserId && r.emoji === emoji,
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

    socket.emit("react-to-message", {
      roomId,
      timestamp: message.timestamp,
      messageOwnerId: message.senderId,
      reactions: updatedReactions,
      isGroupMessage: true,
    });

    try {
      await fetch("/api/chat/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          timestamp: message.timestamp,
          senderId: message.senderId,
          reactions: updatedReactions,
          isGroupMessage: true,
        }),
      });
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const fileType = file.type.split("/")[0];
      if (fileType !== "image" && fileType !== "video") {
        alert("Only images and videos are allowed!");
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      setAttachments((prev) => [
        ...prev,
        {
          file,
          preview: previewUrl,
          type: fileType,
          name: file.name,
          size: file.size,
          uploading: false,
        },
      ]);
    });

    setShowAttachments(false);
    e.target.value = "";
  };

  const handleRemoveAttachment = (index) => {
    const attachment = attachments[index];
    if (attachment.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllAttachments = () => {
    attachments.forEach((att) => {
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
    const attachmentsToUpload = attachments.filter(
      (att) => !att.url && att.file,
    );

    if (attachmentsToUpload.length === 0) {
      return attachments;
    }

    setUploading(true);

    const uploadedAttachments = [];

    for (const att of attachmentsToUpload) {
      const formData = new FormData();
      formData.append("file", att.file);
      formData.append("userId", currentUserId);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
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
        console.error("Error uploading file:", error);
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
      setEditText((prev) => prev + emojiObject.emoji);
    } else {
      setNewMessage((prev) => prev + emojiObject.emoji);
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
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (messageDate === today) return "Today";
    if (messageDate === yesterday) return "Yesterday";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleUpdateSettings = async (updates) => {
    try {
      const res = await fetch("/api/chat/groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.groupId,
          userId: currentUserId,
          updates,
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
      console.error("Error updating group settings:", error);
    }
  };

  const handleManageMember = async (targetUserId, action) => {
    try {
      const res = await fetch("/api/chat/groups/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.groupId,
          adminId: currentUserId,
          action,
          targetUserId,
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
      console.error("Error managing member:", error);
    }
  };

  const handleRegenerateInvite = async () => {
    try {
      const res = await fetch("/api/chat/groups/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.groupId,
          userId: currentUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGroupData((prev) => ({ ...prev, inviteCode: data.inviteCode }));
      }
    } catch (error) {
      console.error("Error regenerating invite code:", error);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const res = await fetch(
        `/api/chat/groups?groupId=${group.groupId}&userId=${currentUserId}&action=leave`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (data.success) {
        onClose();
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const res = await fetch(
        `/api/chat/groups?groupId=${group.groupId}&userId=${currentUserId}&action=delete`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (data.success) {
        onClose();
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  // Handle slow mode save
  const handleSaveSlowMode = async (settings) => {
    try {
      const res = await fetch("/api/chat/groups/slow-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.groupId,
          userId: currentUserId,
          settings
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSlowModeSettings(settings);
        updateLocalSlowMode(settings);
        
        // Update group data with new settings
        setGroupData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            slowMode: settings
          }
        }));
        
        if (onGroupUpdate) {
          onGroupUpdate({
            ...groupData,
            settings: {
              ...groupData.settings,
              slowMode: settings
            }
          });
        }
        
        setShowSlowModeModal(false);
      }
    } catch (error) {
      console.error("Error saving slow mode settings:", error);
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
              {replyTo.attachmentType === 'image' ? <ImageIcon size={12} /> : <Video size={12} />}
              {replyTo.attachmentType === 'image' ? 'Photo' : 'Video'}
            </span>
          ) : (
            replyTo.content || ''
          )}
        </div>
      </div>
    );
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
    } else if (message.delivered || readByCount > 0) {
      return <CheckCheck size={16} className="text-gray-400 dark:text-gray-500" />;
    } else {
      return <Check size={16} className="text-gray-400 dark:text-gray-500" />;
    }
  };

  const MessageWrapper = ({ message, children, isOwn }) => {
    const longPressEvent = useLongPress(
      (e) => handleMessageLongPress(e, message),
      null,
      { threshold: 500 },
    );

    // Check if this message is the current search result
    const isCurrentSearchResult = searchResults[currentSearchIndex]?.messageId === `${message.timestamp}-${message.senderId}`;

    return (
      <div
        ref={el => messageRefs.current.set(`${message.timestamp}-${message.senderId}`, el)}
        {...longPressEvent}
        onContextMenu={(e) => handleMessageRightClick(e, message)}
        className={`relative group transition-all z-10 duration-300 ${
          isCurrentSearchResult ? ' ring-green-400 dark:ring-green-500 rounded-3xl ' : ''
        }`}
      >
        {children}
      </div>
    );
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

  const renderMessageWithMentions = (content, highlight) => {
    if (!content) return null;

    const parts = parseMessageContent(content);

    return parts.map((part, index) => {
      if (part.type === "mention") {
        const isCurrentUser = part.userId === currentUserId;
        return (
          <span
            key={index}
            className={`inline-flex items-center px-3 py-0.5 rounded-xl font-medium mx-0.5 ${
              isCurrentUser
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            }`}
            title={`Mention: ${part.name}`}
          >
            <AtSign size={12} className="mr-0.5" />
            {part.name}
          </span>
        );
      }
      
      // Apply highlighting to text parts
      if (highlight && part.content) {
        return (
          <span key={index}>
            {highlightText(part.content, highlight)}
          </span>
        );
      }
      
      return <span key={index}>{part.content}</span>;
    });
  };

  const dropdownItems = [
    {
      id: 'encryption',
      label: 'Encryption Info',
      icon: ShieldCheck,
      onClick: () => {
        setShowDropdown(false);
        setShowGroupEncryptionModal(true);
      },
      className: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'group-settings',
      label: 'Group Settings',
      icon: Settings2,
      onClick: () => {
        setShowDropdown(false);
        fetchGroupData();
        setShowGroupInfo(true);
      }
    },
    {
      id: 'slow-mode',
      label: slowModeSettings.enabled ? `Slow Mode (${slowModeSettings.cooldown}s)` : 'Slow Mode',
      icon: Snowflake,
      onClick: () => {
        setShowDropdown(false);
        fetchGroupData();
        setShowSlowModeModal(true);
      },
      className: slowModeSettings.enabled ? 'text-blue-600 dark:text-blue-400' : ''
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
      <div className="h-full flex flex-col bg-white dark:bg-[#0c0c0c] rounded-3xl border border-none dark:border-[#0c0c0c] overflow-hidden transition-colors duration-300">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between bg-white dark:bg-[#0c0c0c]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-[#202124] dark:text-white" />
            </button>

            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-[#232529] flex items-center justify-center text-[#202124] dark:text-white font-semibold text-lg flex-shrink-0">
              {(() => {
                let groupAvatar = null;
                if (groupData.avatar) {
                  try {
                    groupAvatar =
                      typeof groupData.avatar === "string"
                        ? JSON.parse(groupData.avatar)
                        : groupData.avatar;
                  } catch (e) {
                    console.error("Failed to parse group avatar", e);
                  }
                }

                if (groupAvatar?.beanConfig) {
                  return <BeanHead {...groupAvatar.beanConfig} />;
                } else {
                  const groupName =
                    groupData.groupName || groupData.name || "Group";
                  return groupName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                }
              })()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className=" text-[#202124] dark:text-white truncate flex items-center gap-2">
                {groupData.groupName || groupData.name}
                {isCurrentUserAdmin && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
                {groupData.settings?.onlyAdminsCanMessage && !isCurrentUserAdmin && (
                  <Lock size={14} className="text-[#5f6368] dark:text-gray-400" />
                )}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-[#5f6368] dark:text-gray-400">
                  <Users size={12} />
                  <span>{groupData.members?.length || 0} members</span>
                </div>
                {groupTyping.length > 0 && (
                  <span className="text-green-600 dark:text-green-400 animate-pulse">
                    {groupTyping.length === 1
                      ? `${getMemberName(groupTyping[0])} ${groupData.members?.find(m => m.userId === groupTyping[0])?.role === 'admin' ? '(Admin)' : ''} is typing...`
                      : `${groupTyping.length} people are typing...`}
                  </span>
                )}
                {cooldownActive && !isCurrentUserAdmin && (
                  <SlowModeBadge timeRemaining={timeRemaining} />
                )}
              </div>
            </div>
          </div>

          {/* Three Dots Dropdown */}
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
            className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors ml-2"
          >
            <X size={18} className="text-red-600 dark:text-red-400" />
          </button>
        </div>

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
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Join Notifications */}
          {joinNotifications.map((notification) => (
            <div
              key={notification.id}
              className="flex justify-center my-2 animate-fade-in"
            >
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                <UserPlus size={16} />
                <span>{notification.userName} joined the group</span>
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34A853]"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle
                size={48}
                className="mx-auto text-[#dadce0] dark:text-[#232529] mb-3"
              />
              <p className="text-[#5f6368] dark:text-gray-400">No messages yet</p>
              <p className="text-sm text-[#5f6368] dark:text-gray-500 mt-1">
                Be the first to send a message! Use @ to mention someone.
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
                              <span className="text-xs text-[#5f6368] dark:text-gray-400">
                                {msg.senderName || getMemberName(msg.senderId)}
                                {groupData.members?.find(m => m.userId === msg.senderId)?.role === 'admin' && (
                                  <span className="ml-1 text-green-600 dark:text-green-400">(Admin)</span>
                                )}
                              </span>
                            </div>
                          )}
                          
                          {/* Reply preview if this message is a reply */}
                          {msg.replyTo && renderReplyPreview(msg.replyTo)}
                          
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
                                        {/* Time overlay for images */}
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                          {formatTime(msg.timestamp)}
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
                                        {/* Time overlay for videos */}
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
                                  : 'bg-white dark:bg-[#101010] dark:text-white border-[#dadce0] dark:border-[#232529] rounded-tl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {msg.deleted ? (
                                  msg.content
                                ) : (
                                  renderMessageWithMentions(messageContent, highlightedText)
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
                                  className="text-xs bg-gray-100 dark:bg-[#101010] rounded-full px-2 py-1 flex items-center gap-1"
                                >
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-gray-600 dark:text-gray-400">{count}</span>}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Reply button - on the left for own messages */}
                        {!msg.deleted && isOwn && (
                          <button
                            onClick={() => handleReplyToMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-[#101010] z-10 mr-2 flex-shrink-0 self-center order-1"
                            title="Reply to this message"
                          >
                            <Reply size={14} className="text-[#5f6368] dark:text-gray-400" />
                          </button>
                        )}
                        
                        {/* Reply button - on the right for others' messages */}
                        {!msg.deleted && !isOwn && (
                          <button
                            onClick={() => handleReplyToMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-[#101010] z-10 ml-2 flex-shrink-0 self-center order-3"
                            title="Reply to this message"
                          >
                            <Reply size={14} className="text-[#5f6368] dark:text-gray-400" />
                          </button>
                        )}
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

        {/* Reply Preview Bar */}
        {replyingToMessage && !replyingToMessage.deleted && (
          <ReplyPreview
            message={replyingToMessage}
            friendName={getMemberName(replyingToMessage.senderId)}
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
                  if (e.key === "Enter" && !e.shiftKey) {
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
          {!canSendMessage() && !isCurrentUserAdmin && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-xs flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2">
                <Lock size={12} className="inline mr-1" />
                {slowModeSettings.enabled && !canSendInSlowMode()
                  ? `Slow mode active. Please wait ${timeRemaining}s`
                  : "Only admins can send messages in this group"}
              </span>
            </div>
          )}

          {showMentions && (
            <div className="absolute bottom-full left-0 mb-2 w-64 z-50 mention-suggestions">
              <MentionSuggestions
                members={filteredMembers}
                onSelect={handleSelectMention}
                query={mentionQuery}
                currentUserId={currentUserId}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* AI Enhancement Button */}
            <button
              onClick={() => setShowAIEnhancement(true)}
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors relative group"
              title="Enhance with AI"
              disabled={!isConnected || !roomJoined || !canSendMessage()}
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
                  setShowAttachments(!showAttachments);
                  setShowEmojiPicker(false);
                  setShowMentions(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full relative transition-colors"
                disabled={
                  !isConnected ||
                  !roomJoined ||
                  editingMessage ||
                  !canSendMessage()
                }
              >
                <Paperclip size={20} className="text-[#5f6368] dark:text-gray-400" />
              </button>

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
                        <p className="text-sm font-medium text-[#202124] dark:text-white">
                          Send Image
                        </p>
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
                        <p className="text-sm font-medium text-[#202124] dark:text-white">
                          Send Video
                        </p>
                        <p className="text-xs text-[#5f6368] dark:text-gray-400">Share videos</p>
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
                  setShowMentions(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
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
              onChange={
                editingMessage
                  ? (e) => setEditText(e.target.value)
                  : handleInputChange
              }
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
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
              onBlur={(e) => {
                setTimeout(() => {
                  const mentionElement = document.querySelector(
                    ".mention-suggestions",
                  );
                  if (
                    mentionElement &&
                    mentionElement.contains(document.activeElement)
                  ) {
                    return;
                  }
                }, 200);
              }}
              placeholder={
                !isConnected
                  ? "Connecting..."
                  : !roomJoined
                    ? "Joining chat..."
                    : !canSendMessage()
                      ? isCurrentUserAdmin
                        ? "You are an admin (bypassing slow mode)"
                        : slowModeSettings.enabled && !canSendInSlowMode()
                          ? `Slow mode active (${timeRemaining}s)`
                          : "Only admins can send messages"
                      : isCurrentUserAdmin
                        ? "Type a message as admin... (Use @ to mention, ✨ for AI)"
                        : "Type a message... (Use @ to mention, ✨ for AI)"
              }
              className="flex-1 px-4 py-3 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-3xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none transition-all"
              disabled={
                !isConnected || !roomJoined || uploading || !canSendMessage()
              }
            />

            {/* Send Button */}
            <button
              onClick={
                editingMessage
                  ? handleEditMessage
                  : attachments.length > 0
                    ? handleSendWithAttachments
                    : handleSendMessage
              }
              disabled={
                editingMessage
                  ? !editText.trim()
                  : (!newMessage.trim() && attachments.length === 0) ||
                    !isConnected ||
                    !roomJoined ||
                    uploading ||
                    !canSendMessage()
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

          {isConnected && !roomJoined && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                ⏳ Joining group chat...
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

      {/* Modals */}
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
          onReply={() => {
            handleReplyToMessage(selectedMessage);
            closeContextMenu();
          }}
          isOwnMessage={selectedMessage.senderId === currentUserId}
        />
      )}

      <AttachmentPreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
        onNext={handleNextAttachment}
        onPrevious={handlePreviousAttachment}
        hasNext={currentAttachmentIndex < allAttachments.length - 1}
        hasPrevious={currentAttachmentIndex > 0}
      />

      <AttachmentPreviewModal
        isOpen={!!previewPreSendAttachment}
        onClose={() => setPreviewPreSendAttachment(null)}
        attachment={previewPreSendAttachment}
        onNext={() => {}}
        onPrevious={() => {}}
        hasNext={false}
        hasPrevious={false}
      />

      <MessageInfoModal
        isOpen={showMessageInfo}
        onClose={() => setShowMessageInfo(false)}
        message={messageInfoData}
        friendName={groupData.name}
        isGroupMessage={true}
        groupMembers={groupData.members}
      />

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

      <GroupEncryptionModal
        isOpen={showGroupEncryptionModal}
        onClose={() => setShowGroupEncryptionModal(false)}
        group={groupData}
      />

      {/* Slow Mode Modal */}
      <SlowModeModal
        isOpen={showSlowModeModal}
        onClose={() => setShowSlowModeModal(false)}
        onSave={handleSaveSlowMode}
        currentSettings={slowModeSettings}
        isAdmin={isCurrentUserAdmin}
      />

      {/* Add this CSS to your global styles or component */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
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
      `}</style>
    </>
  );
}