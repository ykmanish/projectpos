'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, UserMinus, Ban, Shield, ShieldCheck, 
  Calendar, Award, MessageCircle, AlertTriangle,
  ChevronLeft, Users, Trophy, Star, Lock
} from 'lucide-react';
import { BeanHead } from 'beanheads';
import Image from 'next/image';

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
const SquareAvatar = ({ user, size = 14 }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (user?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(user?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 bg-[#e8f0fe]`}>
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

// ─── Tier Badge Component ─────────────────────────────────────────
const TierBadge = ({ tier, points }) => {
  const tierColors = {
    'Bronze': { bg: '', text: 'text-amber-700', icon: '/bronze.svg' },
    'Silver': { bg: 'bg-gray-100', text: 'text-gray-600', icon: '/silver.svg' },
    'Gold': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '/gold.svg' },
    'Platinum': { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: '/platinum.svg' },
    'Diamond': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '/diamond.svg' },
    'Obsidian': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '/obsidian.svg' },
    'Opal': { bg: 'bg-pink-100', text: 'text-pink-700', icon: '/opal.svg' },
    'Ultimate': { bg: 'bg-gradient-to-r from-red-100 to-orange-100', text: 'text-red-700', icon: '/ultimate.svg' },
  };

  const colors = tierColors[tier?.name] || tierColors.Bronze;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 ${colors.bg} rounded-full`}>
      {tier?.icon && (
        <Image src={tier.icon} alt={tier.name} width={48} height={48} className="object-contain" />
      )}
      
    </div>
  );
};

// ─── Action Button Component ──────────────────────────────────────
const ActionButton = ({ icon: Icon, onClick, children, variant = 'primary', disabled = false }) => {
  const variants = {
    primary: 'bg-black hover:bg-gray-900 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700',
    warning: 'bg-orange-50 hover:bg-orange-100 text-orange-700',
    info: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-2xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${disabled ? variants.disabled : variants[variant]}`}
    >
      <Icon size={18} strokeWidth={2.5} />
      {children}
    </button>
  );
};

// ─── Confirmation Card Component ──────────────────────────────────
const ConfirmationCard = ({ type, userName, onConfirm, onCancel, loading }) => {
  const config = {
    unfriend: {
      icon: UserMinus,
      color: 'orange',
      title: `Unfriend ${userName}?`,
      description: 'You will no longer be friends. This action can be undone by sending another friend request.',
      confirmText: 'Unfriend'
    },
    block: {
      icon: Ban,
      color: 'red',
      title: `Block ${userName}?`,
      description: 'They won\'t be able to message you or see your profile. You can unblock them anytime.',
      confirmText: 'Block'
    },
    unblock: {
      icon: ShieldCheck,
      color: 'blue',
      title: `Unblock ${userName}?`,
      description: 'They will be able to message you again.',
      confirmText: 'Unblock'
    }
  };

  const cfg = config[type];
  const Icon = cfg.icon;
  const colorClasses = {
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      title: 'text-orange-800',
      desc: 'text-orange-700',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      title: 'text-red-800',
      desc: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700'
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      desc: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const colors = colorClasses[cfg.color];

  return (
    <div className={`p-4 ${colors.bg} rounded-3xl space-y-3 animate-fade-in`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={`${colors.icon} flex-shrink-0 mt-0.5`} />
        <div>
          <p className={`text-sm font-medium ${colors.title}`}>{cfg.title}</p>
          <p className={`text-xs ${colors.desc} mt-1`}>{cfg.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 ${colors.button} text-white rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            cfg.confirmText
          )}
        </button>
      </div>
    </div>
  );
};

export default function UserInfoModal({ 
  isOpen, 
  onClose, 
  user, 
  currentUserId,
  friendshipStatus,
  onUnfriend,
  onBlock,
  onUnblock,
  onSendMessage
}) {
  const [userPoints, setUserPoints] = useState(0);
  const [userTier, setUserTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [blockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false
  });
  const [userCreatedAt, setUserCreatedAt] = useState(null);
  const [userFullData, setUserFullData] = useState(null);

  // Define badge tiers with icons
  const tiers = [
    { 
      name: 'Bronze', 
      min: 0, 
      max: 999, 
      nextRequirement: 1000,
      icon: '/bronze.svg',
      bgColor: 'bg-amber-600',
      textColor: 'text-amber-600',
      darkBgColor: 'bg-amber-600',
      darkTextColor: 'text-amber-500'
    },
    { 
      name: 'Silver', 
      min: 1000, 
      max: 3999, 
      nextRequirement: 4000,
      icon: '/silver.svg',
      bgColor: 'bg-gray-400',
      textColor: 'text-gray-500',
      darkBgColor: 'bg-gray-400',
      darkTextColor: 'text-gray-400'
    },
    { 
      name: 'Gold', 
      min: 4000, 
      max: 9999, 
      nextRequirement: 10000,
      icon: '/gold.svg',
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      darkBgColor: 'bg-yellow-500',
      darkTextColor: 'text-yellow-500'
    },
    { 
      name: 'Platinum', 
      min: 10000, 
      max: 19999, 
      nextRequirement: 20000,
      icon: '/platinum.svg',
      bgColor: 'bg-cyan-600',
      textColor: 'text-cyan-600',
      darkBgColor: 'bg-cyan-600',
      darkTextColor: 'text-cyan-400'
    },
    { 
      name: 'Diamond', 
      min: 20000, 
      max: 34999, 
      nextRequirement: 35000,
      icon: '/diamond.svg',
      bgColor: 'bg-blue-600',
      textColor: 'text-blue-600',
      darkBgColor: 'bg-blue-600',
      darkTextColor: 'text-blue-400'
    },
    { 
      name: 'Obsidian', 
      min: 35000, 
      max: 59999, 
      nextRequirement: 60000,
      icon: '/obsidian.svg',
      bgColor: 'bg-purple-900',
      textColor: 'text-purple-900',
      darkBgColor: 'bg-purple-800',
      darkTextColor: 'text-purple-400'
    },
    { 
      name: 'Opal', 
      min: 60000, 
      max: 79999, 
      nextRequirement: 80000,
      icon: '/opal.svg',
      bgColor: 'bg-pink-400',
      textColor: 'text-pink-500',
      darkBgColor: 'bg-pink-500',
      darkTextColor: 'text-pink-400'
    },
    { 
      name: 'Ultimate', 
      min: 80000, 
      max: Infinity, 
      nextRequirement: null,
      icon: '/ultimate.svg',
      bgColor: 'bg-gradient-to-r from-red-600 via-red-500 to-red-500',
      textColor: 'text-red-600',
      darkBgColor: 'bg-gradient-to-r from-red-600 via-red-500 to-red-500',
      darkTextColor: 'text-red-400'
    },
  ];

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchUserPoints();
      checkBlockStatus();
      fetchUserFullData();
    }
  }, [isOpen, user]);

  const fetchUserFullData = async () => {
    try {
      const res = await fetch(`/api/user?userId=${user.userId}`);
      const data = await res.json();
      if (data.user) {
        setUserFullData(data.user);
        setUserPoints(data.user.points || 0);
        
        if (data.user.createdAt) {
          setUserCreatedAt(data.user.createdAt);
        }
        
        const tier = tiers.find(t => data.user.points >= t.min && data.user.points <= t.max) || tiers[0];
        setUserTier(tier);
      }
    } catch (error) {
      console.error('Error fetching user full data:', error);
    }
  };

  const checkBlockStatus = async () => {
    try {
      const iBlockedRes = await fetch(`/api/friends/blocked/check?userId=${currentUserId}&targetId=${user.userId}`);
      const iBlockedData = await iBlockedRes.json();
      
      const theyBlockedRes = await fetch(`/api/friends/blocked/check?userId=${user.userId}&targetId=${currentUserId}`);
      const theyBlockedData = await theyBlockedRes.json();
      
      setBlockStatus({
        iBlockedThem: iBlockedData.success && iBlockedData.isBlocked,
        theyBlockedMe: theyBlockedData.success && theyBlockedData.isBlocked
      });
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const res = await fetch(`/api/user?userId=${user.userId}`);
      const data = await res.json();
      if (data.user) {
        setUserPoints(data.user.points || 0);
        const tier = tiers.find(t => data.user.points >= t.min && data.user.points <= t.max) || tiers[0];
        setUserTier(tier);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const handleUnfriend = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/friends/unfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, friendId: user.userId }),
      });
      const data = await res.json();
      if (data.success) {
        onUnfriend?.();
        onClose();
      }
    } catch (error) {
      console.error('Error unfriending:', error);
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/friends/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, blockedId: user.userId }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockStatus(prev => ({ ...prev, iBlockedThem: true }));
        onBlock?.(user.userId);
        setShowConfirm(null);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/friends/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, blockedId: user.userId }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockStatus(prev => ({ ...prev, iBlockedThem: false }));
        onUnblock?.(user.userId);
        setShowConfirm(null);
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (blockStatus.theyBlockedMe) {
      alert("You cannot send a message to this user because they have blocked you.");
      return;
    }
    onSendMessage?.(user);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      if (userFullData?.createdAt) {
        return formatDate(userFullData.createdAt);
      }
      return 'Date not available';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  if (!isOpen || !user) return null;

  const isBlocked = blockStatus.iBlockedThem;
  const isBlockedByThem = blockStatus.theyBlockedMe;
  const isFriend = friendshipStatus === 'friends' && !isBlocked && !isBlockedByThem;
  const isPending = friendshipStatus === 'pending_sent' || friendshipStatus === 'pending_received';

  const memberSinceDate = userCreatedAt || userFullData?.createdAt || user?.createdAt;
  const palette = getCardPalette(user.userName);

  const pointsToNextTier = userTier?.nextRequirement ? userTier.nextRequirement - userPoints : null;
  const progressPercentage = userTier?.nextRequirement 
    ? Math.min(100, ((userPoints - userTier.min) / (userTier.nextRequirement - userTier.min)) * 100)
    : 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          {/* <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={17} className="text-gray-700" />
          </button> */}
          <h2 className="text-lg font-bold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5 min-h-0">
          {/* User Info Card */}
          <div className="rounded-3xl bg-cyan-100 p-5" >
            <div className="flex items-center gap-4 mb-4">
              <SquareAvatar user={user} size={16} />
              <div className="flex-1">
                <h3 className="text-2xl font-extrabold" style={{ color: palette.text }}>
                  {user.userName}
                </h3>
                {user.username && (
                  <p className="text-sm mt-1" style={{ color: palette.sub }}>
                    @{user.username}
                  </p>
                )}
              </div>
              {/* Block indicator */}
              {(isBlocked || isBlockedByThem) && (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isBlocked ? 'bg-red-500/20' : 'bg-orange-500/20'
                }`}>
                  <Ban size={20} className={isBlocked ? 'text-red-600' : 'text-orange-600'} />
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/30">
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: palette.sub }} />
                <span className="text-sm font-medium" style={{ color: palette.text }}>
                  Friendship Status
                </span>
              </div>
              <span className={`text-xs  px-3 py-1.5 rounded-full ${
                isBlocked ? 'bg-red-500/20 text-red-700' :
                isBlockedByThem ? 'bg-orange-500/20 text-orange-700' :
                isFriend ? 'bg-green-500/20 text-green-700' :
                isPending ? 'bg-yellow-500/20 text-yellow-700' :
                'bg-gray-500/20 text-gray-700'
              }`}>
                {isBlocked ? 'You Blocked' :
                 isBlockedByThem ? 'Blocked You' :
                 isFriend ? 'Friends' :
                 isPending ? 'Pending' :
                 'Not Friends'}
              </span>
            </div>
          </div>

          

          {/* Points Progress Card */}
          <div className="rounded-3xl p-5 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
               <TierBadge tier={userTier}  />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Points Progress</p>
                <p className="text-xs text-gray-400">Total points earned</p>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-extrabold text-gray-900">{userPoints}</span>
              <span className="text-sm text-gray-400">points</span>
            </div>

            {/* Progress to Next Tier */}
            {userTier?.nextRequirement && (
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500">{userTier.name}</span>
                  {/* <span className="text-gray-500">Next: {tiers[tiers.indexOf(userTier) + 1]?.name}</span> */}
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {pointsToNextTier} points needed for next tier
                </p>
              </div>
            )}
          </div>

          {/* Blocked Warnings */}
          {isBlocked && (
            <div className="p-4 bg-red-50 rounded-3xl">
              <div className="flex items-start gap-3">
                <Ban size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">You Blocked This User</p>
                  <p className="text-xs text-red-700 mt-1">
                    You have blocked this user. They cannot message you.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isBlockedByThem && !isBlocked && (
            <div className="p-4 bg-orange-50 rounded-3xl">
              <div className="flex items-start gap-3">
                <Ban size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">This User Blocked You</p>
                  <p className="text-xs text-orange-700 mt-1">
                    This user has blocked you. You cannot message them.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Send Message Button */}
            <ActionButton
              icon={MessageCircle}
              onClick={handleSendMessage}
              variant={isBlockedByThem ? 'disabled' : 'primary'}
              disabled={isBlockedByThem}
            >
              {isBlockedByThem ? 'Cannot Send Message' : 'Send Message'}
            </ActionButton>

            {/* Unfriend Button */}
            {isFriend && !isBlocked && !isBlockedByThem && !showConfirm && (
              <ActionButton
                icon={UserMinus}
                onClick={() => setShowConfirm('unfriend')}
                variant="warning"
              >
                Unfriend
              </ActionButton>
            )}

            {/* Block/Unblock Buttons */}
            {!isBlockedByThem && !showConfirm && (
              isBlocked ? (
                <ActionButton
                  icon={ShieldCheck}
                  onClick={() => setShowConfirm('unblock')}
                  variant="info"
                >
                  Unblock User
                </ActionButton>
              ) : (
                <ActionButton
                  icon={Ban}
                  onClick={() => setShowConfirm('block')}
                  variant="danger"
                >
                  Block User
                </ActionButton>
              )
            )}

            {/* Confirmation Cards */}
            {showConfirm === 'unfriend' && (
              <ConfirmationCard
                type="unfriend"
                userName={user.userName}
                onConfirm={handleUnfriend}
                onCancel={() => setShowConfirm(null)}
                loading={loading}
              />
            )}

            {showConfirm === 'block' && (
              <ConfirmationCard
                type="block"
                userName={user.userName}
                onConfirm={handleBlock}
                onCancel={() => setShowConfirm(null)}
                loading={loading}
              />
            )}

            {showConfirm === 'unblock' && (
              <ConfirmationCard
                type="unblock"
                userName={user.userName}
                onConfirm={handleUnblock}
                onCancel={() => setShowConfirm(null)}
                loading={loading}
              />
            )}
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
            <Calendar size={14} className="text-gray-400" />
            <p className="text-xs text-gray-400">
              Member since {formatDate(memberSinceDate)}
            </p>
          </div>
        </div>
      </motion.div>

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