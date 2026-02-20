// components/SlowModeModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Clock, Zap, Shield, AlertCircle, ChevronLeft, Check, Send, Users } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

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

// ─── Member Avatar Component ───────────────────────────────────────
const MemberAvatar = ({ size = 8 }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = Math.floor(Math.random() * GRADIENTS.length);
  
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
      <span className="text-white text-xs font-bold">U</span>
    </div>
  );
};

// ─── Message Preview Component ────────────────────────────────────
const MessagePreview = ({ cooldown, enabled, palette }) => {
  const [timeLeft, setTimeLeft] = useState(cooldown);
  const [canSend, setCanSend] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    let timer;
    if (!canSend && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanSend(true);
            return cooldown;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [canSend, timeLeft, cooldown, enabled]);

  const handleSendMessage = () => {
    if (!enabled || !canSend) return;
    setCanSend(false);
    setTimeLeft(cooldown);
  };

  const getCooldownLabel = () => {
    if (!enabled) return '';
    if (canSend) return 'Ready to send';
    return `Wait ${timeLeft}s`;
  };

  return (
    <div className="rounded-3xl p-5 bg-zinc-100">
      <p className="text-sm font-medium mb-3" style={{ color: palette.sub }}>Preview</p>
      
      {/* Message Thread */}
      <div className="space-y-3">
        {/* Other user's message */}
        <div className="flex items-start gap-3">
          <MemberAvatar size={8} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium" style={{ color: palette.text }}>Alex</span>
              <span className="text-[10px]" style={{ color: palette.sub }}>12:34 PM</span>
            </div>
            <div className="rounded-2xl p-3 bg-white/80 backdrop-blur-sm" style={{ color: palette.text }}>
              <p className="text-xs">Hey, is anyone up for dinner later?</p>
            </div>
          </div>
        </div>

        {/* Current user's message */}
        <div className="flex items-start gap-3 flex-row-reverse">
          <MemberAvatar size={8} />
          <div className="flex-1">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-[10px]" style={{ color: palette.sub }}>12:35 PM</span>
              <span className="text-xs font-medium" style={{ color: palette.text }}>You</span>
            </div>
            <div className="rounded-2xl p-3 bg-black/10 backdrop-blur-sm" style={{ backgroundColor: `${palette.text}15`, color: palette.text }}>
              <p className="text-xs">I'm in! Where are we going?</p>
            </div>
          </div>
        </div>

        {/* Send message preview with slow mode */}
        {enabled && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl text-sm focus:outline-none"
                  style={{ color: palette.text, placeholderColor: palette.sub }}
                  disabled={!canSend}
                  onClick={handleSendMessage}
                  readOnly
                />
                {!canSend && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Clock size={14} style={{ color: palette.sub }} />
                    <span className="text-xs font-medium" style={{ color: palette.sub }}>{timeLeft}s</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!canSend}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                style={{ backgroundColor: canSend ? palette.text : `${palette.text}50` }}
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: palette.sub }}>
              {getCooldownLabel()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

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

  const palette = getCardPalette('Slow Mode');

  // Non-admin view
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={17} className="text-gray-700" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Slow Mode</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-gray-700" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Shield size={36} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Only admins can change slow mode
              </h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Contact a group administrator to modify slow mode settings.
              </p>
            </div>

            {currentSettings?.enabled && (
              <div className="mt-4 p-5 bg-gray-50 rounded-3xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Clock size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Slow mode is enabled</p>
                    <p className="text-xs text-gray-400">
                      Cooldown: {getSelectedCooldownLabel()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white p-3 rounded-2xl">
                  <AlertCircle size={14} />
                  <span>Members must wait between messages</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-7 pt-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={17} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Slow Mode</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Toast for saving state */}
        {saving && (
          <div className="px-5 mb-2">
            <div className="px-4 py-3 bg-black rounded-2xl text-white text-sm flex items-center gap-2 animate-fade-in">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold">Saving...</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-2">
          {/* Description Card */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
                <Zap size={20} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="font-bold" style={{ color: palette.text }}>What is Slow Mode?</h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  Limits how often members can send messages. Once enabled, users must wait the specified time between messages.
                </p>
              </div>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Clock size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Enable Slow Mode</p>
                <p className="text-xs text-gray-400">Restrict message frequency</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => setEnabled(!enabled)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>

          {/* Cooldown Selector */}
          {enabled && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 px-1">
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
                    <span className="font-medium text-sm">{option.label}</span>
                    <span className="text-xs text-gray-400">
                      {option.description}
                    </span>
                  </div>
                )}
              />
              <p className="text-xs text-gray-400 px-1">
                Members will need to wait this long between messages
              </p>
            </div>
          )}

          {/* Live Preview */}
          <MessagePreview enabled={enabled} cooldown={cooldown} palette={palette} />
        </div>

        {/* Footer */}
        <div className="px-5 pb-7 pt-4 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 rounded-2xl font-bold text-[15px] transition-all"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  Save Settings
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