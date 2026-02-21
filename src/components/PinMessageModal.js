'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Pin, PinOff, MessageCircle, Clock, Calendar,
  User, Users, ChevronLeft, Trash2, AlertCircle
} from 'lucide-react';
import { BeanHead } from 'beanheads';

const CARD_PALETTES = [
  { bg: '#FF8C78', text: '#1a0a08', sub: '#7a3028' },
  { bg: '#FFB8C6', text: '#1a0810', sub: '#7a3050' },
  { bg: '#7DCFCC', text: '#082020', sub: '#1a5a58' },
  { bg: '#F5E09A', text: '#1a1408', sub: '#6a5020' },
  { bg: '#A8D8FF', text: '#081220', sub: '#204870' },
  { bg: '#B8E8B0', text: '#081408', sub: '#205820' },
  { bg: '#E0C8F8', text: '#120820', sub: '#503878' },
  { bg: '#FFD4A0', text: '#1a0e04', sub: '#7a4818' },
];

const getCardPalette = (title = '') => {
  const idx = (title.charCodeAt(0) || 0) % CARD_PALETTES.length;
  return CARD_PALETTES[idx];
};

const parseAvatar = (avatarData) => {
  if (!avatarData) return null;
  try {
    if (typeof avatarData === 'object') return avatarData;
    const parsed = JSON.parse(avatarData);
    return parsed;
  } catch (e) {
    return null;
  }
};

const getBeanConfig = (avatar) => {
  const parsed = parseAvatar(avatar);
  if (!parsed) return null;
  if (typeof parsed === 'object' && parsed.beanConfig) {
    return parsed.beanConfig;
  }
  if (typeof parsed === 'object' && (parsed.mask || parsed.eyes || parsed.mouth)) {
    return parsed;
  }
  return null;
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

export default function PinMessageModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  onPinMessage,
  onUnpinMessage,
  pinnedMessages = [],
  loading = false
}) {
  const [activeTab, setActiveTab] = useState('pinned');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUnpin = async (pin) => {
    try {
      await onUnpinMessage(pin.messageTimestamp, pin.senderId);
      triggerSuccess('Message unpinned');
    } catch (err) {
      setError(err.message || 'Failed to unpin');
    }
  };

  const handleViewMessage = (pin) => {
    // This will emit an event to scroll to the message in the main chat
    if (onPinMessage.scrollToMessage) {
      onPinMessage.scrollToMessage(`${pin.messageTimestamp}-${pin.senderId}`);
    }
    onClose();
  };

  const Toast = () => (
    <div className="px-5 flex-shrink-0 mb-2">
      {showSuccess && (
        <div className="px-4 py-3 bg-black rounded-2xl text-white text-sm flex items-center gap-2 animate-fade-in">
          <Pin size={15} strokeWidth={2.5} />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={15} strokeWidth={2.5} />
          <span className="font-semibold">{error}</span>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          <button
            onClick={() => {
              if (activeTab === 'pinned') {
                onClose();
              } else {
                setActiveTab('pinned');
              }
            }}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={17} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {activeTab === 'pinned' ? 'Pinned Messages' : 'Pin a Message'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        <Toast />

        {/* Filter Pills */}
        <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
          <button
            onClick={() => setActiveTab('pinned')}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === 'pinned'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Pin size={14} />
              <span>Pinned ({pinnedMessages.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === 'pin'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <PinOff size={14} />
              <span>Pin Message</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {activeTab === 'pinned' ? (
            // PINNED MESSAGES LIST
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : pinnedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                    <Pin size={36} className="text-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">No pinned messages</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Pin important messages to keep them visible
                    </p>
                  </div>
                </div>
              ) : (
                pinnedMessages.map((pin, index) => {
                  const palette = getCardPalette(pin.messageContent || 'Pin');
                  const message = pin.message || {};

                  return (
                    <div
                      key={index}
                      className="rounded-3xl p-5 cursor-pointer active:scale-[0.98] transition-transform"
                      style={{ backgroundColor: palette.bg }}
                      onClick={() => handleViewMessage(pin)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Pin size={14} style={{ color: palette.text }} />
                          <span className="text-xs font-medium" style={{ color: palette.sub }}>
                            Pinned {formatDate(pin.pinnedAt)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnpin(pin);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                          style={{ color: palette.text }}
                        >
                          <PinOff size={14} />
                        </button>
                      </div>

                      {/* Message Content */}
                      <div className="mb-3">
                        <p className="text-sm font-medium line-clamp-3" style={{ color: palette.text }}>
                          {pin.messageContent || 'Message content not available'}
                        </p>
                      </div>

                      {/* Footer - Pinned By */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            {pin.pinnedBy?.avatar ? (
                              (() => {
                                const beanConfig = getBeanConfig(pin.pinnedBy.avatar);
                                return beanConfig ? (
                                  <BeanHead {...beanConfig} />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                    <span className="text-white text-[8px] font-bold">
                                      {pin.pinnedBy?.name?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                <span className="text-white text-[8px] font-bold">
                                  {pin.pinnedBy?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium" style={{ color: palette.sub }}>
                            {pin.pinnedBy?.name || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: palette.text }}>
                          {formatTime(pin.pinnedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // PIN A MESSAGE - Instructions
            <div className="space-y-4">
              <div className="rounded-3xl p-5" style={{ backgroundColor: '#F5E09A' }}>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                  How to Pin a Message
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Find the message you want to pin in the chat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>Long press or right-click on the message</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>Select <span className="font-bold bg-black/10 px-2 py-0.5 rounded-full">Pin Message</span> from the menu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>The message will appear here for everyone</span>
                  </li>
                </ol>

                <div className="mt-4 p-4 bg-black/10 rounded-2xl">
                  <p className="text-xs font-medium text-gray-800">
                    💡 Pinned messages are visible to all group members and help keep important information accessible.
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-4 bg-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Pin size={16} className="text-gray-600" />
                    <span className="text-xs text-gray-500">Pinned</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{pinnedMessages.length}</p>
                </div>
                <div className="rounded-2xl p-4 bg-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-gray-600" />
                    <span className="text-xs text-gray-500">Members</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{group?.members?.length || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button for Mobile */}
        <div className="px-5 pb-7 pt-3 flex-shrink-0 sm:hidden">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-800 rounded-2xl font-bold text-[15px] transition-all"
          >
            Close
          </button>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </div>
  );
}