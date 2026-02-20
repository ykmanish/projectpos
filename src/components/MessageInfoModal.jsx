"use client";

import { X, Check, CheckCheck, Send as SendIcon, Eye, ChevronLeft, Clock, Users } from "lucide-react";
import { BeanHead } from "beanheads";

// ─── Card Color Palette (matches reference design) ─────────────────
const CARD_PALETTES = [
  { bg: '#FF8C78', track: '#c96b58', bar: '#1a0a08', text: '#1a0a08', sub: '#7a3028' },
  { bg: '#FFB8C6', track: '#d98898', bar: '#1a0810', text: '#1a0810', sub: '#7a3050' },
  { bg: '#7DCFCC', track: '#4eaaa7', bar: '#082020', text: '#082020', sub: '#1a5a58' },
  { bg: '#F5E09A', track: '#c8b860', bar: '#1a1408', text: '#1a1408', sub: '#6a5020' },
  { bg: '#A8D8FF', track: '#70b0e0', bar: '#081220', text: '#081220', sub: '#204870' },
  { bg: '#B8E8B0', track: '#80c078', bar: '#081408', text: '#081408', sub: '#205820' },
  { bg: '#E0C8F8', track: '#b090d0', bar: '#120820', text: '#120820', sub: '#503878' },
  { bg: '#FFD4A0', track: '#d8a060', bar: '#1a0e04', text: '#1a0e04', sub: '#7a4818' },
];

const getCardPalette = (title = '') => {
  const idx = (title.charCodeAt(0) || 0) % CARD_PALETTES.length;
  return CARD_PALETTES[idx];
};

// Helper function to parse avatar (BeanHead config)
const parseAvatar = (avatarData) => {
  if (!avatarData) return null;
  
  try {
    if (typeof avatarData === 'object') return avatarData;
    const parsed = JSON.parse(avatarData);
    return parsed;
  } catch (e) {
    console.error('Failed to parse avatar:', e);
    return null;
  }
};

// Helper function to get beanConfig from avatar
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

// ─── Member Avatar Component ─────────────────────────────────────
const MemberAvatar = ({ member, size = 8 }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (member?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(member?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 bg-[#e8f0fe]`}>
      {beanConfig ? (
        <BeanHead {...beanConfig} />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
          <span className="text-white text-xs font-bold">{member?.userName?.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

// ─── Timeline Item Component ─────────────────────────────────────
const TimelineItem = ({ icon: Icon, title, time, status, isCompleted, color = 'blue' }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      sub: 'text-blue-700'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-900',
      sub: 'text-green-700'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-400',
      text: 'text-gray-400',
      sub: 'text-gray-400'
    }
  };

  const colors = colorClasses[isCompleted ? color : 'gray'];

  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={colors.icon} />
      </div>
      <div className="flex-1 pt-1">
        <p className={`text-sm font-medium mb-1 ${colors.text}`}>{title}</p>
        <p className={`text-xs ${colors.sub}`}>{time}</p>
        {status && <p className={`text-xs mt-1 ${colors.sub}`}>{status}</p>}
      </div>
      {isCompleted && <Icon size={18} className={`${colors.icon} mt-2`} />}
    </div>
  );
};

// ─── Read Receipt Section Component ──────────────────────────────
const ReadReceiptSection = ({ title, count, members, icon: Icon, color = 'blue', showTime = false, formatDateTime }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      text: 'text-blue-700'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-400',
      title: 'text-gray-400',
      text: 'text-gray-400'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} rounded-3xl p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className={colors.icon} />
        <p className={`text-sm font-medium ${colors.title}`}>
          {title} · {count}
        </p>
      </div>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.userId} className="flex items-center gap-3">
            <MemberAvatar member={member} size={9} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${colors.title}`}>{member.userName}</p>
              {showTime && member.readAt ? (
                <p className={`text-xs ${colors.text}`}>
                  {formatDateTime(member.readAt)}
                </p>
              ) : showTime ? (
                <p className={`text-xs ${colors.text}`}>
                  Read time not available
                </p>
              ) : (
                <p className={`text-xs ${colors.text}`}>
                  Not read yet
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
            readAt: read.readAt || read.timestamp || null
          };
        })
        .filter(member => member); // Remove any undefined members
    } else {
      // Old format - array of userIds
      return groupMembers
        .filter(member => 
          message.readBy?.includes(member.userId) && member.userId !== message.senderId
        )
        .map(member => ({
          ...member,
          readAt: message.readAt || null // Use message readAt as fallback
        }));
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

  const readByMembers = getReadByMembers();
  const notReadByMembers = getNotReadByMembers();

  // Determine if message has been read by anyone (for overall read status)
  const hasBeenRead = isGroupMessage 
    ? readByMembers.length > 0 
    : message.read;

  const palette = getCardPalette('Message Info');

  // Debug log to see what's in readByMembers
  console.log('readByMembers with times:', readByMembers);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div
        className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
        
          <h2 className="text-lg font-bold text-gray-900">Message Info</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Info Card */}
        <div className="px-5 mb-4">
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                <Clock size={24} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  Message Timeline
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  {isGroupMessage ? 'Group message status' : 'Direct message status'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6 min-h-0">
          {/* Timeline */}
          <div className="space-y-4">
            <TimelineItem
              icon={SendIcon}
              title="Sent"
              time={formatDateTime(message.timestamp)}
              isCompleted={true}
              color="blue"
            />

            <TimelineItem
              icon={CheckCheck}
              title="Delivered"
              time={message.deliveredAt ? formatDateTime(message.deliveredAt) : message.delivered ? 'Delivered' : 'Not delivered yet'}
              status={message.delivered ? '' : ''}
              isCompleted={message.delivered}
              color="green"
            />

            <TimelineItem
              icon={Eye}
              title="Read"
              time={
                !isGroupMessage
                  ? (message.readAt ? formatDateTime(message.readAt) : message.read ? 'Read' : 'Not read yet')
                  : (readByMembers.length > 0 ? `Read by ${readByMembers.length} members` : 'Not read yet')
              }
              status={
                !isGroupMessage && message.read && friendName
                  ? `Read by ${friendName}`
                  : ''
              }
              isCompleted={hasBeenRead}
              color="blue"
            />
          </div>

          {/* Group Read Receipts */}
          {isGroupMessage && (
            <div className="space-y-3">
              {/* Read By with individual timestamps */}
              {readByMembers.length > 0 && (
                <ReadReceiptSection
                  title="Read by"
                  count={readByMembers.length}
                  members={readByMembers}
                  icon={CheckCheck}
                  color="blue"
                  showTime={true}
                  formatDateTime={formatDateTime}
                />
              )}

              {/* Not Read By */}
              {notReadByMembers.length > 0 && (
                <ReadReceiptSection
                  title="Delivered to"
                  count={notReadByMembers.length}
                  members={notReadByMembers}
                  icon={Check}
                  color="gray"
                  showTime={false}
                  formatDateTime={formatDateTime}
                />
              )}
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-2">
            {message.edited && (
              <div className="p-4 bg-amber-50 rounded-2xl">
                <p className="text-xs font-medium text-amber-800 mb-1">Edited Message</p>
                <p className="text-xs text-amber-700">
                  {message.editedAt ? formatDateTime(message.editedAt) : 'Edit time not available'}
                </p>
              </div>
            )}

            {message.deleted && (
              <div className="p-4 bg-red-50 rounded-2xl">
                <p className="text-xs font-medium text-red-800 mb-1">Deleted Message</p>
                <p className="text-xs text-red-700">
                  {message.deletedAt ? formatDateTime(message.deletedAt) : 'Deletion time not available'}
                </p>
              </div>
            )}
          </div>

          {/* Message Preview */}
          
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}