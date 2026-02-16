"use client";

import { useState, useEffect, useRef } from "react";
import {
  Edit,
  Trash2,
  Copy,
  Smile,
  Info,
} from "lucide-react";

const EMOJI_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

export default function MessageContextMenu({
  message,
  position,
  onClose,
  onEdit,
  onDelete,
  onDeleteForEveryone,
  onReact,
  onCopy,
  onMessageInfo,
  isOwnMessage,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
  };

  const handleEmojiClick = (e, emoji) => {
    e.preventDefault();
    e.stopPropagation();
    handleAction(() => onReact(emoji));
  };

  const canDeleteForEveryone = () => {
    if (!isOwnMessage) return false;
    
    const messageTime = new Date(message.timestamp).getTime();
    const currentTime = new Date().getTime();
    const hourInMs = 60 * 60 * 1000;
    
    return (currentTime - messageTime) <= hourInMs;
  };

  const getMenuStyle = () => {
    const menuWidth = 200;
    const menuHeight = 350;
    
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

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-[#dadce0] py-2 min-w-[200px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-100"
        style={getMenuStyle()}
      >
        {/* Emoji Reactions */}
        {!showEmojiPicker ? (
          <button
            onClick={handleReactClick}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors text-left"
          >
            <Smile size={18} className="text-[#5f6368]" />
            <span className="text-sm text-[#202124]">React</span>
          </button>
        ) : (
          <>
            <div className="px-3 py-3 flex flex-wrap gap-2 justify-center border-b border-[#f1f3f4]">
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
              className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 transition-colors text-left"
            >
              <span className="text-sm text-[#5f6368]">← Back</span>
            </button>
          </>
        )}

        {/* Message Info */}
        {isOwnMessage && !message.deleted && (
          <button
            onClick={() => handleAction(onMessageInfo)}
            className="w-full px-4 py-3 hover:bg-blue-50 flex items-center gap-3 transition-colors text-left"
          >
            <Info size={18} className="text-blue-600" />
            <span className="text-sm text-[#202124]">Message Info</span>
          </button>
        )}

        {/* Copy Message */}
        {message.content && !message.deleted && (
          <button
            onClick={() => handleAction(() => onCopy(message.content))}
            className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors text-left"
          >
            <Copy size={18} className="text-[#5f6368]" />
            <span className="text-sm text-[#202124]">Copy</span>
          </button>
        )}

        {/* Edit Message (only for own text messages, not deleted) */}
        {isOwnMessage && message.content && !message.deleted && (
          <button
            onClick={() => handleAction(onEdit)}
            className="w-full px-4 py-3 hover:bg-blue-50 flex items-center gap-3 transition-colors text-left"
          >
            <Edit size={18} className="text-blue-600" />
            <span className="text-sm text-[#202124]">Edit</span>
          </button>
        )}

        {/* Divider */}
        {message.content && !message.deleted && (
          <div className="border-t border-[#f1f3f4] my-1" />
        )}

        {/* Delete for Me */}
        {!message.deleted && (
          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-4 py-3 hover:bg-red-50 flex items-center gap-3 transition-colors text-left"
          >
            <Trash2 size={18} className="text-red-600" />
            <span className="text-sm text-red-600">Delete for Me</span>
          </button>
        )}

        {/* Delete for Everyone (only for own messages within 1 hour) */}
        {canDeleteForEveryone() && !message.deleted && (
          <button
            onClick={() => handleAction(onDeleteForEveryone)}
            className="w-full px-4 py-3 hover:bg-red-50 flex items-center gap-3 transition-colors text-left"
          >
            <Trash2 size={18} className="text-red-700" />
            <div className="flex flex-col">
              <span className="text-sm text-red-700 font-medium">Delete for Everyone</span>
              <span className="text-xs text-red-500">Available for 1 hour</span>
            </div>
          </button>
        )}

        {/* Message if delete for everyone is not available */}
        {isOwnMessage && !canDeleteForEveryone() && !message.deleted && (
          <div className="px-4 py-2 text-xs text-gray-400 italic">
            Delete for everyone only available for 1 hour
          </div>
        )}
      </div>
    </>
  );
}
