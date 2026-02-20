// components/GroupEncryptionModal.jsx
'use client';

import { useState } from 'react';
import { X, Shield, Lock, Users, CheckCircle, ChevronLeft, Key, Fingerprint, Server, AlertCircle } from 'lucide-react';
import { BeanHead } from 'beanheads';

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

// Helper function to parse avatar (BeanHead config) - copied from SplitBillModal
const parseAvatar = (avatarData) => {
  if (!avatarData) return null;
  
  try {
    // If it's already an object, return it
    if (typeof avatarData === 'object') return avatarData;
    
    // Try to parse JSON string
    const parsed = JSON.parse(avatarData);
    return parsed;
  } catch (e) {
    // If parsing fails, return null
    console.error('Failed to parse avatar:', e);
    return null;
  }
};

// Helper function to get beanConfig from avatar - copied from SplitBillModal
const getBeanConfig = (avatar) => {
  const parsed = parseAvatar(avatar);
  
  if (!parsed) return null;
  
  // If parsed is an object with beanConfig property
  if (typeof parsed === 'object' && parsed.beanConfig) {
    return parsed.beanConfig;
  }
  
  // If parsed is the beanConfig itself (has typical BeanHead properties)
  if (typeof parsed === 'object' && (parsed.mask || parsed.eyes || parsed.mouth)) {
    return parsed;
  }
  
  return null;
};

// ─── Feature Card Component ────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const bgColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={bgColor.split(' ')[1]} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
};

// ─── Member Badge Component with BeanHead avatar ───────────────────
const MemberBadge = ({ member }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (member?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(member?.avatar);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
      <div className="w-7 h-7 rounded-xl overflow-hidden bg-[#e8f0fe] flex-shrink-0">
        {beanConfig ? (
          <BeanHead {...beanConfig} />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">{member?.userName?.charAt(0)}</span>
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-gray-700">{member?.userName}</span>
      {/* <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center ml-auto">
        <CheckCircle size={10} className="text-green-600" />
      </div> */}
    </div>
  );
};

// ─── Stacked Avatars Component (circular) ──────────────────────────
const StackedAvatars = ({ members = [], max = 4 }) => {
  const visible = members.slice(0, max);
  const extra = members.length - max;
  
  return (
    <div className="flex items-center">
      {visible.map((member, index) => {
        const beanConfig = getBeanConfig(member?.avatar);
        
        return (
          <div
            key={member.userId}
            className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden bg-gray-300 flex-shrink-0"
            style={{ zIndex: index }}
          >
            {beanConfig ? (
              <div className="w-full h-full bg-[#e8f0fe]">
                <BeanHead {...beanConfig} />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-700 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{member.userName?.charAt(0)}</span>
              </div>
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-white -ml-2 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">
          +{extra}
        </div>
      )}
    </div>
  );
};

export default function GroupEncryptionModal({ isOpen, onClose, group }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  if (!isOpen) return null;

  const palette = getCardPalette('Encryption');
  const memberCount = group?.members?.length || 0;
  const displayMembers = showAllMembers ? group?.members : group?.members?.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={17} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Encryption</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-5">
          {/* Status Card */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                <Shield size={24} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  Encrypted Group
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  All messages are end-to-end encrypted
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/30">
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: palette.sub }} />
                <span className="text-sm font-medium" style={{ color: palette.text }}>
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
              <StackedAvatars members={group?.members || []} max={5} />
            </div>
          </div>

          {/* How it works section */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <Key size={16} />
              How it works
            </h3>
            <div className="space-y-2">
              <FeatureCard
                icon={Lock}
                title="Encrypted Messages"
                description="All messages are encrypted before leaving your device"
                color="blue"
              />
              <FeatureCard
                icon={Users}
                title="Shared Group Key"
                description="Each member has their own encrypted copy of the group key"
                color="purple"
              />
              <FeatureCard
                icon={Server}
                title="Server Cannot Read"
                description="Our servers never have access to your unencrypted messages"
                color="green"
              />
            </div>
          </div>

          {/* Members section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Fingerprint size={16} />
                Encrypted Members ({memberCount})
              </h3>
              {memberCount > 5 && (
                <button
                  onClick={() => setShowAllMembers(!showAllMembers)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showAllMembers ? 'Show less' : 'Show all'}
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {displayMembers?.map(member => (
                <MemberBadge key={member.userId} member={member} />
              ))}
              {!showAllMembers && memberCount > 5 && (
                <button
                  onClick={() => setShowAllMembers(true)}
                  className="w-full py-3 text-center text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-50 rounded-xl transition-colors"
                >
                  + {memberCount - 5} more members
                </button>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="bg-amber-50 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">About Encryption</p>
                <p className="text-xs text-amber-700 mt-1">
                  Individual member verification is only available in direct chats. 
                  Group encryption ensures privacy for all group communications.
                </p>
              </div>
            </div>
          </div>

          {/* Encryption Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-3 text-center text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-50 rounded-2xl transition-colors"
          >
            {showDetails ? 'Hide technical details' : 'Show technical details'}
          </button>

          {/* Technical Details (expanded) */}
          {showDetails && (
            <div className="p-4 bg-gray-50 rounded-2xl space-y-3 animate-fade-in">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Encryption Protocol</p>
                <p className="text-sm text-gray-900">AES-256-GCM</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Key Exchange</p>
                <p className="text-sm text-gray-900">X25519 + ECDH</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Group Key Rotation</p>
                <p className="text-sm text-gray-900">Every 30 days or when members change</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-7 pt-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all"
          >
            Got it
          </button>
        </div>
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