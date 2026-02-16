"use client";

import { X, Check, CheckCheck, Send as SendIcon, Eye, Users } from "lucide-react";
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

  // Get read by members (for group messages)
  const getReadByMembers = () => {
    if (!isGroupMessage || !message.readBy || !groupMembers) return [];
    return groupMembers.filter(member => 
      message.readBy.includes(member.userId) && member.userId !== message.senderId
    );
  };

  const getNotReadByMembers = () => {
    if (!isGroupMessage || !groupMembers) return [];
    const readByIds = message.readBy || [message.senderId];
    return groupMembers.filter(member => 
      !readByIds.includes(member.userId) && member.userId !== message.senderId
    );
  };

  const readByMembers = getReadByMembers();
  const notReadByMembers = getNotReadByMembers();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[#f1f3f4] flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-[#202124]">Message Info</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-[#5f6368]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Message Preview */}
            {/* <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-[#dadce0]">
              <p className="text-xs text-[#5f6368] mb-2 font-medium">MESSAGE</p>
              {message.content ? (
                <p className="text-sm text-[#202124] break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              ) : message.attachments && message.attachments.length > 0 ? (
                <div className="flex items-center gap-2 text-sm text-[#5f6368]">
                  {message.attachments[0].type === 'image' ? '📷' : '🎥'}
                  <span>
                    {message.attachments.length} {message.attachments.length === 1 ? 'attachment' : 'attachments'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No content</p>
              )}
            </div> */}

            {/* Timeline */}
            <div className="space-y-4">
              {/* Sent */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <SendIcon size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm font-medium text-[#202124] mb-1">Sent</p>
                  <p className="text-xs text-[#5f6368]">
                    {formatDateTime(message.timestamp)}
                  </p>
                </div>
                <Check size={18} className="text-blue-600 mt-2" />
              </div>

              {/* Delivered */}
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.delivered ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <CheckCheck size={18} className={message.delivered ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-sm font-medium mb-1 ${
                    message.delivered ? 'text-[#202124]' : 'text-gray-400'
                  }`}>
                    Delivered
                  </p>
                  <p className="text-xs text-[#5f6368]">
                    {message.deliveredAt 
                      ? formatDateTime(message.deliveredAt)
                      : message.delivered 
                      ? 'Delivered'
                      : 'Not delivered yet'
                    }
                  </p>
                </div>
                {message.delivered && <CheckCheck size={18} className="text-green-600 mt-2" />}
              </div>

              {/* Read */}
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.read || (isGroupMessage && readByMembers.length > 0) ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Eye size={18} className={
                    message.read || (isGroupMessage && readByMembers.length > 0) ? 'text-blue-600' : 'text-gray-400'
                  } />
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-sm font-medium mb-1 ${
                    message.read || (isGroupMessage && readByMembers.length > 0) ? 'text-[#202124]' : 'text-gray-400'
                  }`}>
                    Read
                  </p>
                  
                  {!isGroupMessage ? (
                    <>
                      <p className="text-xs text-[#5f6368]">
                        {message.readAt 
                          ? formatDateTime(message.readAt)
                          : message.read
                          ? 'Read'
                          : 'Not read yet'
                        }
                      </p>
                      {message.read && friendName && (
                        <p className="text-xs text-[#5f6368] mt-1">
                          Read by {friendName}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[#5f6368]">
                      {readByMembers.length > 0 
                        ? `Read by ${readByMembers.length} ${readByMembers.length === 1 ? 'member' : 'members'}`
                        : 'Not read yet'
                      }
                    </p>
                  )}
                </div>
                {(message.read || (isGroupMessage && readByMembers.length > 0)) && (
                  <CheckCheck size={18} className="text-blue-500 mt-2" />
                )}
              </div>
            </div>

            {/* Group Read Receipts */}
            {isGroupMessage && (
              <div className="space-y-4">
                {/* Read By */}
                {readByMembers.length > 0 && (
                  <div className="bg-zinc-100/60  border-blue-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCheck size={16} className="text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">
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
                            <p className="text-sm text-blue-900">{member.userName}</p>
                            {message.readAt && (
                              <p className="text-xs text-blue-700">
                                {formatDateTime(message.readAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Read By */}
                {notReadByMembers.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Check size={16} className="text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">
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
                            <p className="text-sm text-gray-900">{member.userName}</p>
                            <p className="text-xs text-gray-600">Not read yet</p>
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs font-medium text-yellow-800 mb-1">Edited Message</p>
                <p className="text-xs text-yellow-700">
                  {message.editedAt ? formatDateTime(message.editedAt) : 'Edit time not available'}
                </p>
              </div>
            )}

            {message.deleted && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-medium text-red-800 mb-1">Deleted Message</p>
                <p className="text-xs text-red-700">
                  {message.deletedAt ? formatDateTime(message.deletedAt) : 'Deletion time not available'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#f1f3f4] flex justify-end sticky bottom-0 bg-white">
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
