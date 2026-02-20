// components/AIEnhancementModal.js
'use client';

import { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  RefreshCw,
  Zap,
  PenTool,
  Smile,
  Volume2,
  Hash,
  Type,
  Check,
  Copy,
  ChevronLeft,
  Wand2,
  MessageSquare,
} from "lucide-react";

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

// ─── Quick Style Button Component ─────────────────────────────────
const QuickStyleButton = ({ icon, label, onClick, disabled, palette }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      <span style={{ color: palette.text }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default function AIEnhancementModal({
  isOpen,
  onClose,
  originalMessage,
  onEnhance,
  onApply,
  isProcessing,
  enhancedText,
  error,
}) {
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);
  
  const modalRef = useRef(null);
  const promptInputRef = useRef(null);

  // Quick enhancement styles
  const quickStyles = [
    { icon: <Zap size={16} />, label: "Professional", prompt: "make this more professional and formal" },
    { icon: <PenTool size={16} />, label: "Creative", prompt: "make this more creative and engaging" },
    { icon: <Smile size={16} />, label: "Friendly", prompt: "make this more friendly and warm" },
    { icon: <Volume2 size={16} />, label: "Clear", prompt: "make this clearer and more concise" },
    { icon: <Hash size={16} />, label: "Concise", prompt: "make this shorter and to the point" },
    { icon: <Type size={16} />, label: "Grammar", prompt: "fix grammar and make it polished" },
  ];

  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setCopied(false);
      setShowEnhanced(false);
      setTimeout(() => {
        promptInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (enhancedText) {
      setShowEnhanced(true);
    }
  }, [enhancedText]);

  const handleQuickStyle = (stylePrompt) => {
    setPrompt(stylePrompt);
    if (originalMessage) {
      onEnhance(originalMessage, stylePrompt);
    }
  };

  const handleCustomEnhance = () => {
    if (originalMessage && prompt) {
      onEnhance(originalMessage, prompt);
    } else if (prompt) {
      onEnhance("", prompt);
    }
  };

  const handleCopyEnhanced = () => {
    if (enhancedText) {
      navigator.clipboard.writeText(enhancedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (enhancedText) {
      onApply(enhancedText);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleCustomEnhance();
    }
  };

  const handleClose = () => {
    setPrompt("");
    setCopied(false);
    setShowEnhanced(false);
    onClose();
  };

  if (!isOpen) return null;

  const palette = getCardPalette('AI Enhancement');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
         
          <h2 className="text-lg font-bold text-gray-900">AI Enhancement</h2>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6 min-h-0">
          {/* Info Card */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center">
                <Wand2 size={24} style={{ color: palette.text }} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold" style={{ color: palette.text }}>
                  Transform Your Message
                </h3>
                <p className="text-sm mt-1" style={{ color: palette.sub }}>
                  Use AI to enhance your message
                </p>
              </div>
            </div>
          </div>

          {/* Original Message */}
          {originalMessage && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 px-1">
                Original Message
              </label>
              <div className="p-4 bg-gray-50 rounded-2xl  border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap break-words text-sm">
                  {originalMessage}
                </p>
              </div>
            </div>
          )}

          {/* Quick Styles */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 px-1">
              Quick Enhancements
            </label>
            <div className="flex flex-wrap gap-2">
              {quickStyles.map((style, index) => (
                <QuickStyleButton
                  key={index}
                  icon={style.icon}
                  label={style.label}
                  onClick={() => handleQuickStyle(style.prompt)}
                  disabled={isProcessing}
                  palette={palette}
                />
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <label className="text-sm  font-medium text-gray-700 px-1">
              Custom Prompt
            </label>
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., Make this more enthusiastic, Add emojis, Write it like a professional..."
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 text-gray-900 rounded-3xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all resize-none"
              rows={3}
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-400 px-1">
              Press Ctrl+Enter to enhance
            </p>
          </div>

          {/* Enhance Button */}
          <button
            onClick={handleCustomEnhance}
            disabled={isProcessing || (!originalMessage && !prompt)}
            className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Enhancing...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} strokeWidth={2.5} />
                <span>Enhance Message</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 rounded-2xl animate-fade-in">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            </div>
          )}

          {/* Enhanced Result */}
          {enhancedText && showEnhanced && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-medium text-gray-700">
                  Enhanced Message
                </label>
                <button
                  onClick={handleCopyEnhanced}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>
                <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 mb-4">
                  <p className="text-gray-900 whitespace-pre-wrap break-words text-sm">
                    {enhancedText}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApply}
                    className="flex-1 py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Check size={16} strokeWidth={2.5} />
                    Use This Message
                  </button>
                  <button
                    onClick={() => {
                      setShowEnhanced(false);
                      setPrompt("");
                    }}
                    className="flex-1 py-3 bg-white/30 hover:bg-white/40 text-gray-900 rounded-xl font-medium text-sm transition-all backdrop-blur-sm active:scale-[0.98]"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-2xl">
            <MessageSquare size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              Tip: You can ask the AI to adjust tone, add emojis, fix grammar, or completely rewrite your message in a different style.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
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
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}