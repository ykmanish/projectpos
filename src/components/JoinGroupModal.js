'use client';

import { useState } from 'react';
import { X, Users, LogIn,UserPlus  } from 'lucide-react';

export default function JoinGroupModal({ isOpen, onClose, onJoin }) {
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    
    setJoining(true);
    setError('');
    
    try {
      const result = await onJoin(inviteCode.toUpperCase());
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to join group');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[30px] max-w-md w-full">
        <div className="p-6 border-b border-[#f1f3f4] flex items-center justify-between">
          <h2 className="text-xl font-semibold">Join Group</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-green-600" />
            </div>
            <p className="text-sm text-[#5f6368]">
              Enter the invite code to join a group
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#202124] mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest border border-[#dadce0] rounded-2xl focus:ring focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 text-center bg-red-50 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-[#dadce0] rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={inviteCode.length !== 6 || joining}
              className="flex-1 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
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