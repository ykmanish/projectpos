'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Ban, UserCheck, AlertTriangle } from 'lucide-react';
import { BeanHead } from 'beanheads';
import Avatar from './Avatar';

export default function BlockedUsersModal({ isOpen, onClose, userId, onUnblock }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchBlockedUsers();
    }
  }, [isOpen, userId]);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/blocked?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setBlockedUsers(data.blocked || []);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedId) => {
    setUnblockingId(blockedId);
    try {
      const res = await fetch('/api/friends/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, blockedId }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockedUsers(prev => prev.filter(u => u.userId !== blockedId));
        onUnblock?.(blockedId);
        setShowConfirm(null);
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setUnblockingId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-[30px] max-w-md w-full max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban size={20} className="text-red-500" />
            <h2 className="text-xl font-semibold text-[#000000]">Blocked Users</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34A853]"></div>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Ban size={32} className="text-gray-400" />
              </div>
              <p className="text-[#5f6368] text-sm">No blocked users</p>
              <p className="text-xs text-[#5f6368] mt-2">
                When you block someone, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => {
                // Parse user avatar
                let userAvatar = null;
                if (user.avatar) {
                  try {
                    userAvatar = typeof user.avatar === 'string' ? JSON.parse(user.avatar) : user.avatar;
                  } catch (e) {
                    console.error('Failed to parse user avatar', e);
                  }
                }

                return (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center text-white font-semibold text-lg">
                        {userAvatar?.beanConfig ? (
                          <BeanHead {...userAvatar.beanConfig} />
                        ) : (
                          getInitials(user.userName)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#202124]">{user.userName}</p>
                        {user.username && (
                          <p className="text-xs text-[#5f6368]">@{user.username}</p>
                        )}
                      </div>
                    </div>

                    {showConfirm === user.userId ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowConfirm(null)}
                          className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUnblock(user.userId)}
                          disabled={unblockingId === user.userId}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                          {unblockingId === user.userId ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Unblocking...</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              <span>Unblock</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowConfirm(user.userId)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Unblock
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Note */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                Blocked users cannot message you or see your profile. You can unblock them anytime to restore communication.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}