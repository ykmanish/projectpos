// components/GroupChatInterface.js

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import {
  ChevronLeft,
  X,
  Send,
  ShieldCheck,
  Calendar,
  Paperclip,
  Shield,
  Image as ImageIcon,
  Video,
  UserCircle,
  Clock,
  Info,
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
  ReceiptText,
  CornerDownRight,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import LinkPreview from "./LinkPreview";
import CodeBlock from "./CodeBlock";
import {
  parseMessageContent,
  detectCode,
  detectLanguage,
} from "@/utils/codeUtils";
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
import ReplyPreview from "./ReplyPreview";
import GIFPicker from "./GIFPicker";
import SplitBillModal from "./SplitBillModal";
import { getCurrencySymbol, getCurrencyFlag } from "@/constants/currencies";

export default function GroupChatInterface({
  group,
  currentUserId,
  currentUserAvatar,
  onClose,
  onMessageUpdate,
  onGroupUpdate,
}) {
  // ==================== ALL STATE DECLARATIONS ====================
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupTyping, setGroupTyping] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGIFPicker, setShowGIFPicker] = useState(false);
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

  // Code mode state
  const [codeMode, setCodeMode] = useState(false);

  // Split Bill states
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [slashCommand, setSlashCommand] = useState("");
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [availableCommands] = useState([
    {
      command: "/split",
      description: "Split a bill with group members",
      icon: DollarSign,
    },
  ]);

  // Track online members in the group
  const [onlineMembers, setOnlineMembers] = useState(new Set());

  // Reply feature states
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  // Check if current user is admin
  const isCurrentUserAdmin =
    groupData.members?.find((m) => m.userId === currentUserId)?.role ===
    "admin";

  // Slow mode settings
  const [slowModeSettings, setSlowModeSettings] = useState({
    enabled: group?.settings?.slowMode?.enabled || false,
    cooldown: group?.settings?.slowMode?.cooldown || 30,
  });

  // Initialize slow mode hook with userId for persistence and admin status
  const {
    slowMode: localSlowMode,
    cooldownActive,
    timeRemaining,
    canSendMessage: canSendInSlowMode,
    registerMessageSent,
    updateSlowMode: updateLocalSlowMode,
    resetCooldown,
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

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

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
  const replyMessageRefs = useRef(new Map());

  const { socket, isConnected, getUserOnlineStatus } = useSocket();
  const roomId = group.groupId;

  // ==================== DETECT MOBILE ====================
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ==================== HELPER FUNCTIONS ====================

  const handleCodeModeToggle = () => {
    setCodeMode(!codeMode);
    if (!codeMode) {
      // When turning on code mode, wrap existing text in triple backticks
      if (newMessage.trim() && !newMessage.includes("```")) {
        setNewMessage(`\`\`\`\n${newMessage}\n\`\`\``);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    // Get pasted text
    const pastedText = e.clipboardData.getData("text");

    // Check if the pasted text contains code indicators
    const containsNewlines = pastedText.includes("\n");
    const containsIndentation = /^[ \t]/.test(pastedText);
    const containsSpecialChars = /[{}[\]()<>;=+\-*/&|!]/.test(pastedText);

    // Heuristic: if it has multiple lines and code-like characters, treat as code
    const looksLikeCode =
      containsNewlines &&
      (containsIndentation || containsSpecialChars || pastedText.length > 100);

    if (looksLikeCode) {
      // Detect language (simplified)
      let language = "javascript"; // default

      if (
        pastedText.includes("def ") ||
        (pastedText.includes("import ") && pastedText.includes(":"))
      ) {
        language = "python";
      } else if (pastedText.includes("<div") || pastedText.includes("<html")) {
        language = "html";
      } else if (
        pastedText.includes("{") &&
        pastedText.includes("}") &&
        pastedText.includes(":") &&
        !pastedText.includes("function")
      ) {
        language = "css";
      }

      // Format as code block with language and proper line breaks
      const formattedCode = `\`\`\`${language}\n${pastedText}\n\`\`\``;

      // Insert at cursor position
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      const currentValue = newMessage;
      const newValue =
        currentValue.substring(0, start) +
        formattedCode +
        currentValue.substring(end);

      setNewMessage(newValue);

      // Set cursor position after the inserted code
      setTimeout(() => {
        inputRef.current.selectionStart = start + formattedCode.length;
        inputRef.current.selectionEnd = start + formattedCode.length;
      }, 0);
    } else {
      // Regular paste - insert at cursor position
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      const currentValue = newMessage;
      const newValue =
        currentValue.substring(0, start) +
        pastedText +
        currentValue.substring(end);

      setNewMessage(newValue);

      // Set cursor position after the inserted text
      setTimeout(() => {
        inputRef.current.selectionStart = start + pastedText.length;
        inputRef.current.selectionEnd = start + pastedText.length;
      }, 0);
    }
  };

  const getMemberName = (userId) => {
    const member = groupData.members?.find((m) => m.userId === userId);
    return member?.userName || "Unknown";
  };

  const getMemberRole = (userId) => {
    const member = groupData.members?.find((m) => m.userId === userId);
    return member?.role || "member";
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

  const getMessageContent = (message) => {
    if (message.deleted) {
      if (message.deletedByAdmin) {
        return `This message was deleted by admin (${message.deletedByName || "Admin"})`;
      }
      return message.content || "This message was deleted";
    }
    if (message.encryptedContent) {
      return decryptedMessages.get(message.timestamp) || message.content || "";
    }
    return message.content || "";
  };

  // Updated message status rendering for groups
  const renderMessageStatus = (message) => {
    if (message.senderId !== currentUserId) return null;

    const totalMembers = groupData.members?.length || 0;
    const readByCount = message.readBy?.length || 0;
    const otherMembersCount = totalMembers - 1;

    // If message is read by all members
    if (readByCount >= otherMembersCount && otherMembersCount > 0) {
      return (
        <CheckCheck size={16} className="text-blue-500" title="Read by all" />
      );
    }
    // If message is delivered (at least one online member received it)
    else if (message.delivered || readByCount > 0) {
      return (
        <CheckCheck
          size={16}
          className="text-gray-400 dark:text-gray-500"
          title="Delivered"
        />
      );
    }
    // Message is sent but not delivered to anyone
    else {
      return (
        <Check
          size={16}
          className="text-gray-400 dark:text-gray-500"
          title="Sent"
        />
      );
    }
  };

  const MessageWrapper = ({ message, children, isOwn }) => {
    const longPressEvent = useLongPress(
      (e) => handleMessageLongPress(e, message),
      null,
      { threshold: 500 },
    );

    // Check if this message is the current search result
    const isCurrentSearchResult =
      searchResults[currentSearchIndex]?.messageId ===
      `${message.timestamp}-${message.senderId}`;

    return (
      <div
        ref={(el) =>
          messageRefs.current.set(
            `${message.timestamp}-${message.senderId}`,
            el,
          )
        }
        {...longPressEvent}
        onContextMenu={(e) => handleMessageRightClick(e, message)}
        className={`relative group transition-all z-10 duration-300 ${
          isCurrentSearchResult
            ? " ring-green-400 dark:ring-green-500 rounded-3xl "
            : ""
        }`}
      >
        {children}
      </div>
    );
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
              {replyTo.attachmentType === "image" ? (
                <ImageIcon size={12} />
              ) : replyTo.attachmentType === "gif" ? (
                <span className="font-bold">GIF</span>
              ) : (
                <Video size={12} />
              )}
              {replyTo.attachmentType === "image"
                ? "Photo"
                : replyTo.attachmentType === "gif"
                  ? "GIF"
                  : "Video"}
            </span>
          ) : (
            replyTo.content || ""
          )}
        </div>
      </div>
    );
  };

  // ==================== ASYNC FUNCTIONS ====================

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
        // Process messages to ensure admin deletion info is preserved
        const processedMessages = data.messages.map((msg) => {
          // If message is deleted by admin, ensure the content shows admin deletion
          if (msg.deleted && msg.deletedByAdmin) {
            msg.content = `This message was deleted by admin (${msg.deletedByName || "Admin"})`;
          }
          return msg;
        });

        setMessages(processedMessages);
        console.log(`✅ Loaded ${processedMessages.length} messages`);
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

  // ==================== BILL FUNCTIONS ====================

  // Helper function to update bill message in state
  const updateBillMessageInState = (bill) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.billId === bill.id) {
          const paidCount = bill.splits?.filter(
            (s) => s.status === "paid"
          ).length || 0;
          const totalCount = bill.splits?.length || 0;
          
          // Get payer name
          const paidByMember = bill.splits?.find(
            (s) => s.userId === bill.paidBy
          );
          const paidByName = paidByMember?.userName || "Someone";

          const currencySymbol = getCurrencySymbol(bill.currency || "USD");

          // Create updated content
          const updatedContent = `New Split Bill: ${bill.title}\n Total: ${currencySymbol}${bill.totalAmount?.toFixed(2) || "0.00"}\nPaid by: ${paidByName}\nPending payments: ${totalCount - paidCount} people\n\nUse /split to view or pay bills`;

          return {
            ...msg,
            content: updatedContent,
            billData: {
              ...bill,
              title: bill.title,
              totalAmount: bill.totalAmount,
              paidBy: bill.paidBy,
              paidByName: paidByName,
              paidCount,
              totalCount,
              pendingCount: totalCount - paidCount,
              paidPercentage: bill.totalAmount > 0 ? (paidCount / totalCount) * 100 : 0,
              splits: bill.splits || [],
            },
          };
        }
        return msg;
      }),
    );
  };

  // Refresh bill data manually
  const refreshBillData = async (billId) => {
    try {
      const res = await fetch(
        `/api/chat/split-bill?groupId=${roomId}&billId=${billId}`,
      );
      const data = await res.json();

      if (data.success && data.bill) {
        // Update the message with fresh bill data
        updateBillMessageInState(data.bill);
      }
    } catch (error) {
      console.error("Error refreshing bill data:", error);
    }
  };

  const handleOpenBill = (billId) => {
    setShowSplitBillModal(true);
    console.log("Opening bill:", billId);
  };

  const handleOpenBillDetails = (billId) => {
    console.log("Opening bill details for:", billId);
  };

  // ==================== MESSAGE CONTENT COMPONENT ====================

  // Update the MessageContent component (around line 750-800)
  const MessageContent = ({
    message,
    content,
    highlightedText,
    formatTime,
    renderMessageStatus,
    isOwn,
  }) => {
    const [showFullContent, setShowFullContent] = useState(false);

    // Function to extract URLs from text
    const extractUrlsFromText = (text) => {
      if (!text) return [];
      const urlPattern =
        /(https?:\/\/[^\s]+)|(www\.[^\s]+\.[^\s]+)|([^\s]+\.[^\s]+\.[^\s]+\/[^\s]*)/gi;
      const matches = text.match(urlPattern) || [];
      return matches.map((url) => {
        if (url.startsWith("www.")) return `https://${url}`;
        if (!url.startsWith("http") && url.includes("."))
          return `https://${url}`;
        return url;
      });
    };

    // Function to validate URL
    const isValidUrl = (string) => {
      try {
        new URL(string);
        return true;
      } catch {
        return false;
      }
    };

    // Function to highlight text
    const highlightText = (text, highlight) => {
      if (!highlight.trim() || !text) {
        return text;
      }

      const regex = new RegExp(
        `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      const parts = text.split(regex);

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

    // Check if content has code blocks
    const hasCodeBlocks = content.includes("```") || detectCode(content);
    const shouldShowFullContent = showFullContent || hasCodeBlocks;

    const renderMessageContent = (text) => {
      if (!text) return null;

      // Always parse the FULL content
      const parts = parseMessageContent(text);

      if (!shouldShowFullContent && text.length > 300) {
        // For truncated view without code blocks
        let charCount = 0;
        const visibleParts = [];
        let reachedLimit = false;

        for (const part of parts) {
          if (reachedLimit) break;

          if (part.type === "text" && part.content) {
            const remainingChars = 300 - charCount;
            if (remainingChars <= 0) {
              reachedLimit = true;
              break;
            }

            if (part.content.length > remainingChars) {
              // Show partial text with ellipsis
              visibleParts.push({
                ...part,
                content: part.content.substring(0, remainingChars) + "...",
              });
              reachedLimit = true;
            } else {
              visibleParts.push(part);
              charCount += part.content.length;
            }
          } else {
            // For non-text parts, skip in truncated view
            reachedLimit = true;
          }
        }

        // Render the visible parts
        return visibleParts.map((part, index) => {
          if (part.type === "inline-code") {
            return (
              <code
                key={`inline-${index}`}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1a1a1a] text-pink-600 dark:text-pink-400 rounded-md font-mono text-sm border border-gray-200 dark:border-[#232529]"
              >
                {part.code}
              </code>
            );
          }

          // For text parts, render with links and highlighting
          if (part.content) {
            return (
              <span key={`text-${index}`} className="break-words">
                {renderTextWithLinks(part.content, index)}
              </span>
            );
          }

          return null;
        });
      } else {
        // Show full content - render all parts EXCEPT code blocks
        return parts.map((part, index) => {
          if (part.type === "code-block") {
            // Don't render code blocks here - they're handled separately
            return null;
          }

          if (part.type === "inline-code") {
            return (
              <code
                key={`inline-${index}`}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1a1a1a] text-pink-600 dark:text-pink-400 rounded-md font-mono text-sm border border-gray-200 dark:border-[#232529]"
              >
                {part.code}
              </code>
            );
          }

          // For text parts, render with links and highlighting
          if (part.content) {
            return (
              <span key={`text-${index}`} className="break-words">
                {renderTextWithLinks(part.content, index)}
              </span>
            );
          }

          return null;
        });
      }
    };

    // Function to render text with clickable links
    const renderTextWithLinks = (text, keyPrefix) => {
      if (!text) return null;

      const urlPattern =
        /(https?:\/\/[^\s]+)|(www\.[^\s]+\.[^\s]+)|([^\s]+\.[^\s]+\.[^\s]+\/[^\s]*)/gi;
      const parts = text.split(urlPattern);
      const matches = text.match(urlPattern) || [];

      const isValidUrl = (string) => {
        try {
          new URL(string);
          return true;
        } catch {
          return false;
        }
      };

      const highlightText = (text, highlight) => {
        if (!highlight.trim() || !text) {
          return text;
        }

        const regex = new RegExp(
          `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          "gi",
        );
        const textParts = text.split(regex);

        return textParts.map((part, idx) => {
          if (regex.test(part)) {
            return (
              <mark
                key={idx}
                className="bg-green-300 dark:bg-green-600 text-inherit px-0.5 rounded"
              >
                {part}
              </mark>
            );
          }
          return part;
        });
      };

      let result = [];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // Check if this part is a URL
        let isUrl = false;
        let url = part;

        if (matches.includes(part)) {
          isUrl = true;
        } else if (part && (part.startsWith("http") || part.includes("."))) {
          if (part.startsWith("www.")) {
            url = `https://${part}`;
          } else if (!part.startsWith("http") && part.includes(".")) {
            url = `https://${part}`;
          }
          isUrl = isValidUrl(url);
        }

        if (isUrl && part) {
          result.push(
            <a
              key={`${keyPrefix}-url-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>,
          );
        } else if (part) {
          if (highlightedText) {
            result.push(
              <span key={`${keyPrefix}-text-${i}`}>
                {highlightText(part, highlightedText)}
              </span>,
            );
          } else {
            result.push(<span key={`${keyPrefix}-text-${i}`}>{part}</span>);
          }
        }
      }

      return result;
    };

    const urls = extractUrlsFromText(content);
    const hasUrls = urls.length > 0;

    return (
      <div className="message-content-wrapper">
        {/* Message content without code blocks */}
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {renderMessageContent(content)}
          {message.edited && !message.deleted && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
              (edited)
            </span>
          )}
        </div>

        {/* Show more/less button for long messages */}
        {content.length > 300 && !hasCodeBlocks && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-xs text-blue-600 dark:text-blue-400 mt-2 hover:underline focus:outline-none"
          >
            {showFullContent ? "Show less" : "Show more"}
          </button>
        )}

        {/* Link previews */}
        {hasUrls && urls.length > 0 && !message.deleted && (
          <div className="mt-2 space-y-2">
            <LinkPreview
              key={`preview-${urls[0]}-${message.timestamp}`}
              url={urls[0]}
            />
            {urls.length > 1 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{urls.length - 1} more link{urls.length - 1 > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}

        {/* Time and status */}
        <div className="flex items-center justify-end gap-1 mt-2">
          <p
            className={`text-[10px] ${isOwn ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"}`}
          >
            {formatTime(message.timestamp)}
          </p>
          {renderMessageStatus(message)}
        </div>
      </div>
    );
  };

  // Helper function to render bill messages
  const renderBillMessage = (content, billId, billCurrency, billData) => {
    console.log("🎨 Rendering bill message with data:", billData);

    if (!billData) {
      console.log("❌ No bill data provided, trying to parse from content");

      // Try to parse from content
      if (content) {
        const titleMatch = content.match(/New Split Bill: (.*?)(?:\n|$)/);
        const totalMatch = content.match(/Total: .*?(\d+\.?\d*)/);
        const paidByMatch = content.match(/Paid by: (.*?)(?:\n|$)/);
        const pendingMatch = content.match(/Pending payments: (\d+)/);

        const title = titleMatch ? titleMatch[1] : "Split Bill";
        const totalAmount = totalMatch ? parseFloat(totalMatch[1]) : 0;
        const paidByName = paidByMatch ? paidByMatch[1] : "Someone";
        const pendingCount = pendingMatch ? parseInt(pendingMatch[1]) : 0;

        return (
          <div className="bill-message-content w-full max-w-[280px] md:max-w-sm">
            <div className="rounded-[30px] p-4 md:p-5 w-full bg-gray-200 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {title}
              </p>
              <p className="text-lg font-bold">${totalAmount.toFixed(2)}</p>
              <p className="text-xs">Paid by: {paidByName}</p>
              <p className="text-xs">{pendingCount} pending</p>
            </div>
          </div>
        );
      }

      return (
        <div className="bill-message-content w-full max-w-[280px] md:max-w-sm">
          <div className="rounded-[30px] p-4 md:p-5 w-full bg-gray-200 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading bill details...
            </p>
          </div>
        </div>
      );
    }

    // Extract data with fallbacks
    const title = billData.title || "Split Bill";
    const currencySymbol = getCurrencySymbol(
      billCurrency || billData.currency || "USD",
    );
    const totalAmount = billData.totalAmount || 0;
    const total = `${currencySymbol}${totalAmount.toFixed(2)}`;
    const paidByName = billData.paidByName || "Someone";
    const pendingCount = billData.pendingCount || 0;
    const paidCount = billData.paidCount || 0;
    const totalCount = billData.totalCount || billData.splits?.length || 0;

    console.log("💰 Bill details:", {
      title,
      total,
      paidByName,
      pendingCount,
      paidCount,
      totalCount,
    });

    const CARD_PALETTES = [
      {
        bg: "#FF8C78",
        track: "#c96b58",
        bar: "#1a0a08",
        text: "#1a0a08",
        sub: "#7a3028",
      },
      {
        bg: "#FFB8C6",
        track: "#d98898",
        bar: "#1a0810",
        text: "#1a0810",
        sub: "#7a3050",
      },
      {
        bg: "#7DCFCC",
        track: "#4eaaa7",
        bar: "#082020",
        text: "#082020",
        sub: "#1a5a58",
      },
      {
        bg: "#F5E09A",
        track: "#c8b860",
        bar: "#1a1408",
        text: "#1a1408",
        sub: "#6a5020",
      },
      {
        bg: "#A8D8FF",
        track: "#70b0e0",
        bar: "#081220",
        text: "#081220",
        sub: "#204870",
      },
      {
        bg: "#B8E8B0",
        track: "#80c078",
        bar: "#081408",
        text: "#081408",
        sub: "#205820",
      },
      {
        bg: "#E0C8F8",
        track: "#b090d0",
        bar: "#120820",
        text: "#120820",
        sub: "#503878",
      },
      {
        bg: "#FFD4A0",
        track: "#d8a060",
        bar: "#1a0e04",
        text: "#1a0e04",
        sub: "#7a4818",
      },
    ];

    const paletteIdx = (title.charCodeAt(0) || 0) % CARD_PALETTES.length;
    const palette = CARD_PALETTES[paletteIdx];

    return (
      <div className="bill-message-content w-full max-w-[280px] md:max-w-sm">
        <div
          className="rounded-[30px] p-4 md:p-5 w-full"
          style={{ backgroundColor: palette.bg }}
        >
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div>
              <h3
                className="text-lg md:text-xl font-extrabold leading-tight"
                style={{ color: palette.text }}
              >
                {title}
              </h3>
              <p
                className="text-xs mt-1 font-medium"
                style={{ color: palette.sub }}
              >
                Split Bill
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between mb-4 md:mb-5">
            <div>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: palette.sub }}
              >
                Total
              </p>
              <p
                className="text-xl md:text-2xl font-extrabold tracking-tight"
                style={{ color: palette.text }}
              >
                {total}
              </p>
            </div>

            <div className="text-right">
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: palette.sub }}
              >
                Paid by
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-bold"
                  style={{ color: palette.text }}
                >
                  {paidByName}
                </span>
              </div>
            </div>
          </div>

          {pendingCount > 0 ? (
            <div className="mt-3 md:mt-4 pt-3 border-t border-white/30 flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenBill(billId);
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: palette.text,
                  color: palette.bg,
                }}
              >
                View Details
              </button>
              <span
                className="text-xs font-medium"
                style={{ color: palette.text }}
              >
                {pendingCount} pending
              </span>
            </div>
          ) : (
            <div className="mt-3 md:mt-4 pt-3 border-t border-white/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} style={{ color: palette.text }} />
                <span
                  className="text-xs font-bold"
                  style={{ color: palette.text }}
                >
                  Fully Paid
                </span>
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: palette.sub }}
              >
                ✓ Settled
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== EVENT HANDLERS ====================

  // Updated canSendMessage function with admin bypass
  const canSendMessage = useCallback(() => {
    // Check if user is admin - admins bypass all restrictions
    if (isCurrentUserAdmin) return true;

    // Check admin message permission first (only if not admin)
    if (groupData.settings?.onlyAdminsCanMessage) {
      return false;
    }

    // Then check slow mode
    if (groupData.settings?.slowMode?.enabled && !canSendInSlowMode()) {
      return false;
    }

    return true;
  }, [
    groupData.settings?.onlyAdminsCanMessage,
    groupData.settings?.slowMode?.enabled,
    isCurrentUserAdmin,
    canSendInSlowMode,
  ]);

  // Handle slash commands
  const handleSlashCommand = (input) => {
    if (input === "/split") {
      setShowSplitBillModal(true);
      setNewMessage("");
      setShowSlashSuggestions(false);
      return true;
    }
    return false;
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

    // Check for slash command at beginning
    if (value.startsWith("/") && !value.includes(" ")) {
      setSlashCommand(value);
      const matchedCommands = availableCommands.filter((cmd) =>
        cmd.command.startsWith(value),
      );
      setShowSlashSuggestions(matchedCommands.length > 0);
    } else {
      setShowSlashSuggestions(false);
    }

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
          matchCount: indices.length,
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

  // New function to handle direct GIF send
  const handleSendGIF = async (gif) => {
    if (!socket || !isConnected || !roomJoined || !canSendMessage()) return;

    // Register message sent for slow mode (only if not admin)
    if (!isCurrentUserAdmin) {
      registerMessageSent();
    }

    const now = new Date().toISOString();

    // Prepare reply data if replying to a message
    let replyTo = null;
    if (replyingToMessage && !replyingToMessage.deleted) {
      const replyContent = getMessageContent(replyingToMessage);
      replyTo = {
        messageId: `${replyingToMessage.timestamp}-${replyingToMessage.senderId}`,
        timestamp: replyingToMessage.timestamp,
        senderId: replyingToMessage.senderId,
        senderName:
          replyingToMessage.senderId === currentUserId
            ? "You"
            : getMemberName(replyingToMessage.senderId),
        content: replyContent,
        hasAttachments:
          replyingToMessage.attachments &&
          replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type,
      };
    }

    const messageData = {
      roomId,
      senderId: currentUserId,
      senderName: getMemberName(currentUserId),
      receiverId: "group",
      isGroupMessage: true,
      content: "",
      attachments: [
        {
          url: gif.url,
          type: "gif",
          name: gif.name || "GIF",
          gifId: gif.gifId,
          gifData: gif,
        },
      ],
      replyTo: replyTo,
      timestamp: now,
      delivered: false, // Start as false for offline members
      deliveredAt: null,
      read: false,
      readBy: [currentUserId],
      reactions: [],
      isEncrypted: false,
    };

    // Add message locally
    setMessages((prev) => [...prev, messageData]);

    // Clear reply after sending
    setReplyingToMessage(null);

    console.log("📤 Sending GIF message");
    socket.emit("send-message", messageData);

    // Save to database
    fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    })
      .then(() => {
        if (onMessageUpdate) {
          onMessageUpdate(messageData);
        }
      })
      .catch(console.error);

    // Close GIF picker
    setShowGIFPicker(false);
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
        senderName:
          replyingToMessage.senderId === currentUserId
            ? "You"
            : getMemberName(replyingToMessage.senderId),
        content: replyContent,
        hasAttachments:
          replyingToMessage.attachments &&
          replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type,
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
        gifId: att.gifId,
        gifData: att.gifData,
      })),
      replyTo: replyTo,
      timestamp: now,
      delivered: false, // Start as false for offline members
      deliveredAt: null,
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
        gifId: att.gifId,
        gifData: att.gifData,
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
        senderName:
          replyingToMessage.senderId === currentUserId
            ? "You"
            : getMemberName(replyingToMessage.senderId),
        content: replyContent,
        hasAttachments:
          replyingToMessage.attachments &&
          replyingToMessage.attachments.length > 0,
        attachmentType: replyingToMessage.attachments?.[0]?.type,
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
      replyTo: replyTo,
      timestamp: now,
      delivered: false, // Start as false for offline members
      deliveredAt: null,
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

  // Updated handleDeleteMessage for admin functionality
  const handleDeleteMessage = async (
    message,
    forEveryone = false,
    isAdminDelete = false,
  ) => {
    const adminName = isCurrentUserAdmin ? getMemberName(currentUserId) : null;

    if (forEveryone) {
      socket.emit("delete-message", {
        roomId,
        timestamp: message.timestamp,
        senderId: message.senderId,
        deleteForEveryone: true,
        isGroupMessage: true,
        deletedBy: currentUserId,
        deletedByAdmin: isAdminDelete || isCurrentUserAdmin,
        deletedByName: adminName,
      });

      try {
        const response = await fetch("/api/chat/messages/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            timestamp: message.timestamp,
            senderId: message.senderId,
            deleteForEveryone: true,
            isGroupMessage: true,
            deletedBy: currentUserId,
            deletedByAdmin: isAdminDelete || isCurrentUserAdmin,
            deletedByName: adminName,
          }),
        });

        const data = await response.json();

        // Immediately update local state with the admin deletion info
        if (data.success) {
          const deletedContent =
            isAdminDelete || isCurrentUserAdmin
              ? `This message was deleted by admin (${adminName})`
              : "This message was deleted";

          setMessages((prev) =>
            prev.map((msg) =>
              msg.timestamp === message.timestamp &&
              msg.senderId === message.senderId
                ? {
                    ...msg,
                    deleted: true,
                    deletedBy: currentUserId,
                    deletedByAdmin: isAdminDelete || isCurrentUserAdmin,
                    deletedByName: adminName,
                    content: deletedContent,
                    attachments: [],
                  }
                : msg,
            ),
          );
        }
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
        // Update local state immediately
        setGroupData(data.group);

        // Emit socket event to notify all group members about settings change
        if (socket && isConnected) {
          socket.emit("group-settings-updated", {
            roomId: roomId,
            settings: updates,
            updatedBy: currentUserId,
            timestamp: new Date().toISOString(),
          });
        }

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
          settings,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSlowModeSettings(settings);
        updateLocalSlowMode(settings);

        // Update group data with new settings
        setGroupData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            slowMode: settings,
          },
        }));

        // Emit socket event to notify all group members about slow mode change
        if (socket && isConnected) {
          socket.emit("group-settings-updated", {
            roomId: roomId,
            settings: { slowMode: settings },
            updatedBy: currentUserId,
            timestamp: new Date().toISOString(),
          });
        }

        if (onGroupUpdate) {
          onGroupUpdate({
            ...groupData,
            settings: {
              ...groupData.settings,
              slowMode: settings,
            },
          });
        }

        setShowSlowModeModal(false);
      }
    } catch (error) {
      console.error("Error saving slow mode settings:", error);
    }
  };

  // Handle bill creation success
  const handleBillCreated = async (bill) => {
    console.log('💰 Bill created with data from API:', bill);
    
    // The API already saved the message to the database and will emit socket events
    // So we don't need to create another message here
    // Just fetch messages to ensure we have the latest
    await fetchMessages();
    
    // Also emit a direct socket event to ensure real-time update
    if (socket && isConnected) {
      socket.emit("bill-created", {
        roomId: roomId,
        bill: bill,
        timestamp: new Date().toISOString()
      });
    }
  };

  // ==================== USE EFFECTS ====================

  // Initialize encryption
  useEffect(() => {
    if (group?.groupId && currentUserId) {
      initializeGroupEncryption();
    }
  }, [group?.groupId, currentUserId]);

  // Monitor online status of group members
  useEffect(() => {
    if (groupData?.members) {
      const online = new Set();
      groupData.members.forEach((member) => {
        const status = getUserOnlineStatus(member.userId);
        if (status.online) {
          online.add(member.userId);
        }
      });
      setOnlineMembers(online);
    }
  }, [groupData?.members, getUserOnlineStatus]);

  // Click outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
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
      if (
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target)
      ) {
        setShowGIFPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Decrypt all messages when groupKey is available
  useEffect(() => {
    if (groupKey && messages.length > 0) {
      decryptAllMessages();
    }
  }, [groupKey, messages]);

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

  // Main socket connection useEffect
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

    // ==================== SOCKET EVENT HANDLERS ====================

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

    const onGroupSettingsUpdated = (data) => {
      console.log("⚙️ Group settings updated via socket:", data);
      if (data.roomId === roomId) {
        setGroupData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            ...data.settings,
          },
        }));

        if (data.settings.slowMode) {
          setSlowModeSettings(data.settings.slowMode);
          updateLocalSlowMode(data.settings.slowMode);
        }
      }
    };

    const onMessage = (message) => {
      if (message.roomId === roomId) {
        const userJoinTime = groupData.members?.find(
          (m) => m.userId === currentUserId,
        )?.joinedAt;

        if (userJoinTime && message.timestamp > userJoinTime) {
          // Check if message already exists (prevent duplicates)
          setMessages((prev) => {
            const exists = prev.some(
              (m) =>
                m.timestamp === message.timestamp &&
                m.senderId === message.senderId,
            );

            if (exists) {
              console.log("⏭️ Skipping duplicate message:", message.timestamp);
              return prev;
            }

            // Handle encryption if needed
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

            console.log("📩 Adding new message:", message.timestamp);
            return [...prev, message];
          });

          if (message.senderId !== currentUserId) {
            setTimeout(() => markMessagesAsRead(), 500);
          }

          if (onMessageUpdate) {
            onMessageUpdate(message);
          }
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
          const deletedContent = data.deletedByAdmin
            ? `This message was deleted by admin (${data.deletedByName})`
            : "This message was deleted";

          setMessages((prev) =>
            prev.map((msg) =>
              msg.timestamp === data.timestamp && msg.senderId === data.senderId
                ? {
                    ...msg,
                    deleted: true,
                    deletedBy: data.deletedBy,
                    deletedByAdmin: data.deletedByAdmin,
                    deletedByName: data.deletedByName,
                    content: deletedContent,
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

    const onUserCameOnline = (data) => {
      console.log("👤 User came online in group:", data);
      if (data.roomId === roomId) {
        setOnlineMembers((prev) => new Set(prev).add(data.userId));

        // Update delivery status for messages sent to this user
        setMessages((prev) =>
          prev.map((msg) => {
            // For messages sent to the group, they're considered delivered when any member is online
            if (msg.senderId === currentUserId && !msg.delivered) {
              return { ...msg, delivered: true, deliveredAt: data.timestamp };
            }
            return msg;
          }),
        );
      }
    };

    const onUserWentOffline = (data) => {
      console.log("👤 User went offline:", data);
      if (data.userId && data.roomId === roomId) {
        setOnlineMembers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    const onCheckUndelivered = (data) => {
      console.log("🔍 Check undelivered messages:", data);
      if (data.roomId === roomId) {
        // Request status of undelivered messages
        if (socket && isConnected) {
          socket.emit("get-undelivered-status", {
            roomId,
            userId: currentUserId,
            isGroupMessage: true,
          });
        }
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

    const onOnline = ({ userId, online, lastSeen }) => {
      if (userId) {
        setOnlineMembers((prev) => {
          if (online) {
            return new Set(prev).add(userId);
          } else {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          }
        });
      }
    };

    // ====== BILL MESSAGE UPDATE LISTENERS ======
    const onBillUpdated = (data) => {
      console.log("💰 Bill updated:", data);
      if (data.roomId === roomId) {
        // Refresh the bill modal if it's open
        if (showSplitBillModal) {
          refreshBillData(data.bill.id);
        }

        // Update the bill message in the chat
        if (data.bill) {
          updateBillMessageInState(data.bill);
        }
      }
    };

    const onBillMessageUpdated = (data) => {
      console.log("💰 Bill message updated in chat:", data);
      if (data.roomId === roomId && data.billData) {
        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg.billId === data.billId) {
              // Calculate updated stats
              const paidCount = data.billData.paidCount || 0;
              const totalCount = data.billData.totalCount || 0;
              const pendingCount =
                data.billData.pendingCount || totalCount - paidCount;
              const paidPercentage =
                data.billData.paidPercentage ||
                (totalCount > 0 ? (paidCount / totalCount) * 100 : 0);

              const currencySymbol = getCurrencySymbol(
                data.billData.currency || "USD",
              );

              // Create updated content
              const updatedContent = `New Split Bill: ${data.billData.title}\nTotal: ${currencySymbol}${data.billData.totalAmount?.toFixed(2) || "0.00"}\nPaid by: ${data.billData.paidByName || "Someone"}\nPending payments: ${pendingCount} people\n\nUse /split to view or pay bills`;

              return {
                ...msg,
                content: updatedContent,
                billData: {
                  ...data.billData,
                  paidCount,
                  totalCount,
                  pendingCount,
                  paidPercentage,
                },
              };
            }
            return msg;
          });
        });
      }
    };

    const onBillCreated = (data) => {
      console.log("💰 New bill created:", data);
      if (data.roomId === roomId) {
        // The message will be added via the regular message handler
        // But we need to fetch messages to ensure we have it
        fetchMessages();
        
        // Also add a temporary notification for better UX
        const notification = {
          id: `bill-${data.timestamp}`,
          type: "bill",
          billId: data.bill?.id,
          userName: data.bill?.paidByName || "Someone",
          timestamp: data.timestamp,
        };
        
        setJoinNotifications((prev) => [...prev, notification]);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          setJoinNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id),
          );
        }, 3000);
      }
    };

    const onBillCancelled = (data) => {
      console.log("🚫 Bill cancelled:", data);
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.billId === data.billId) {
              return {
                ...msg,
                billCancelled: true,
                cancelledBy: data.cancelledBy,
                cancelledAt: data.cancelledAt,
              };
            }
            return msg;
          }),
        );
      }
    };

    const onBillDirectUpdate = (data) => {
      console.log("💰 Direct bill update received:", data);
      if (data.roomId === roomId && data.bill) {
        // Update the bill message in the chat
        updateBillMessageInState(data.bill);
      }
    };

    const onBillMessageImmediate = (data) => {
      console.log("💰 Immediate bill message:", data);
      if (data.roomId === roomId && data.message) {
        // Add the message directly without waiting for API
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some(
            (m) => m.timestamp === data.message.timestamp
          );
          
          if (exists) {
            return prev;
          }
          
          return [...prev, data.message];
        });
      }
    };

    // ====== BILL DELETION LISTENERS ======
    const onBillMessageDeleted = (data) => {
      console.log("🗑️ Bill message deleted:", data);
      if (data.roomId === roomId) {
        // Remove the bill message from chat
        setMessages((prev) => prev.filter((msg) => msg.billId !== data.billId));
      }
    };

    const onBillDeleted = (data) => {
      console.log("💰 Bill deleted:", data);
      if (data.roomId === roomId) {
        // Remove the bill message from chat
        setMessages((prev) => prev.filter((msg) => msg.billId !== data.billId));
      }
    };

    // ==================== REGISTER ALL EVENT LISTENERS ====================

    // Register all socket event listeners
    socket.on("joined-room", onJoinedRoom);
    socket.on("member-joined", onMemberJoined);
    socket.on("group-settings-updated", onGroupSettingsUpdated);
    socket.on("receive-message", onMessage);
    socket.on("message-updated", onMessageUpdated);
    socket.on("message-deleted", onMessageDeleted);
    socket.on("message-reaction", onMessageReaction);
    socket.on("message-read", onMessageRead);
    socket.on("message-delivered", onMessageDelivered);
    socket.on("user-came-online", onUserCameOnline);
    socket.on("user-went-offline", onUserWentOffline);
    socket.on("check-undelivered-messages", onCheckUndelivered);
    socket.on("user-typing", onTyping);
    socket.on("user-online", onOnline);
    socket.on("user-status-change", onOnline);

    // Register bill message listeners
    socket.on("bill-updated", onBillUpdated);
    socket.on("bill-message-updated", onBillMessageUpdated);
    socket.on("bill-created", onBillCreated);
    socket.on("bill-cancelled", onBillCancelled);
    socket.on("bill-direct-update", onBillDirectUpdate);

    // Register bill deletion listeners
    socket.on("bill-message-deleted", onBillMessageDeleted);
    socket.on("bill-deleted", onBillDeleted);

    // ==================== CLEANUP ====================
    return () => {
      console.log("🧹 Cleaning up group chat listeners");
      socket.off("joined-room", onJoinedRoom);
      socket.off("member-joined", onMemberJoined);
      socket.off("group-settings-updated", onGroupSettingsUpdated);
      socket.off("receive-message", onMessage);
      socket.off("message-updated", onMessageUpdated);
      socket.off("message-deleted", onMessageDeleted);
      socket.off("message-reaction", onMessageReaction);
      socket.off("message-read", onMessageRead);
      socket.off("message-delivered", onMessageDelivered);
      socket.off("user-came-online", onUserCameOnline);
      socket.off("user-went-offline", onUserWentOffline);
      socket.off("check-undelivered-messages", onCheckUndelivered);
      socket.off("user-typing", onTyping);
      socket.off("user-online", onOnline);
      socket.off("user-status-change", onOnline);

      // Remove bill message listeners
      socket.off("bill-updated", onBillUpdated);
      socket.off("bill-message-updated", onBillMessageUpdated);
      socket.off("bill-created", onBillCreated);
      socket.off("bill-cancelled", onBillCancelled);
      socket.off("bill-direct-update", onBillDirectUpdate);

      // Remove bill deletion listeners
      socket.off("bill-message-deleted", onBillMessageDeleted);
      socket.off("bill-deleted", onBillDeleted);

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
    groupData?.members,
    showSplitBillModal,
    onMessageUpdate,
    updateLocalSlowMode,
    slowModeSettings,
  ]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Dropdown items
  const dropdownItems = [
    {
      id: "encryption",
      label: "Encryption Info",
      icon: ShieldCheck,
      onClick: () => {
        setShowDropdown(false);
        setShowGroupEncryptionModal(true);
      },
      className: "text-green-600 dark:text-green-400",
    },
    {
      id: "group-settings",
      label: "Group Settings",
      icon: Settings2,
      onClick: () => {
        setShowDropdown(false);
        fetchGroupData();
        setShowGroupInfo(true);
      },
    },
    {
      id: "slow-mode",
      label: slowModeSettings.enabled
        ? `Slow Mode (${slowModeSettings.cooldown}s)`
        : "Slow Mode",
      icon: Snowflake,
      onClick: () => {
        setShowDropdown(false);
        fetchGroupData();
        setShowSlowModeModal(true);
      },
      className: slowModeSettings.enabled
        ? "text-blue-600 dark:text-blue-400"
        : "",
    },
    {
      id: "search",
      label: "Search Messages",
      icon: Search,
      onClick: () => {
        setShowDropdown(false);
        setShowSearch(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      },
    },
  ];

  // ==================== RENDER ====================

  return (
    <>
      <div className={`h-full flex flex-col bg-white dark:bg-[#0c0c0c] rounded-3xl border border-none dark:border-[#0c0c0c] overflow-hidden transition-colors duration-300 ${isMobile ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
        {/* Chat Header - Fixed */}
        <div className={`flex-shrink-0 p-3 md:p-4 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between bg-white dark:bg-[#0c0c0c] ${isMobile ? 'sticky top-0 z-20' : ''}`}>
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            >
              <ChevronLeft
                size={20}
                className="text-[#202124] dark:text-white"
              />
            </button>

            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-[#232529] flex items-center justify-center text-[#202124] dark:text-white font-semibold text-base md:text-lg flex-shrink-0">
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
              <h3 className="text-sm md:text-base text-[#202124] dark:text-white truncate flex items-center gap-2">
                {groupData.groupName || groupData.name}
                {isCurrentUserAdmin && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
                {groupData.settings?.onlyAdminsCanMessage &&
                  !isCurrentUserAdmin && (
                    <Lock
                      size={12}
                      className="text-[#5f6368] dark:text-gray-400"
                    />
                  )}
              </h3>
              <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs">
                <div className="flex items-center gap-1 text-[#5f6368] dark:text-gray-400">
                  <Users size={12} />
                  <span className="hidden xs:inline">{groupData.members?.length || 0} members</span>
                  <span className="xs:hidden">{groupData.members?.length || 0}</span>
                  <span className="mx-1 hidden xs:inline">•</span>
                  <span className="text-green-600 dark:text-green-400 whitespace-nowrap">
                    {onlineMembers.size} online
                  </span>
                </div>
                {groupTyping.length > 0 && (
                  <span className="text-green-600 dark:text-green-400 animate-pulse text-xs truncate max-w-[120px] md:max-w-none">
                    {groupTyping.length === 1
                      ? `${getMemberName(groupTyping[0]).split(' ')[0]} is typing...`
                      : `${groupTyping.length} typing...`}
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
              <MoreVertical
                size={18}
                className="text-[#5f6368] dark:text-gray-400"
              />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 md:w-56 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-2xl z-50 py-2">
                {dropdownItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors text-sm ${item.className || "text-[#202124] dark:text-white"}`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full transition-colors ml-1 md:ml-2"
          >
            <X size={16} className="text-red-600 dark:text-red-400" />
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

        {/* Messages Area - Scrollable */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-[#F8F9FA] dark:bg-[#000000] transition-colors duration-300"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Join Notifications */}
          {joinNotifications.map((notification) => (
            <div
              key={notification.id}
              className="flex justify-center my-2 animate-fade-in"
            >
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm flex items-center gap-2">
                <UserPlus size={14} />
                <span>{notification.userName} joined the group</span>
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34A853]"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-white dark:bg-[#0c0c0c] rounded-[35px] border-[#f1f3f4] dark:border-[#232529] p-6 md:p-8 max-w-md w-full mx-4">
                {/* Group Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center text-white font-bold text-2xl md:text-3xl">
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
                </div>

                {/* Group Name */}
                <h2 className="text-xl md:text-2xl font-semibold text-center text-[#000000] dark:text-white mb-2">
                  {groupData.groupName || groupData.name}
                </h2>

                {/* Group Info */}
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center gap-2 w-fit text-[#5f6368] dark:text-gray-400 bg-gray-50 dark:bg-[#101010] p-2 md:p-3 rounded-xl">
                      <span className="text-xs md:text-sm">
                        <span className="font-medium text-[#202124] dark:text-white">
                          {groupData.members?.length || 0}
                        </span>{" "}
                        members
                      </span>
                    </div>
                  </div>

                  {/* Created By */}
                  {groupData.createdBy && (
                    <div className="flex justify-center">
                      <div className="flex items-center justify-center gap-2 text-[#5f6368] dark:text-gray-400 bg-gray-50 w-fit dark:bg-[#101010] p-2 md:p-3 rounded-xl">
                        <span className="text-xs md:text-sm flex items-center gap-2">
                          Created by{" "}
                          <span className="font-medium flex items-center text-[#202124] dark:text-white">
                            {getMemberName(groupData.createdBy)}
                            {groupData.members?.find(
                              (m) => m.userId === groupData.createdBy,
                            )?.role === "admin" && (
                              <Shield
                                size={10}
                                className="inline ml-1 text-green-600 dark:text-green-400"
                              />
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Icon and Text */}
                <div className="text-center">
                  <p className="text-[#5f6368] dark:text-gray-400 text-xs md:text-sm">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex justify-center mb-3">
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-gray-200 dark:bg-[#101010] rounded-full text-[10px] md:text-xs text-[#5f6368] dark:text-gray-400">
                    {date}
                  </span>
                </div>

                {dateMessages.map((msg, index) => {
                  const isOwn = msg.senderId === currentUserId;
                  const showSenderInfo =
                    !isOwn &&
                    (index === 0 ||
                      dateMessages[index - 1]?.senderId !== msg.senderId);
                  const messageContent = getMessageContent(msg);
                  const hasTextContent =
                    messageContent && messageContent.trim().length > 0;

                  // Check if this is a bill message
                  const isBillMessage =
                    msg.billId ||
                    (messageContent && messageContent.includes("Split Bill"));

                  return (
                    <MessageWrapper
                      key={`${msg.timestamp}-${index}`}
                      message={msg}
                      isOwn={isOwn}
                    >
                      <div
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 transition-all duration-200 ease-out`}
                      >
                        <div
                          className={`${isOwn ? "order-2" : "order-1"} max-w-[85%] md:max-w-[70%]`}
                        >
                          {!isOwn && showSenderInfo && (
                            <div className="flex items-center gap-1 md:gap-2 mb-1 ml-1">
                              {renderAvatar(
                                groupData.members?.find(
                                  (m) => m.userId === msg.senderId,
                                )?.avatar,
                                getMemberName(msg.senderId),
                                "w-5 h-5 md:w-6 md:h-6",
                              )}
                              <span className="text-[10px] md:text-xs flex items-center text-[#5f6368] dark:text-gray-400">
                                {msg.senderName || getMemberName(msg.senderId)}
                                {getMemberRole(msg.senderId) === "admin" && (
                                  <span className="ml-1 text-green-600 dark:text-green-400">
                                    <Shield size={8} />
                                  </span>
                                )}
                                {onlineMembers.has(msg.senderId) && (
                                  <span className="ml-1 text-green-600 dark:text-green-400">
                                    ●
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Reply preview if this message is a reply */}
                          {msg.replyTo && renderReplyPreview(msg.replyTo)}

                          {/* Media attachments */}
                          {msg.attachments &&
                            msg.attachments.length > 0 &&
                            !msg.deleted && (
                              <div
                                className={`space-y-2 ${hasTextContent ? "mb-2" : ""}`}
                              >
                                {msg.attachments.map((att, idx) => {
                                  const globalIndex = allAttachments.findIndex(
                                    (a) =>
                                      a.url === att.url &&
                                      a.messageId === msg.timestamp,
                                  );

                                  return (
                                    <div key={idx} className="relative group">
                                      {att.type === "image" ? (
                                        <div className="relative">
                                          <img
                                            src={att.url}
                                            alt="Attachment"
                                            className="max-w-full rounded-2xl max-h-48 md:max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() =>
                                              handleAttachmentClick(
                                                att,
                                                globalIndex,
                                              )
                                            }
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                            <button
                                              onClick={() =>
                                                handleAttachmentClick(
                                                  att,
                                                  globalIndex,
                                                )
                                              }
                                              className="p-1 md:p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                            >
                                              <Maximize2 size={16} />
                                            </button>
                                          </div>
                                          {/* Time overlay for images */}
                                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] md:text-[10px] px-1.5 py-0.5 md:px-2 md:py-1 rounded-full backdrop-blur-sm">
                                            {formatTime(msg.timestamp)}
                                          </div>
                                        </div>
                                      ) : att.type === "video" ? (
                                        <div className="relative">
                                          <video
                                            src={att.url}
                                            className="max-w-full rounded-2xl max-h-48 md:max-h-64 object-cover cursor-pointer"
                                            onClick={() =>
                                              handleAttachmentClick(
                                                att,
                                                globalIndex,
                                              )
                                            }
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                            <button
                                              onClick={() =>
                                                handleAttachmentClick(
                                                  att,
                                                  globalIndex,
                                                )
                                              }
                                              className="p-1 md:p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                            >
                                              <Maximize2 size={16} />
                                            </button>
                                          </div>
                                          {/* Time overlay for videos */}
                                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] md:text-[10px] px-1.5 py-0.5 md:px-2 md:py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                                            <span>
                                              {formatTime(msg.timestamp)}
                                            </span>
                                            {renderMessageStatus(msg)}
                                          </div>
                                        </div>
                                      ) : att.type === "gif" ? (
                                        <div className="flex flex-col">
                                          <div className="relative">
                                            <img
                                              src={att.url}
                                              alt={att.name || "GIF"}
                                              className="max-w-full rounded-2xl max-h-48 md:max-h-64 object-cover transition-opacity"
                                              loading="lazy"
                                            />
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] md:text-[10px] px-1.5 py-0.5 md:px-2 md:py-1 rounded-full backdrop-blur-sm">
                                              GIF
                                            </div>
                                          </div>
                                          {/* Time and status below GIF */}
                                          <div className="flex items-center justify-end gap-1 mt-1 px-1">
                                            <span className="text-[8px] md:text-[10px] text-gray-500 dark:text-gray-400">
                                              {formatTime(msg.timestamp)}
                                            </span>
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
                            isBillMessage ? (
                              // Bill message
                              msg.billCancelled ? (
                                <div className="bill-message-content w-full max-w-[280px] md:max-w-sm">
                                  <div className="rounded-[30px] p-4 md:p-5 w-full bg-gray-300 dark:bg-gray-700">
                                    <div className="flex items-center gap-2 mb-2">
                                      <XCircle size={16} className="text-red-500" />
                                      <h3 className="text-lg md:text-xl font-extrabold text-gray-700 dark:text-gray-300">
                                        Bill Cancelled
                                      </h3>
                                    </div>
                                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                      This bill has been cancelled
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="bill-message-wrapper">
                                  {renderBillMessage(
                                    messageContent,
                                    msg.billId,
                                    msg.billCurrency,
                                    msg.billData
                                  )}
                                </div>
                              )
                            ) : (
                              // Check if this message contains a code block
                              (() => {
                                // Parse the message to check for code blocks
                                const parts = parseMessageContent(messageContent);
                                const hasCodeBlock = parts.some(part => part.type === "code-block");
                                
                                // If it has a code block, render it with code blocks outside the bubble
                                if (hasCodeBlock) {
                                  return (
                                    <div className="w-full">
                                      {parts.map((part, index) => {
                                        if (part.type === "code-block") {
                                          // Code block - render outside bubble (like images)
                                          return (
                                            <div key={`code-${index}`} className="my-2">
                                              <CodeBlock
                                                code={part.code}
                                                language={part.language || "javascript"}
                                              />
                                            </div>
                                          );
                                        } else if (part.type === "inline-code") {
                                          // Inline code - render inside text
                                          return (
                                            <span key={`inline-${index}`}>
                                              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1a1a1a] text-pink-600 dark:text-pink-400 rounded-md font-mono text-xs border border-gray-200 dark:border-[#232529]">
                                                {part.code}
                                              </code>
                                            </span>
                                          );
                                        } else if (part.content) {
                                          // Text content - render in bubble
                                          return (
                                            <div
                                              key={`text-${index}`}
                                              className={`rounded-2xl p-2 md:p-3 mb-2 text-sm ${
                                                msg.deleted
                                                  ? msg.deletedByAdmin
                                                    ? "bg-zinc-100 dark:bg-zinc-500/20 italic text-zinc-700 dark:text-zinc-400 border-amber-200 dark:border-amber-800"
                                                    : "bg-gray-100 dark:bg-[#101010] italic text-gray-500 dark:text-gray-400"
                                                  : isOwn
                                                    ? "bg-zinc-100 dark:bg-[#181A1E] text-black dark:text-white rounded-br-none"
                                                    : "bg-white dark:bg-[#101010] dark:text-white border-[#dadce0] dark:border-[#232529] rounded-tl-none"
                                              }`}
                                            >
                                              <div className="whitespace-pre-wrap break-words leading-relaxed">
                                                {renderTextWithLinks(part.content, index)}
                                              </div>
                                              {/* Only show time and status on the last text bubble if there are multiple */}
                                              {index === parts.length - 1 && (
                                                <div className="flex items-center justify-end gap-1 mt-2">
                                                  <p className={`text-[8px] md:text-[10px] ${isOwn ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"}`}>
                                                    {formatTime(msg.timestamp)}
                                                  </p>
                                                  {renderMessageStatus(msg)}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  );
                                } else {
                                  // Regular message without code blocks - keep in single bubble
                                  return (
                                    <div
                                      className={`rounded-2xl p-2 md:p-3 ${
                                        msg.deleted
                                          ? msg.deletedByAdmin
                                            ? "bg-zinc-100 dark:bg-zinc-500/20 italic text-zinc-700 dark:text-zinc-400 border-amber-200 dark:border-amber-800"
                                            : "bg-gray-100 dark:bg-[#101010] italic text-gray-500 dark:text-gray-400"
                                          : isOwn
                                            ? "bg-zinc-100 dark:bg-[#181A1E] text-black dark:text-white rounded-br-none"
                                            : "bg-white dark:bg-[#101010] dark:text-white border-[#dadce0] dark:border-[#232529] rounded-tl-none"
                                      }`}
                                    >
                                      <MessageContent
                                        message={msg}
                                        content={messageContent}
                                        highlightedText={highlightedText}
                                        formatTime={formatTime}
                                        renderMessageStatus={renderMessageStatus}
                                        isOwn={isOwn}
                                      />
                                    </div>
                                  );
                                }
                              })()
                            )
                          )}
                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 px-2">
                              {Object.entries(
                                msg.reactions.reduce((acc, r) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                  return acc;
                                }, {}),
                              ).map(([emoji, count]) => (
                                <span
                                  key={emoji}
                                  className="text-[10px] md:text-xs bg-gray-100 dark:bg-[#101010] rounded-full px-2 py-0.5 md:px-2 md:py-1 flex items-center gap-1"
                                >
                                  <span>{emoji}</span>
                                  {count > 1 && (
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {count}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reply button - on the left for own messages */}
                        {!msg.deleted && isOwn && (
                          <button
                            onClick={() => handleReplyToMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 md:p-1.5 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-full hover:bg-gray-100 dark:hover:bg-[#101010] z-10 mr-1 md:mr-2 flex-shrink-0 self-center order-1"
                            title="Reply to this message"
                          >
                            <Reply
                              size={12}
                              className="text-[#5f6368] dark:text-gray-400"
                            />
                          </button>
                        )}

                        {/* Reply button - on the right for others' messages */}
                        {!msg.deleted && !isOwn && (
                          <button
                            onClick={() => handleReplyToMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 md:p-1.5 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-full hover:bg-gray-100 dark:hover:bg-[#101010] z-10 ml-1 md:ml-2 flex-shrink-0 self-center order-3"
                            title="Reply to this message"
                          >
                            <Reply
                              size={12}
                              className="text-[#5f6368] dark:text-gray-400"
                            />
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
          <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-900/30 flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 mb-1">
                Editing message
              </p>
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
                className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-blue-300 dark:border-blue-700 bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-600 focus:outline-none text-xs md:text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={handleEditMessage}
              className="p-1.5 md:p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              <Send size={14} />
            </button>
            <button
              onClick={() => {
                setEditingMessage(null);
                setEditText("");
              }}
              className="p-1.5 md:p-2 bg-gray-200 dark:bg-[#232529] text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-[#181A1E] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Message Input - Fixed */}
        <div className={`flex-shrink-0 p-3 md:p-4 border-t border-[#f1f3f4] dark:border-[#181A1E] bg-white dark:bg-[#0c0c0c] ${isMobile ? 'sticky bottom-0 z-20' : ''}`}>
          {!canSendMessage() && !isCurrentUserAdmin && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-[10px] md:text-xs flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 md:px-3 md:py-2 rounded-t-lg">
                <Lock size={10} className="inline mr-1" />
                {groupData.settings?.onlyAdminsCanMessage
                  ? "🔒 Only admins can send messages"
                  : slowModeSettings.enabled && !canSendInSlowMode()
                    ? `Slow mode active (${timeRemaining}s)`
                    : "Cannot send messages"}
              </span>
            </div>
          )}

          {/* Slash Command Suggestions */}
          {showSlashSuggestions && (
            <div className="absolute bottom-full left-2 md:left-4 mb-2 w-56 md:w-64 bg-white dark:bg-[#0c0c0c] border-zinc-200 dark:border-[#232529] rounded-2xl z-50">
              <div className="p-1 md:p-2">
                <div className="text-[10px] md:text-xs text-[#5f6368] dark:text-gray-400 px-2 md:px-3 py-1 md:py-2">
                  Available commands
                </div>
                <button
                  onClick={() => handleSlashCommand("/split")}
                  className="w-full flex items-center gap-2 md:gap-3 p-2 md:p-3 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-lg transition-colors"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ReceiptText
                      size={12}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs md:text-sm font-medium text-[#202124] dark:text-white">
                      /split
                    </p>
                    <p className="text-[10px] md:text-xs text-[#5f6368] dark:text-gray-400">
                      Split a bill
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {showMentions && (
            <div className="absolute bottom-full left-0 mb-2 w-56 md:w-64 z-50 mention-suggestions">
              <MentionSuggestions
                members={filteredMembers}
                onSelect={handleSelectMention}
                query={mentionQuery}
                currentUserId={currentUserId}
              />
            </div>
          )}

          {/* Mobile Input Layout - Buttons above input */}
          {isMobile ? (
            <>
              {/* Input Controls */}
              <div className="flex items-center gap-1 mb-2">
                {/* AI Enhancement Button */}
                <button
                  onClick={() => setShowAIEnhancement(true)}
                  className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors relative group"
                  title="Enhance with AI"
                  disabled={!isConnected || !roomJoined || !canSendMessage()}
                >
                  <Sparkles
                    size={18}
                    className="text-purple-600 dark:text-purple-400"
                  />
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
                      setShowGIFPicker(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full relative transition-colors"
                    disabled={
                      !isConnected ||
                      !roomJoined ||
                      editingMessage ||
                      !canSendMessage()
                    }
                  >
                    <Paperclip
                      size={18}
                      className="text-[#5f6368] dark:text-gray-400"
                    />
                  </button>

                  {showAttachments && (
                    <div className="absolute bottom-12 left-0 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-3xl z-50 p-2 min-w-[180px]">
                      <div className="space-y-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                            <ImageIcon
                              size={16}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-medium text-[#202124] dark:text-white">
                              Image
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                            <Video
                              size={16}
                              className="text-red-600 dark:text-red-400"
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-medium text-[#202124] dark:text-white">
                              Video
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setShowGIFPicker(true);
                            setShowAttachments(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              GIF
                            </span>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-medium text-[#202124] dark:text-white">
                              GIF
                            </p>
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
                      setShowGIFPicker(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
                    disabled={!isConnected || !roomJoined || !canSendMessage()}
                  >
                    <span className="text-lg">😊</span>
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={280}
                        height={350}
                        searchDisabled
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                        theme={
                          document.documentElement.classList.contains("dark")
                            ? "dark"
                            : "light"
                        }
                      />
                    </div>
                  )}
                </div>

                {/* GIF Picker */}
                {showGIFPicker && (
                  <div
                    ref={gifPickerRef}
                    className="absolute bottom-20 left-2 z-50"
                  >
                    <GIFPicker
                      onSelect={handleSendGIF}
                      onClose={() => setShowGIFPicker(false)}
                    />
                  </div>
                )}
              </div>

              {/* Text Input Row */}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  onPaste={handlePaste}
                  value={editingMessage ? editText : newMessage}
                  onChange={
                    editingMessage
                      ? (e) => setEditText(e.target.value)
                      : handleInputChange
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();

                      // Check for slash command
                      if (
                        newMessage.startsWith("/") &&
                        handleSlashCommand(newMessage)
                      ) {
                        return;
                      }

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
                    !isConnected
                      ? "Connecting..."
                      : !roomJoined
                        ? "Joining chat..."
                        : !canSendMessage()
                          ? isCurrentUserAdmin
                            ? "Admin (bypassing restrictions)"
                            : groupData.settings?.onlyAdminsCanMessage
                              ? "🔒 Only admins can message"
                              : slowModeSettings.enabled && !canSendInSlowMode()
                                ? `Slow mode (${timeRemaining}s)`
                                : "Cannot send"
                          : isCurrentUserAdmin
                            ? "Type a message..."
                            : "Type a message..."
                  }
                  className="flex-1 px-3 py-2.5 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-3xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none transition-all text-sm"
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
                    <Send size={18} />
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Desktop Input Layout */
            <div className="flex items-center gap-2">
              {/* AI Enhancement Button */}
              <button
                onClick={() => setShowAIEnhancement(true)}
                className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors relative group"
                title="Enhance with AI"
                disabled={!isConnected || !roomJoined || !canSendMessage()}
              >
                <Sparkles
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
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
                    setShowGIFPicker(false);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full relative transition-colors"
                  disabled={
                    !isConnected ||
                    !roomJoined ||
                    editingMessage ||
                    !canSendMessage()
                  }
                >
                  <Paperclip
                    size={20}
                    className="text-[#5f6368] dark:text-gray-400"
                  />
                </button>

                {showAttachments && (
                  <div className="absolute bottom-16 left-0 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-3xl z-50 p-3 min-w-[200px]">
                    <div className="space-y-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                          <ImageIcon
                            size={20}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-[#202124] dark:text-white">
                            Send Image
                          </p>
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">
                            Share photos
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                          <Video
                            size={20}
                            className="text-red-600 dark:text-red-400"
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-[#202124] dark:text-white">
                            Send Video
                          </p>
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">
                            Share videos
                          </p>
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
                          <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            GIF
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-[#202124] dark:text-white">
                            Send GIF
                          </p>
                          <p className="text-xs text-[#5f6368] dark:text-gray-400">
                            Animated GIFs
                          </p>
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

              {/* GIF Picker */}
              {showGIFPicker && (
                <div
                  ref={gifPickerRef}
                  className="absolute bottom-20 left-4 z-50"
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
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowAttachments(false);
                    setShowGIFPicker(false);
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
                      theme={
                        document.documentElement.classList.contains("dark")
                          ? "dark"
                          : "light"
                      }
                    />
                  </div>
                )}
              </div>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                onPaste={handlePaste}
                value={editingMessage ? editText : newMessage}
                onChange={
                  editingMessage
                    ? (e) => setEditText(e.target.value)
                    : handleInputChange
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();

                    // Check for slash command
                    if (
                      newMessage.startsWith("/") &&
                      handleSlashCommand(newMessage)
                    ) {
                      return;
                    }

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
                          ? "You are an admin (bypassing restrictions)"
                          : groupData.settings?.onlyAdminsCanMessage
                            ? "🔒 Only admins can send messages"
                            : slowModeSettings.enabled && !canSendInSlowMode()
                              ? `Slow mode active (${timeRemaining}s)`
                              : "You cannot send messages"
                        : isCurrentUserAdmin
                          ? "Type a message as admin... (Use @ to mention, ✨ for AI, 📷 for GIF, /split for bills)"
                          : "Type a message... (Use @ to mention, ✨ for AI, 📷 for GIF, /split for bills)"
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
          )}

          {!isConnected && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-[10px] md:text-xs text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                ⚠️ Reconnecting...
              </span>
            </div>
          )}

          {isConnected && !roomJoined && (
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="text-[10px] md:text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                ⏳ Joining group...
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

      {/* Split Bill Modal */}
      <SplitBillModal
        isOpen={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
        group={groupData}
        currentUserId={currentUserId}
        onSave={handleBillCreated}
        socket={socket}
        isConnected={isConnected}
        roomId={roomId}
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
          onDelete={(forEveryone) =>
            handleDeleteMessage(selectedMessage, forEveryone)
          }
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
          isCurrentUserAdmin={isCurrentUserAdmin}
          adminName={getMemberName(currentUserId)}
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
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
            background-color: rgba(245, 158, 11, 0.1);
          }
        }

        @keyframes highlight-reply-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
            background-color: rgba(59, 130, 246, 0.1);
          }
        }

        code {
          font-family: "Fira Code", "Courier New", monospace;
        }

        .inline-code {
          @apply px-1.5 py-0.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-md font-mono text-sm;
        }

        /* Line clamp utilities */
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        pre,
        code {
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Better code block styling */
        .syntax-highlighter {
          background: transparent !important;
        }

        /* Ensure line breaks are preserved in text */
        .whitespace-pre-wrap {
          white-space: pre-wrap !important;
          word-break: break-word;
        }

        /* Style for inline code */
        code:not([class*="language-"]) {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #e83e8c;
        }

        .dark code:not([class*="language-"]) {
          background-color: #1f2937;
          color: #f472b6;
        }

        /* Ensure message container has max width */
        .max-w-[70%] {
          max-width: 70%;
          min-width: 150px;
        }

        @media (max-width: 768px) {
          .max-w-[70%] {
            max-width: 85%;
            min-width: 120px;
          }
        }

        /* For very long code lines */
        .overflow-x-auto {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Custom scrollbar for code blocks */
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Dark mode scrollbar */
        .dark .overflow-x-auto::-webkit-scrollbar-track {
          background: #2d2d2d;
        }

        .dark .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #666;
        }

        /* Ensure code block doesn't overflow parent */
        .code-block-wrapper {
          max-width: 100%;
          overflow: hidden;
        }

        /* For inline code */
        code:not([class*="language-"]) {
          max-width: 100%;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Ensure code blocks don't overflow their containers */
        .max-w-full {
          max-width: 100%;
          width: 100%;
        }

        .overflow-x-auto {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Ensure bill message is visible */
        .bill-message-wrapper {
          display: block;
          width: 100%;
          margin: 0;
          padding: 0;
        }

        /* Animation for join notifications */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        /* Responsive breakpoints */
        @media (max-width: 640px) {
          .xs\\:hidden {
            display: none;
          }
          
          .xs\\:inline {
            display: inline;
          }
        }

        /* Safe area for mobile devices */
        @supports (padding: max(0px)) {
          .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          .pt-safe {
            padding-top: env(safe-area-inset-top);
          }
        }

        /* Prevent body scroll when chat is open on mobile */
        body:has(.fixed.inset-0) {
          overflow: hidden;
        }
      `}</style>
    </>
  );
}