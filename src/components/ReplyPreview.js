// components/ReplyPreview.js

import React from 'react';
import { X, Image as ImageIcon, Video } from 'lucide-react';

const ReplyPreview = ({ message, friendName, currentUserId, onCancel, getMessageContent }) => {
  const isOwn = message.senderId === currentUserId;
  const senderName = isOwn ? 'You' : friendName;
  const content = getMessageContent(message);
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const attachmentType = message.attachments?.[0]?.type;

  return (
    <div className="border-t border-[#f1f3f4] dark:border-[#181A1E] bg-gray-50 dark:bg-[#0a0a0a] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-green-500 rounded-full"></div>
          <span className="text-xs font-medium text-[#5f6368] dark:text-gray-400">
            Replying to {senderName}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-200 dark:hover:bg-[#101010] rounded-full transition-colors"
        >
          <X size={16} className="text-[#5f6368] dark:text-gray-400" />
        </button>
      </div>
      
      <div className="flex items-center gap-2 pl-3">
        {hasAttachments ? (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            {attachmentType === 'image' ? (
              <>
                <ImageIcon size={14} className="text-blue-500" />
                <span>Photo</span>
              </>
            ) : attachmentType === 'video' ? (
              <>
                <Video size={14} className="text-red-500" />
                <span>Video</span>
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1 flex-1">
            {content || ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReplyPreview;