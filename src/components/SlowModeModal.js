// components/SlowModeModal.js
'use client';

import { useState } from 'react';
import { X, Clock, Zap, Shield, AlertCircle } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function SlowModeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentSettings,
  isAdmin 
}) {
  const [enabled, setEnabled] = useState(currentSettings?.enabled || false);
  const [cooldown, setCooldown] = useState(currentSettings?.cooldown || 30);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const cooldownOptions = [
    { value: 5, label: '5 seconds', description: 'Short cooldown for active chats' },
    { value: 10, label: '10 seconds', description: 'Moderate message frequency' },
    { value: 15, label: '15 seconds', description: 'Balanced message pacing' },
    { value: 30, label: '30 seconds', description: 'Standard slow mode' },
    { value: 60, label: '1 minute', description: 'One message per minute' },
    { value: 120, label: '2 minutes', description: 'Extended cooldown' },
    { value: 300, label: '5 minutes', description: 'Very limited messaging' },
    { value: 600, label: '10 minutes', description: 'Maximum restriction' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        enabled,
        cooldown: enabled ? cooldown : 0
      });
    } finally {
      setSaving(false);
    }
  };

  // Get the selected cooldown label for preview
  const getSelectedCooldownLabel = () => {
    const option = cooldownOptions.find(opt => opt.value === cooldown);
    return option?.label || `${cooldown} seconds`;
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-md w-full border-[#f1f3f4] dark:border-[#232529] shadow-xl overflow-hidden">
          <div className="p-6 border-b border-[#f1f3f4] dark:border-[#232529] flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#202124] dark:text-white flex items-center gap-2">
              <Shield size={20} className="text-red-500" />
              Slow Mode
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
                Only admins can change slow mode settings
              </p>
              <p className="text-sm text-[#5f6368] dark:text-gray-400">
                Contact a group administrator to modify slow mode settings.
              </p>
            </div>
            
            {currentSettings?.enabled && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-[#101010] rounded-xl">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock size={16} className="text-[#34A853]" />
                  <span className="text-[#202124] dark:text-white">
                    Slow mode is currently enabled
                  </span>
                </div>
                <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-2">
                  Cooldown: {cooldownOptions.find(opt => opt.value === currentSettings.cooldown)?.label || `${currentSettings.cooldown} seconds`}
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
            <Clock size={20} className="text-[#34A853]" />
            Slow Mode Settings
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
              <Zap size={16} className="shrink-0 mt-0.5" />
              <span>
                Slow mode limits how often members can send messages. 
                Once enabled, users must wait the specified time between messages.
              </span>
            </p>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-[#202124] dark:text-white">
                Enable Slow Mode
              </label>
              <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">
                Restrict message frequency
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

          {/* Cooldown Selector - Using CustomDropdown */}
          {enabled && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#202124] dark:text-white">
                Cooldown Time
              </label>
              <CustomDropdown
                options={cooldownOptions}
                value={cooldown}
                onChange={setCooldown}
                placeholder="Select cooldown time"
                icon={Clock}
                searchable={true}
                renderOption={(option) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </span>
                  </div>
                )}
              />
              <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">
                Members will need to wait this long between messages
              </p>
            </div>
          )}

          {/* Preview */}
          {enabled && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-[#101010] rounded-xl">
              <p className="text-sm text-[#202124] dark:text-white font-medium mb-2">
                Preview
              </p>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-[#232529]"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs dark:text-zinc-300 font-medium">You</span>
                    <span className="text-[10px] text-[#5f6368]">12:34 PM</span>
                  </div>
                  <div className="bg-white dark:bg-[#0c0c0c] dark:text-zinc-300 p-2 rounded-xl mt-1">
                    <p className="text-xs">Your message here</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-[#5f6368] dark:text-gray-400">
                <Clock size={12} />
                <span>Next message allowed in {getSelectedCooldownLabel()}</span>
              </div>
            </div>
          )}
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