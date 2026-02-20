'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Users, Lock, Check, ChevronLeft, Shield, Key, Copy } from 'lucide-react';

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

// ─── Example Invite Codes ─────────────────────────────────────────
const EXAMPLE_CODES = ['ABC123', 'XYZ789', 'TEAM42', 'CHAT99'];

export default function JoinGroupModal({ isOpen, onClose, onJoin }) {
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInviteCode('');
      setError('');
      setSuccess(false);
      setJoining(false);
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.trim().toUpperCase().slice(0, 6);
      if (cleaned) {
        setInviteCode(cleaned);
        setError('');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const palette = getCardPalette('Join Group');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          
          <h2 className="text-lg font-bold text-gray-900">Join Group</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">
          {/* Info Card */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                <Users size={24} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  Enter Invite Code
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  Join a private group with a 6-digit code
                </p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Invite Code
              </label>
              <button
                onClick={handlePaste}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Copy size={14} />
                <span>Paste</span>
              </button>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setInviteCode(value.slice(0, 6));
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inviteCode.length === 6) {
                    handleJoin();
                  }
                }}
                placeholder="ABC123"
                className="w-full px-5 py-4 bg-gray-50  border-gray-200 text-gray-900 text-xl font-bold tracking-widest rounded-2xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all uppercase text-center"
                maxLength={6}
              />

              {/* Character counter */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className={`text-xs font-medium ${inviteCode.length === 6 ? 'text-green-600' : 'text-gray-400'}`}>
                  {inviteCode.length}/6
                </span>
              </div>
            </div>

            {/* Example codes */}
            <div className="flex flex-wrap gap-2 mt-2">
              <p className="text-xs text-gray-400 w-full mb-1">Try these examples:</p>
              {EXAMPLE_CODES.map((code) => (
                <button
                  key={code}
                  onClick={() => setInviteCode(code)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-medium text-gray-700 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 rounded-2xl animate-fade-in">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <Check size={18} className="text-green-600" />
                <p className="text-sm text-green-600 font-medium">Successfully joined group!</p>
              </div>
            </div>
          )}

          {/* Encryption Info */}
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 mb-1">End-to-End Encrypted</p>
                <p className="text-xs text-gray-400">
                  You'll automatically receive the encryption keys when you join. All messages will be securely encrypted.
                </p>
              </div>
            </div>
          </div>

          {/* Key Info */}
          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <Key size={12} />
            <span>6-digit code · Case insensitive</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-7 pt-4 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 rounded-2xl font-bold text-[15px] transition-all"
              disabled={joining}
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={joining || inviteCode.length !== 6}
              className="flex-1 py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {joining ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={18} strokeWidth={2.5} />
                  Join Group
                </>
              )}
            </button>
          </div>
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