// components/FriendsLockOverlay.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, Eye, EyeOff, Shield, ChevronLeft } from 'lucide-react';

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

// ─── Passcode Input Component ─────────────────────────────────────
const PasscodeInput = ({ value, onChange, onKeyDown, index, showPasscode, inputRef, autoFocus }) => {
  return (
    <input
      ref={inputRef}
      id={`lock-input-${index}`}
      type={showPasscode ? 'text' : 'password'}
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(index, e.target.value)}
      onKeyDown={(e) => onKeyDown(index, e)}
      className="w-14 h-14 text-center text-2xl font-extrabold border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
      autoFocus={autoFocus}
    />
  );
};

export default function FriendsLockOverlay({ children }) {
  // Get from context - we need to check if the hook is available
  let lockContext;
  try {
    lockContext = require('@/context/FriendsLockContext').useFriendsLock();
  } catch (error) {
    console.warn('FriendsLockContext not available');
  }

  // If context is not available, just render children
  if (!lockContext) {
    return children;
  }

  const { isLocked, unlock, initialized } = lockContext;
  const [passcode, setPasscode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isLocked) {
      // Reset state when lock becomes active
      setPasscode(['', '', '', '', '', '']);
      setError('');
      setAttempts(0);
      
      // Focus first input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isLocked]);

  // Don't show overlay until initialized
  if (!initialized) {
    return children;
  }

  if (!isLocked) {
    return children;
  }

  const handlePasscodeChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newPasscode = [...passcode];
    newPasscode[index] = value.slice(-1);
    setPasscode(newPasscode);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    const isComplete = newPasscode.every(d => d !== '');
    if (isComplete) {
      const isValid = unlock(newPasscode.join(''));
      if (isValid) {
        setPasscode(['', '', '', '', '', '']);
        setError('');
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(newAttempts >= 3 
          ? 'Too many attempts. Please try again later.' 
          : 'Incorrect passcode');
        setPasscode(['', '', '', '', '', '']);
        
        // Reset error after 3 seconds if not too many attempts
        if (newAttempts < 3) {
          setTimeout(() => setError(''), 3000);
        }
        
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const newPasscode = [...passcode];
      newPasscode[index - 1] = '';
      setPasscode(newPasscode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const palette = getCardPalette('Lock');

  return (
    <div className="relative min-h-screen">
      {/* Lock Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="relative bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg -2xl animate-slide-up">
          {/* Header */}
          <div className="px-5 pt-8 pb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: palette.bg }}>
                <Lock size={40} style={{ color: palette.text }} />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-1">
              Friends List Locked
            </h2>
            <p className="text-sm text-center text-gray-400">
              Enter your 6-digit passcode to unlock
            </p>
          </div>

          {/* Content */}
          <div className="px-5 pb-8 space-y-6">
            {/* Passcode Input */}
            <div className="flex justify-center gap-3">
              {passcode.map((digit, idx) => (
                <PasscodeInput
                  key={idx}
                  index={idx}
                  value={digit}
                  onChange={handlePasscodeChange}
                  onKeyDown={handleKeyDown}
                  showPasscode={showPasscode}
                  inputRef={(el) => (inputRefs.current[idx] = el)}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-2xl animate-fade-in ${
                attempts >= 3 ? 'bg-red-50' : 'bg-orange-50'
              }`}>
                <p className={`text-sm text-center font-medium ${
                  attempts >= 3 ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {error}
                </p>
              </div>
            )}

            {/* Show/Hide Toggle */}
            <button
              onClick={() => setShowPasscode(!showPasscode)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mx-auto"
            >
              {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPasscode ? 'Hide' : 'Show'} passcode
            </button>

            {/* Help Text */}
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-start gap-3">
                <KeyRound size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  This passcode was set when you enabled friends list locking. 
                  If you forgot it, you'll need to reset your app data.
                </p>
              </div>
            </div>

            {/* Attempts Indicator */}
            {attempts > 0 && attempts < 3 && (
              <div className="flex justify-center gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i <= attempts ? 'bg-orange-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Blurred content */}
      <div className="filter blur-xl pointer-events-none select-none opacity-40 min-h-screen">
        {children}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}