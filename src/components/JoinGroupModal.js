'use client';

import { useState } from 'react';
import { X, Users, Lock, Check } from 'lucide-react';

export default function JoinGroupModal({ isOpen, onClose, onJoin }) {
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const result = await onJoin(inviteCode.trim().toUpperCase());
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setInviteCode('');
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to join group');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-[30px] max-w-md w-full transition-colors duration-300">
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-[#000000] dark:text-white">
            <Users size={24} className="text-[#34A853]" />
            Join Group
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-[#202124] dark:text-white" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-6">
            Enter the invite code to join a private group. You'll automatically receive the encryption keys when you join.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#202124] dark:text-white mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="e.g., ABC123"
              className="w-full px-4 py-4 bg-zinc-100/70 dark:bg-[#101010] border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-2xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none uppercase"
              maxLength={6}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>
            )}
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-2">
              <Check size={18} />
              <span className="text-sm">Successfully joined group!</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors font-medium"
              disabled={joining}
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={joining || !inviteCode.trim()}
              className="flex-1 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] disabled:bg-gray-200 dark:disabled:bg-[#232529] disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Join Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}