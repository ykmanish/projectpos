// components/SettingsDropdown.js

'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Lock, Unlock, LogOut, Clock } from 'lucide-react';
import { useFriendsLock } from '@/context/FriendsLockContext';
import LockPasscodeModal from './LockPasscodeModal';

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const dropdownRef = useRef(null);
  
  const { 
    lockEnabled, 
    enableLock, 
    disableLock, 
    lockNow,
    isLocked
  } = useFriendsLock();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSetPasscode = (passcode, timeout) => {
    enableLock(passcode, timeout);
    setShowLockModal(false);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          title="Settings"
        >
          <Settings size={20} className="text-zinc-600 dark:text-zinc-400" />
          {lockEnabled && !isLocked && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
          )}
          {isLocked && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-2xl shadow-lg z-50 py-2">
            {!lockEnabled ? (
              <button
                onClick={() => {
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
                    setShowLockModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors text-black dark:text-white"
                >
                  <Lock size={18} />
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

      <LockPasscodeModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        onSetPasscode={handleSetPasscode}
        mode="set"
      />
    </>
  );
}