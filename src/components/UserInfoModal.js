'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, UserMinus, Ban, Shield, ShieldCheck, 
  Calendar, Award, MessageCircle, AlertTriangle
} from 'lucide-react';
import { BeanHead } from 'beanheads';

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
  const [localBlockStatus, setLocalBlockStatus] = useState(friendshipStatus === 'blocked');

  // Define badge tiers
  const tiers = [
    { name: 'Bronze', min: 0, max: 999, color: 'bg-amber-600', icon: '🥉' },
    { name: 'Silver', min: 1000, max: 3999, color: 'bg-gray-400', icon: '🥈' },
    { name: 'Gold', min: 4000, max: 9999, color: 'bg-yellow-500', icon: '🥇' },
    { name: 'Platinum', min: 10000, max: 19999, color: 'bg-cyan-600', icon: '💎' },
    { name: 'Diamond', min: 20000, max: 34999, color: 'bg-blue-600', icon: '🔷' },
    { name: 'Obsidian', min: 35000, max: 59999, color: 'bg-purple-900', icon: '🪨' },
    { name: 'Opal', min: 60000, max: 79999, color: 'bg-pink-400', icon: '✨' },
    { name: 'Ultimate', min: 80000, max: Infinity, color: 'bg-gradient-to-r from-purple-600 via-pink-500 to-red-500', icon: '🏆' },
  ];

  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchUserPoints();
      setLocalBlockStatus(friendshipStatus === 'blocked');
    }
  }, [isOpen, user, friendshipStatus]);

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
        setLocalBlockStatus(true); // Update local state immediately
        onBlock?.(user.userId); // Pass userId to parent
        setShowConfirm(null);
        // Don't close modal immediately - let user see the updated state
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
        setLocalBlockStatus(false); // Update local state immediately
        onUnblock?.(user.userId); // Pass userId to parent
        setShowConfirm(null);
        // Don't close modal immediately - let user see the updated state
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
  // Allow opening chat even if blocked
  onSendMessage?.(user);
  onClose();
};


  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen || !user) return null;

  const isBlocked = localBlockStatus;
  const isFriend = friendshipStatus === 'friends' && !isBlocked;
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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-[#202124]">{user.userName}</h3>
              {user.username && (
                <p className="text-[#5f6368]">@{user.username}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {userTier && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${userTier.color}`}>
                    {userTier.icon} {userTier.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Points & Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{userPoints}</p>
              <p className="text-xs text-[#5f6368]">Total Points</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {userTier ? userTier.name : 'Bronze'}
              </p>
              <p className="text-xs text-[#5f6368]">Current Tier</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5f6368]">Friendship Status</span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                isBlocked ? 'bg-red-100 text-red-700' :
                isFriend ? 'bg-green-100 text-green-700' :
                isPending ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {isBlocked ? 'Blocked' :
                 isFriend ? 'Friends' :
                 isPending ? 'Pending' :
                 'Not Friends'}
              </span>
            </div>
          </div>

          {/* Blocked Warning */}
          {isBlocked && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <Ban size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">User Blocked</p>
                  <p className="text-xs text-red-700 mt-1">
                    You have blocked this user. They cannot message you or see your profile.
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
              disabled={isBlocked}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors font-medium ${
                isBlocked 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <MessageCircle size={18} />
              {isBlocked ? 'Cannot Send Message (Blocked)' : 'Send Message'}
            </button>

            {/* Unfriend Button (only if friends and not blocked) */}
            {isFriend && !isBlocked && !showConfirm && (
              <button
                onClick={() => setShowConfirm('unfriend')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-medium"
              >
                <UserMinus size={18} />
                Unfriend
              </button>
            )}

            {/* Block/Unblock Button */}
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
              <div className="p-4 bg-red-50 rounded-xl space-y-3">
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
              <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Unblock {user.userName}?</p>
                    <p className="text-xs text-blue-700 mt-1">
                      They will be able to message you and see your profile again.
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
          <div className="mt-6 pt-4 border-t border-[#f1f3f4]">
            <p className="text-xs text-[#5f6368] flex items-center gap-1">
              <Calendar size={12} />
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
