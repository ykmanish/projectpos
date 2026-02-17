// components/GroupEncryptionModal.jsx
'use client';

import { X, Shield, Lock, Users, CheckCircle } from 'lucide-react';

export default function GroupEncryptionModal({ isOpen, onClose, group }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-[30px] w-full max-w-2xl overflow-hidden transition-colors duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-[#181A1E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Shield size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-black dark:text-white small">Group Encryption</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-300">Encrypted Group</p>
              <p className="text-sm text-green-700 dark:text-green-400">All messages are end-to-end encrypted</p>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">How it works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Lock size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Encrypted Messages</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">All messages are encrypted before leaving your device</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Shared Group Key</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Each member has their own encrypted copy of the group key</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Server Cannot Read</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Our servers never have access to your unencrypted messages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              {group?.members?.length || 0} Encrypted Members
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All members of this group communicate with end-to-end encryption. 
              New members are automatically given encrypted access to the group.
            </p>
          </div>

          {/* Note */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> Individual member verification is only available in direct chats. 
              Group encryption ensures privacy for all group communications.
            </p>
          </div>
        </div>

        {/* Footer */}
        
      </div>
    </div>
  );
}