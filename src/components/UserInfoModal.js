'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, UserMinus, Ban, Shield, ShieldCheck, 
  Calendar, Award, MessageCircle, AlertTriangle
} from 'lucide-react';
import { BeanHead } from 'beanheads';
import Image from 'next/image';

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
      textColor: 'text-amber-600'
    },
    { 
      name: 'Silver', 
      min: 1000, 
      max: 3999, 
      nextRequirement: 4000,
      icon: '/silver.svg',
      bgColor: 'bg-gray-400',
      textColor: 'text-gray-500'
    },
    { 
      name: 'Gold', 
      min: 4000, 
      max: 9999, 
      nextRequirement: 10000,
      icon: '/gold.svg',
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    { 
      name: 'Platinum', 
      min: 10000, 
      max: 19999, 
      nextRequirement: 20000,
      icon: '/platinum.svg',
      bgColor: 'bg-cyan-600',
      textColor: 'text-cyan-600'
    },
    { 
      name: 'Diamond', 
      min: 20000, 
      max: 34999, 
      nextRequirement: 35000,
      icon: '/diamond.svg',
      bgColor: 'bg-blue-600',
      textColor: 'text-blue-600'
    },
    { 
      name: 'Obsidian', 
      min: 35000, 
      max: 59999, 
      nextRequirement: 60000,
      icon: '/obsidian.svg',
      bgColor: 'bg-purple-900',
      textColor: 'text-purple-900'
    },
    { 
      name: 'Opal', 
      min: 60000, 
      max: 79999, 
      nextRequirement: 80000,
      icon: '/opal.svg',
      bgColor: 'bg-pink-400',
      textColor: 'text-pink-500'
    },
    { 
      name: 'Ultimate', 
      min: 80000, 
      max: Infinity, 
      nextRequirement: null,
      icon: '/ultimate.svg',
      bgColor: 'bg-gradient-to-r from-red-600 via-red-500 to-red-500',
      textColor: 'text-red-600'
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
        
        // Extract createdAt from user data
        if (data.user.createdAt) {
          setUserCreatedAt(data.user.createdAt);
        }
        
        // Find current tier
        const tier = tiers.find(t => data.user.points >= t.min && data.user.points <= t.max) || tiers[0];
        setUserTier(tier);
      }
    } catch (error) {
      console.error('Error fetching user full data:', error);
    }
  };

  const checkBlockStatus = async () => {
    try {
      // Check if current user blocked the target user
      const iBlockedRes = await fetch(`/api/friends/blocked/check?userId=${currentUserId}&targetId=${user.userId}`);
      const iBlockedData = await iBlockedRes.json();
      
      // Check if target user blocked the current user
      const theyBlockedRes = await fetch(`/api/friends/blocked/check?userId=${user.userId}&targetId=${currentUserId}`);
      const theyBlockedData = await theyBlockedRes.json();
      
      setBlockStatus({
        iBlockedThem: iBlockedData.success && iBlockedData.isBlocked,
        theyBlockedMe: theyBlockedData.success && theyBlockedData.isBlocked
      });
      
      console.log('🔍 Block status in modal:', {
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
        
        // Find current tier
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
    // Check if they blocked me - prevent sending message
    if (blockStatus.theyBlockedMe) {
      alert("You cannot send a message to this user because they have blocked you.");
      return;
    }
    
    // Allow sending message even if I blocked them (but they'll get a warning)
    onSendMessage?.(user);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      // If we have userFullData but no createdAt, try to get it from there
      if (userFullData?.createdAt) {
        return formatDate(userFullData.createdAt);
      }
      return 'Date not available';
    }
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
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

  // Determine the actual block status
  const isBlocked = blockStatus.iBlockedThem;
  const isBlockedByThem = blockStatus.theyBlockedMe;
  const isFriend = friendshipStatus === 'friends' && !isBlocked && !isBlockedByThem;
  const isPending = friendshipStatus === 'pending_sent' || friendshipStatus === 'pending_received';

  // Parse user avatar
  let userAvatar = null;
  if (user.avatar) {
    try {
      userAvatar = typeof user.avatar === 'string' ? JSON.parse(user.avatar) : user.avatar;
    } catch (e) {
      console.error('Failed to parse user avatar', e);
    }
  }

  // Get initials for fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get the createdAt date (try multiple sources)
  const memberSinceDate = userCreatedAt || userFullData?.createdAt || user?.createdAt;

  // Calculate progress to next tier
  const pointsToNextTier = userTier?.nextRequirement ? userTier.nextRequirement - userPoints : null;
  const progressPercentage = userTier?.nextRequirement 
    ? Math.min(100, ((userPoints - userTier.min) / (userTier.nextRequirement - userTier.min)) * 100)
    : 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-[30px] max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#000000]">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* User Avatar & Basic Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center text-white font-semibold text-2xl">
                {userAvatar?.beanConfig ? (
                  <BeanHead {...userAvatar.beanConfig} />
                ) : (
                  getInitials(user.userName)
                )}
              </div>
              {isBlocked && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                  <Ban size={12} className="text-white" />
                </span>
              )}
              {isBlockedByThem && !isBlocked && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center">
                  <Ban size={12} className="text-white" />
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-[#000000]">{user.userName}</h3>
              {user.username && (
                <p className="text-[#5f6368]">@{user.username}</p>
              )}
            </div>
          </div>

          {/* Tier Badge - Enhanced Display */}
          <div className="mb-6 p-4 bg-gray-100  rounded-3xl  border-gray-200">
            <div className="flex items-center gap-4">
              {/* Tier Icon */}
              <div className={`w-20 h-20 rounded-full  flex items-center justify-center `}>
                {userTier?.icon && (
                  <Image 
                    src={userTier.icon} 
                    alt={userTier.name}
                    width={70}
                    height={70}
                    className="object-contain"
                  />
                )}
              </div>
              
              {/* Tier Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg font-bold ${userTier?.textColor || 'text-amber-600'}`}>
                    {userTier?.name || 'Bronze'}
                  </span>
                  <span className="text-sm text-[#5f6368]">Tier</span>
                </div>
                
                {/* Points Display */}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#202124]">{userPoints}</span>
                  <span className="text-sm text-[#5f6368]">points</span>
                </div>
                
                {/* Progress to Next Tier */}
                {userTier?.nextRequirement && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#5f6368]">Progress to {tiers[tiers.indexOf(userTier) + 1]?.name}</span>
                      {/* <span className="font-medium text-[#202124]">{pointsToNextTier} points needed</span> */}
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${userTier?.bgColor || 'bg-amber-600'} rounded-full transition-all duration-300`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Points & Stats - Simplified now that we have tier info above */}
          

          {/* Status Badge */}
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5f6368]">Friendship Status</span>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                isBlocked ? 'bg-red-100 text-red-700' :
                isBlockedByThem ? 'bg-orange-100 text-orange-700' :
                isFriend ? 'bg-green-100 text-green-700' :
                isPending ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {isBlocked ? 'You Blocked' :
                 isBlockedByThem ? 'Blocked You' :
                 isFriend ? 'Friends' :
                 isPending ? 'Pending' :
                 'Not Friends'}
              </span>
            </div>
          </div>

          {/* Blocked Warning */}
          {isBlocked && (
            <div className="mb-4 p-4 bg-red-50  border-red-200 rounded-3xl">
              <div className="flex items-start gap-3">
                <Ban size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
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
            <div className="mb-4 p-4 bg-orange-50  border-orange-200 rounded-3xl">
              <div className="flex items-start gap-3">
                <Ban size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
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
            <button
              onClick={handleSendMessage}
              disabled={isBlockedByThem}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors font-medium ${
                isBlockedByThem 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
              title={isBlockedByThem ? "This user has blocked you" : "Send a message"}
            >
              <MessageCircle size={18} />
              {isBlockedByThem ? 'Cannot Send Message (Blocked)' : 'Send Message'}
            </button>

            {/* Unfriend Button (only if friends and not blocked) */}
            {isFriend && !isBlocked && !isBlockedByThem && !showConfirm && (
              <button
                onClick={() => setShowConfirm('unfriend')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-medium"
              >
                <UserMinus size={18} />
                Unfriend
              </button>
            )}

            {/* Block/Unblock Button - Only show if they haven't blocked us */}
            {!isBlockedByThem && (
              <>
                {!isBlocked && !showConfirm && (
                  <button
                    onClick={() => setShowConfirm('block')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium"
                  >
                    <Ban size={18} />
                    Block User
                  </button>
                )}

                {isBlocked && !showConfirm && (
                  <button
                    onClick={() => setShowConfirm('unblock')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                  >
                    <ShieldCheck size={18} />
                    Unblock User
                  </button>
                )}
              </>
            )}

            {/* Confirmation UI */}
            {showConfirm === 'unfriend' && (
              <div className="p-4 bg-orange-50 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Unfriend {user.userName}?</p>
                    <p className="text-xs text-orange-700 mt-1">
                      You will no longer be friends. This action can be undone by sending another friend request.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 px-3 py-2 bg-white text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnfriend}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <UserMinus size={16} />
                        <span>Unfriend</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {showConfirm === 'block' && (
              <div className="p-4 bg-red-50 rounded-3xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Block {user.userName}?</p>
                    <p className="text-xs text-red-700 mt-1">
                      They won't be able to message you or see your profile. You can unblock them anytime.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 px-3 py-2 bg-white text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Blocking...</span>
                      </>
                    ) : (
                      <>
                        <Ban size={16} />
                        <span>Block</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {showConfirm === 'unblock' && (
              <div className="p-4 bg-blue-50 rounded-3xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Unblock {user.userName}?</p>
                    <p className="text-xs text-blue-700 mt-1">
                      They will be able to message you again.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 px-3 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnblock}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Unblocking...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Unblock</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Member Since */}
          <div className="mt-6 pt-4 flex justify-center border-t border-[#f1f3f4]">
            <p className="text-xs text-[#5f6368] text-center flex items-center gap-1">
              Member since {formatDate(memberSinceDate)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}