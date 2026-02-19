'use client';

import { useState } from 'react';
import { X, Lock, Shield, AlertCircle, Users, MessageSquare } from 'lucide-react';

export default function AdminMessagingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentValue,
  isAdmin 
}) {
  const [enabled, setEnabled] = useState(currentValue || false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(enabled);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-md w-full border-[#f1f3f4] dark:border-[#232529] shadow-xl overflow-hidden">
          <div className="p-6 border-b border-[#f1f3f4] dark:border-[#232529] flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#202124] dark:text-white flex items-center gap-2">
              <Shield size={20} className="text-red-500" />
              Admin Messaging
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            >
              <X size={20} className="text-[#5f6368] dark:text-gray-400" />
            </button>
          </div>
          
          <div className="p-6 text-center">
            <div className="mb-4">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
              <p className="text-[#202124] dark:text-white font-medium mb-2">
                Only admins can change admin messaging settings
              </p>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">
                Contact a group administrator to modify who can send messages.
              </p>
            </div>
            
            {currentValue && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-[#101010] rounded-xl">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Lock size={16} className="text-[#34A853]" />
                  <span className="text-[#202124] dark:text-white">
                    Admin-only messaging is currently enabled
                  </span>
                </div>
                <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-2">
                  Only admins can send messages
                </p>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-[#f1f3f4] dark:border-[#232529]">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 dark:bg-[#232529] text-[#202124] dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-[#181A1E] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-xl w-full border-[#f1f3f4] dark:border-[#232529] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#232529] flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#202124] dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-[#34A853]" />
            Admin Messaging Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Shield size={16} className="shrink-0 mt-0.5" />
              <span>
                When enabled, only admins will be able to send messages in this group. 
                Regular members will be able to read messages but cannot send new ones.
              </span>
            </p>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-[#202124] dark:text-white">
                Enable Admin-Only Messaging
              </label>
              <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">
                Restrict message sending to admins only
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-[#34A853]' : 'bg-gray-300 dark:bg-[#232529]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-[#101010] rounded-xl">
            <p className="text-sm text-[#202124] dark:text-white font-medium mb-3 flex items-center gap-2">
              <MessageSquare size={16} />
              Preview
            </p>
            
            <div className="space-y-3">
              {/* Admin message */}
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield size={12} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#202124] dark:text-white">Admin</span>
                    <span className="text-[10px] text-[#5f6368]">12:34 PM</span>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-xl mt-1 max-w-[80%]">
                    <p className="text-xs text-[#202124] dark:text-white">Admin can always send messages</p>
                  </div>
                </div>
              </div>

              {/* Member message - disabled when enabled */}
              <div className={`flex items-start gap-2 ${enabled ? 'opacity-50' : ''}`}>
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#232529] flex items-center justify-center">
                  <Users size={12} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#202124] dark:text-white">Member</span>
                    <span className="text-[10px] text-[#5f6368]">12:35 PM</span>
                  </div>
                  <div className={`p-2 rounded-xl mt-1 max-w-[80%] ${
                    enabled 
                      ? 'bg-gray-100 dark:bg-[#101010] border border-gray-200 dark:border-[#232529]' 
                      : 'bg-gray-100 dark:bg-[#101010]'
                  }`}>
                    <p className="text-xs text-[#202124] dark:text-white">
                      {enabled ? (
                        <span className="flex items-center gap-1 text-red-500">
                          <Lock size={10} />
                          Messaging disabled
                        </span>
                      ) : (
                        "Members can send messages"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {enabled && (
              <div className="flex items-center gap-2 mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                <AlertCircle size={14} />
                <span>Regular members will not be able to send messages</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f1f3f4] dark:border-[#232529] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-[#34A853] text-white rounded-xl hover:bg-[#2D9249] disabled:bg-gray-300 dark:disabled:bg-[#232529] disabled:text-gray-500 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}