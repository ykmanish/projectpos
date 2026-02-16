// components/GroupEncryptionModal.jsx
'use client';

import { X, Shield, Lock, Users, CheckCircle } from 'lucide-react';

export default function GroupEncryptionModal({ isOpen, onClose, group }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[30px] w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield size={20} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-black small">Group Encryption</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="font-medium text-green-900">Encrypted Group</p>
              <p className="text-sm text-green-700">All messages are end-to-end encrypted</p>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Lock size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Encrypted Messages</p>
                  <p className="text-xs text-gray-600">All messages are encrypted before leaving your device</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Shared Group Key</p>
                  <p className="text-xs text-gray-600">Each member has their own encrypted copy of the group key</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Server Cannot Read</p>
                  <p className="text-xs text-gray-600">Our servers never have access to your unencrypted messages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {group?.members?.length || 0} Encrypted Members
            </h3>
            <p className="text-sm text-gray-600">
              All members of this group communicate with end-to-end encryption. 
              New members are automatically given encrypted access to the group.
            </p>
          </div>

          {/* Note */}
          <div className="bg-yellow-50 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
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
