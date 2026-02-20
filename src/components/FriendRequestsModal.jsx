"use client";

import { X, Check, Clock, Users, ChevronLeft, UserPlus, Calendar } from "lucide-react";
import { BeanHead } from "beanheads";
import { useState } from "react";

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

// ─── Rounded Square Avatar ─────────────────────────────────────────
const SquareAvatar = ({ user, size = 12 }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (user?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(user?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-2xl overflow-hidden flex-shrink-0 bg-[#e8f0fe]`}>
      {beanConfig ? (
        <BeanHead {...beanConfig} />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
          <span className="text-white font-bold text-lg">{user?.userName?.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

// ─── Request Card Component ───────────────────────────────────────
const RequestCard = ({ request, onAccept, onReject, palette }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    await onAccept(request._id);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(request._id);
    setIsProcessing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-3xl p-4" style={{ backgroundColor: palette.bg }}>
      <div className="flex items-center gap-4">
        <SquareAvatar user={request} size={14} />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-extrabold" style={{ color: palette.text }}>
              {request.userName}
            </h3>
            {request.username && (
              <span className="text-xs" style={{ color: palette.sub }}>
                @{request.username}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs" style={{ color: palette.sub }}>
            <Clock size={12} />
            <span>Requested {formatDate(request.sentAt)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${palette.text}20` }}
          >
            <Check size={18} style={{ color: palette.text }} />
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#FF8C7820' }}
          >
            <X size={18} className="text-[#FF8C78]" />
          </button>
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mt-3 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: palette.text }} />
        </div>
      )}
    </div>
  );
};

export default function FriendRequestsModal({ isOpen, onClose, requests, onAccept, onReject }) {
  const [processingIds, setProcessingIds] = useState(new Set());

  if (!isOpen) return null;

  const palette = getCardPalette('Friend Requests');

  const handleAccept = async (requestId) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    await onAccept(requestId);
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  };

  const handleReject = async (requestId) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    await onReject(requestId);
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div 
        className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          
          <h2 className="text-lg font-bold text-gray-900">Friend Requests</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Stats Card */}
        <div className="px-5 mb-4">
          <div className="rounded-3xl p-4" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center">
                <UserPlus size={24} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  {requests.length} Pending
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  {requests.length === 1 ? 'Request awaiting your response' : 'Requests awaiting your response'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                <Users size={36} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-medium">No pending requests</p>
                <p className="text-sm text-gray-300 mt-1">
                  When someone sends you a friend request, it will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  palette={getCardPalette(request.userName)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with close button for empty state */}
        {requests.length === 0 && (
          <div className="px-5 pb-7 pt-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}