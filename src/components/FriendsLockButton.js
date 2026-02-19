// components/FriendsLockButton.js

'use client';

import { useState } from 'react';
import { Lock, Unlock, Settings, LogOut, Clock } from 'lucide-react';
import { useFriendsLock } from '@/context/FriendsLockContext';
import FriendsLockModal from './LockPasscodeModal';

export default function FriendsLockButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [modalMode, setModalMode] = useState('set');
  
  const { 
    lockEnabled, 
    enableLock, 
    disableLock, 
    lockNow,
    isLocked
  } = useFriendsLock();

  const handleSetPasscode = (passcode, timeout) => {
    enableLock(passcode, timeout);
    setShowLockModal(false);
    setIsOpen(false);
  };

  const handleUnlock = (passcode) => {
    // This will be handled by the overlay
    return false;
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          title="Chat Lock Settings"
        >
          {isLocked ? (
            <Lock size={20} className="text-red-500" />
          ) : lockEnabled ? (
            <Lock size={20} className="text-green-600 dark:text-green-500" />
          ) : (
            <Lock size={20} className="text-zinc-600 dark:text-zinc-400" />
          )}
          {lockEnabled && !isLocked && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-2xl shadow-lg z-50 py-2">
            {!lockEnabled ? (
              <button
                onClick={() => {
                  setModalMode('set');
                  setShowLockModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors text-black dark:text-white"
              >
                <Lock size={18} />
                <span className="text-sm">Enable Chat Lock</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setModalMode('set');
                    setShowLockModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors text-black dark:text-white"
                >
                  <Settings size={18} />
                  <span className="text-sm">Change Passcode</span>
                </button>
                <button
                  onClick={() => {
                    lockNow();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors text-black dark:text-white"
                >
                  <Clock size={18} />
                  <span className="text-sm">Lock Now</span>
                </button>
                <button
                  onClick={() => {
                    disableLock();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors text-red-500"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Disable Lock</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <FriendsLockModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        onSetPasscode={handleSetPasscode}
        mode={modalMode}
      />
    </>
  );
}