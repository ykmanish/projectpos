// components/FriendsLockOverlay.js

'use client';

import { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { useFriendsLock } from '@/context/FriendsLockContext';

export default function FriendsLockOverlay({ children }) {
  const { isLocked, unlock } = useFriendsLock();
  const [passcode, setPasscode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  if (!isLocked) {
    return children;
  }

  const handlePasscodeChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newPasscode = [...passcode];
    newPasscode[index] = value.slice(-1);
    setPasscode(newPasscode);
    
    if (value && index < 5) {
      document.getElementById(`lock-input-${index + 1}`)?.focus();
    }
    
    const isComplete = newPasscode.every(d => d !== '');
    if (isComplete) {
      const isValid = unlock(newPasscode.join(''));
      if (isValid) {
        setPasscode(['', '', '', '', '', '']);
        setError('');
      } else {
        setError('Incorrect passcode');
        setPasscode(['', '', '', '', '', '']);
        document.getElementById('lock-input-0')?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      document.getElementById(`lock-input-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="fixed inset-0 backdrop-blur bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-[#0c0c0c] rounded-[30px] max-w-md w-full p-8 border border-zinc-200 dark:border-[#232529] -2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl small font-semibold text-black dark:text-white mb-2">
              Enter Passcode to Unlock
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Enter your 6-digit passcode to unlock
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-6">
            {passcode.map((digit, idx) => (
              <input
                key={idx}
                id={`lock-input-${idx}`}
                type={showPasscode ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePasscodeChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-14 h-14 text-center text-2xl font-semibold border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-[#101010] text-black dark:text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center mb-4">{error}</p>
          )}

          <button
            onClick={() => setShowPasscode(!showPasscode)}
            className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mx-auto"
          >
            {/* <KeyRound size={16} /> */}
            {showPasscode ? 'Hide' : 'Show'} passcode
          </button>
        </div>
      </div>
      
      {/* Blurred content */}
      <div className="filter blur-xl pointer-events-none select-none opacity-50">
        {children}
      </div>
    </div>
  );
}