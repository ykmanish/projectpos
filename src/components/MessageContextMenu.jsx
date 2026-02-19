// components/MessageContextMenu.js

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Edit,
  Trash2,
  Copy,
  Smile,
  Info,
  Shield,
  AlertTriangle,
} from "lucide-react";

const EMOJI_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

export default function MessageContextMenu({
  message,
  position,
  onClose,
  onEdit,
  onDelete,
  onReact,
  onCopy,
  onMessageInfo,
  onReply,
  isOwnMessage,
  isCurrentUserAdmin,
  adminName,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAdminDeleteConfirm, setShowAdminDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  const handleAction = (action) => {
    action();
    onClose();
  };

  const handleReactClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEmojiPicker(true);
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEmojiPicker(false);
    setShowAdminDeleteConfirm(false);
  };

  const handleEmojiClick = (e, emoji) => {
    e.preventDefault();
    e.stopPropagation();
    handleAction(() => onReact(emoji));
  };

  const handleAdminDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAdminDeleteConfirm(true);
  };

  const handleConfirmAdminDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAction(() => onDelete(true));
  };

  const canDeleteForEveryone = () => {
    if (!isOwnMessage && !isCurrentUserAdmin) return false;
    if (isOwnMessage) {
      const messageTime = new Date(message.timestamp).getTime();
      const currentTime = new Date().getTime();
      const hourInMs = 60 * 60 * 1000;
      return (currentTime - messageTime) <= hourInMs;
    }
    // Admins can always delete any message for everyone
    return isCurrentUserAdmin;
  };

  const getMenuStyle = () => {
    const menuWidth = 220;
    const menuHeight = showAdminDeleteConfirm ? 200 : 350;
    
    let left = position.x;
    let top = position.y;
    
    if (isOwnMessage) {
      left = left - menuWidth - 10;
      
      if (left < 10) {
        left = position.x - menuWidth + 50;
      }
      
      if (left < 10) {
        left = position.x + 10;
      }
    } else {
      left = position.x + 10;
    }
    
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }
    
    if (top + menuHeight > window.innerHeight) {
      top = position.y - menuHeight;
    }
    
    if (top < 10) {
      top = 10;
    }
    
    if (left < 10) {
      left = 10;
    }
    
    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  // Show admin delete confirmation
  if (showAdminDeleteConfirm) {
    return (
      <>
        {/* Backdrop for mobile */}
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
        
        {/* Confirmation Menu */}
        <div
          ref={menuRef}
          className="fixed z-50 bg-white dark:bg-[#0c0c0c] rounded-2xl   border-[#dadce0] dark:border-[#232529] py-2 min-w-[220px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-100"
          style={getMenuStyle()}
        >
          <div className="px-4 py-3 border-b border-[#f1f3f4] dark:border-[#232529]">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Delete as Admin</span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-gray-400">
              This will delete the message for everyone and show "Deleted by Admin ({adminName})"
            </p>
          </div>

          <button
            onClick={handleConfirmAdminDelete}
            className="w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors text-left"
          >
            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">Confirm Delete</span>
          </button>

          <button
            onClick={handleBackClick}
            className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#101010] flex items-center gap-3 transition-colors text-left"
          >
            <span className="text-sm text-[#5f6368] dark:text-gray-400">← Back</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white dark:bg-[#0c0c0c] rounded-2xl -2xl  border-[#dadce0] dark:border-[#232529] py-2 min-w-[220px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-100"
        style={getMenuStyle()}
      >
        {/* Emoji Reactions */}
        {!showEmojiPicker ? (
          <>
            {/* Reply Option */}
            

            <button
              onClick={handleReactClick}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#101010] flex items-center gap-3 transition-colors text-left"
            >
              <Smile size={18} className="text-[#5f6368] dark:text-gray-400" />
              <span className="text-sm text-[#202124] dark:text-white">React</span>
            </button>
          </>
        ) : (
          <>
            <div className="px-3 py-3 flex flex-wrap gap-2 justify-center border-b border-[#f1f3f4] dark:border-[#232529]">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => handleEmojiClick(e, emoji)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="text-2xl hover:scale-125 transition-transform active:scale-110 p-1"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={handleBackClick}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#101010] flex items-center gap-3 transition-colors text-left"
            >
              <span className="text-sm text-[#5f6368] dark:text-gray-400">← Back</span>
            </button>
          </>
        )}

        {/* Message Info */}
        {isOwnMessage && !message.deleted && (
          <button
            onClick={() => handleAction(onMessageInfo)}
            className="w-full px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-3 transition-colors text-left"
          >
            <Info size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-[#202124] dark:text-white">Message Info</span>
          </button>
        )}

        {/* Copy Message */}
        {message.content && !message.deleted && (
          <button
            onClick={() => handleAction(() => onCopy(message.content))}
            className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#101010] flex items-center gap-3 transition-colors text-left"
          >
            <Copy size={18} className="text-[#5f6368] dark:text-gray-400" />
            <span className="text-sm text-[#202124] dark:text-white">Copy</span>
          </button>
        )}

        {/* Edit Message (only for own text messages, not deleted) */}
        {isOwnMessage && message.content && !message.deleted && (
          <button
            onClick={() => handleAction(onEdit)}
                        className="w-full px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-3 transition-colors text-left"
          >
            <Edit size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-[#202124] dark:text-white">Edit</span>
          </button>
        )}

        {/* Divider */}
        {message.content && !message.deleted && (
          <div className="border-t border-[#f1f3f4] dark:border-[#232529] my-1" />
        )}

        {/* Delete for Me */}
        {!message.deleted && (
          <button
            onClick={() => handleAction(() => onDelete(false))}
            className="w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors text-left"
          >
            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400">Delete for Me</span>
          </button>
        )}

        {/* Admin Delete Option (for admins viewing any message) */}
        {isCurrentUserAdmin && !isOwnMessage && !message.deleted && (
          <button
            onClick={handleAdminDeleteClick}
            className="w-full px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/30 flex items-center gap-3 transition-colors text-left"
          >
            <Shield size={18} className="text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col">
              <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Delete as Admin</span>
              <span className="text-xs text-amber-500 dark:text-amber-400">Show "Deleted by Admin"</span>
            </div>
          </button>
        )}

        {/* Delete for Everyone (for own messages within 1 hour) */}
        {canDeleteForEveryone() && !message.deleted && isOwnMessage && (
          <button
            onClick={() => handleAction(() => onDelete(true))}
            className="w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 transition-colors text-left"
          >
            <Trash2 size={18} className="text-red-700 dark:text-red-400" />
            <div className="flex flex-col">
              <span className="text-sm text-red-700 dark:text-red-400 font-medium">Delete for Everyone</span>
              <span className="text-xs text-red-500 dark:text-red-400">Available for 1 hour</span>
            </div>
          </button>
        )}

        {/* Message if delete for everyone is not available */}
        {isOwnMessage && !canDeleteForEveryone() && !message.deleted && (
          <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 italic">
            Delete for everyone only available for 1 hour
          </div>
        )}
      </div>
    </>
  );
}