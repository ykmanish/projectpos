"use client";

import { X, Check, CheckCheck, Send as SendIcon, Eye } from "lucide-react";
import Avatar from "./Avatar";

export default function MessageInfoModal({ 
  isOpen, 
  onClose, 
  message, 
  friendName, 
  isGroupMessage = false,
  groupMembers = [] 
}) {
  if (!isOpen || !message) return null;

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  // Check if message uses new readBy format (array of objects)
  const isNewReadByFormat = () => {
    return message.readBy && 
           message.readBy.length > 0 && 
           typeof message.readBy[0] === 'object';
  };

  // Get read by members with their individual read times
  const getReadByMembers = () => {
    if (!isGroupMessage || !groupMembers) return [];
    
    if (isNewReadByFormat()) {
      // New format - array of objects with userId and readAt
      return message.readBy
        .filter(read => read.userId !== message.senderId)
        .map(read => {
          const member = groupMembers.find(m => m.userId === read.userId);
          return {
            ...member,
            readAt: read.readAt
          };
        })
        .filter(member => member); // Remove any undefined members
    } else {
      // Old format - array of userIds
      return groupMembers.filter(member => 
        message.readBy?.includes(member.userId) && member.userId !== message.senderId
      );
    }
  };

  const getNotReadByMembers = () => {
    if (!isGroupMessage || !groupMembers) return [];
    
    const readUserIds = isNewReadByFormat()
      ? message.readBy?.map(r => r.userId) || []
      : message.readBy || [];
    
    return groupMembers.filter(member => 
      !readUserIds.includes(member.userId) && member.userId !== message.senderId
    );
  };

  // Get read time for a specific user (for group messages)
  const getUserReadTime = (userId) => {
    if (!isGroupMessage || !isNewReadByFormat()) return null;
    const readEntry = message.readBy?.find(r => r.userId === userId);
    return readEntry?.readAt;
  };

  const readByMembers = getReadByMembers();
  const notReadByMembers = getNotReadByMembers();

  // Determine if message has been read by anyone (for overall read status)
  const hasBeenRead = isGroupMessage 
    ? readByMembers.length > 0 
    : message.read;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-[#0c0c0c] rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between sticky top-0 bg-white dark:bg-[#0c0c0c] z-10">
            <h2 className="text-xl font-semibold text-[#202124] dark:text-white">Message Info</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            >
              <X size={20} className="text-[#5f6368] dark:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Timeline */}
            <div className="space-y-4">
              {/* Sent */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <SendIcon size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium text-[#202124] dark:text-white mb-1">Sent</p>
                  <p className="text-xs text-[#5f6368] dark:text-gray-400">
                    {formatDateTime(message.timestamp)}
                  </p>
                </div>
                <Check size={18} className="text-blue-600 dark:text-blue-400 mt-2" />
              </div>

              {/* Delivered */}
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.delivered ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-[#232529]'
                }`}>
                  <CheckCheck size={18} className={message.delivered ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-sm font-medium mb-1 ${
                    message.delivered ? 'text-[#202124] dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    Delivered
                  </p>
                  <p className="text-xs text-[#5f6368] dark:text-gray-400">
                    {message.deliveredAt 
                      ? formatDateTime(message.deliveredAt)
                      : message.delivered 
                      ? 'Delivered'
                      : 'Not delivered yet'
                    }
                  </p>
                </div>
                {message.delivered && <CheckCheck size={18} className="text-green-600 dark:text-green-400 mt-2" />}
              </div>

              {/* Read */}
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  hasBeenRead ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-[#232529]'
                }`}>
                  <Eye size={18} className={
                    hasBeenRead ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  } />
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-sm font-medium mb-1 ${
                    hasBeenRead ? 'text-[#202124] dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    Read
                  </p>
                  
                  {!isGroupMessage ? (
                    <>
                      <p className="text-xs text-[#5f6368] dark:text-gray-400">
                        {message.readAt 
                          ? formatDateTime(message.readAt)
                          : message.read
                          ? 'Read'
                          : 'Not read yet'
                        }
                      </p>
                      {message.read && friendName && (
                        <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">
                          Read by {friendName}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[#5f6368] dark:text-gray-400">
                      {readByMembers.length > 0 
                        ? `Read by ${readByMembers.length} ${readByMembers.length === 1 ? 'member' : 'members'}`
                        : 'Not read yet'
                      }
                    </p>
                  )}
                </div>
                {hasBeenRead && (
                  <CheckCheck size={18} className="text-blue-500 dark:text-blue-400 mt-2" />
                )}
              </div>
            </div>

            {/* Group Read Receipts */}
            {isGroupMessage && (
              <div className="space-y-4">
                {/* Read By with individual timestamps */}
                {readByMembers.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCheck size={16} className="text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Read by {readByMembers.length}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {readByMembers.map((member) => (
                        <div key={member.userId} className="flex items-center gap-3">
                          <Avatar 
                            userAvatar={member.avatar} 
                            name={member.userName} 
                            size="w-8 h-8" 
                          />
                          <div className="flex-1">
                            <p className="text-sm text-blue-900 dark:text-blue-300">{member.userName}</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              {formatDateTime(
                                isNewReadByFormat() 
                                  ? getUserReadTime(member.userId) 
                                  : message.readAt
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Read By */}
                {notReadByMembers.length > 0 && (
                  <div className="bg-gray-50 dark:bg-[#101010] border border-gray-200 dark:border-[#232529] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Check size={16} className="text-gray-600 dark:text-gray-400" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Delivered to {notReadByMembers.length}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {notReadByMembers.map((member) => (
                        <div key={member.userId} className="flex items-center gap-3">
                          <Avatar 
                            userAvatar={member.avatar} 
                            name={member.userName} 
                            size="w-8 h-8" 
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white">{member.userName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Not read yet</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Additional Info */}
            {message.edited && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">Edited Message</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {message.editedAt ? formatDateTime(message.editedAt) : 'Edit time not available'}
                </p>
              </div>
            )}

            {message.deleted && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">Deleted Message</p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  {message.deletedAt ? formatDateTime(message.deletedAt) : 'Deletion time not available'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#f1f3f4] dark:border-[#181A1E] flex justify-end sticky bottom-0 bg-white dark:bg-[#0c0c0c]">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#34A853] text-white rounded-full hover:bg-[#2D9249] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}