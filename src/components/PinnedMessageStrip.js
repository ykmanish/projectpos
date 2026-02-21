// components/PinnedMessageStrip.js
'use client';

import { Pin, X, ArrowRight, Image as ImageIcon, Video } from 'lucide-react';

export default function PinnedMessageStrip({ 
  message, 
  onJumpToMessage, 
  onUnpin,
  getMemberName,
  currentUserId,
  showJumpButton = false
}) {
  if (!message) return null;

  const isOwn = message.senderId === currentUserId;
  const senderName = message.senderName || getMemberName(message.senderId);
  
  // Get message content preview
  const getMessagePreview = () => {
    if (message.deleted) {
      return message.deletedByAdmin 
        ? `[Message deleted by admin]` 
        : `[Message deleted]`;
    }
    
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      if (attachment.type === 'image') {
        return `📷 Photo`;
      } else if (attachment.type === 'video') {
        return `🎥 Video`;
      } else if (attachment.type === 'gif') {
        return `🎬 GIF`;
      }
    }
    
    // Truncate text content
    const content = message.content || '';
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between animate-slideDown">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Pin size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-yellow-800 dark:text-yellow-300">
              Pinned message
            </span>
            <span className="text-yellow-600 dark:text-yellow-500">•</span>
            <span className="text-yellow-700 dark:text-yellow-400">
              {senderName} {isOwn && '(You)'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 truncate">
              {getMessagePreview()}
            </p>
            
            {/* Jump button */}
            <button
              onClick={onJumpToMessage}
              className={`flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-200 dark:bg-yellow-800 hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-all text-xs font-medium text-yellow-800 dark:text-yellow-300 ${
                showJumpButton ? 'animate-bounce' : ''
              }`}
            >
              <ArrowRight size={12} />
              <span>Jump</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unpin button - only for admins */}
      {onUnpin && (
        <button
          onClick={onUnpin}
          className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full transition-colors ml-2 flex-shrink-0"
          title="Unpin message"
        >
          <X size={14} className="text-yellow-700 dark:text-yellow-400" />
        </button>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}