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
} from "lucide-react";

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
      setTimeout(() => {
        promptInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-200 dark:border-none"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#202124] dark:text-white">
                AI Message Enhancement
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-gray-400">
                Transform your message with AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
          >
            <X size={20} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Original Message */}
          {originalMessage && (
            <div>
              <label className="text-xs font-medium text-[#5f6368] dark:text-gray-400 mb-2 block">
                Original Message
              </label>
              <div className="p-4 bg-gray-50 dark:bg-[#101010] rounded-2xl  border-[#dadce0] dark:border-[#232529]">
                <p className="text-[#202124] dark:text-white whitespace-pre-wrap break-words">
                  {originalMessage}
                </p>
              </div>
            </div>
          )}

          {/* Quick Styles */}
          <div>
            <label className="text-xs font-medium text-[#5f6368] dark:text-gray-400 mb-3 block">
              Quick Enhancements
            </label>
            <div className="flex flex-wrap gap-2">
              {quickStyles.map((style, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickStyle(style.prompt)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#101010] hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full text-sm text-[#202124] dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-purple-300 dark:hover:border-purple-700"
                >
                  {style.icon}
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="text-xs font-medium text-[#5f6368] dark:text-gray-400 mb-2 block">
              Custom Prompt
            </label>
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., Make this more enthusiastic, Add emojis, Write it like a professional, etc."
              className="w-full px-4 py-3 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all resize-none"
              rows={3}
              disabled={isProcessing}
            />
            <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-1">
              Press Ctrl+Enter to enhance
            </p>
          </div>

          {/* Enhance Button */}
          <button
            onClick={handleCustomEnhance}
            disabled={isProcessing || (!originalMessage && !prompt)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 dark:disabled:bg-[#232529] text-white disabled:text-gray-400 dark:disabled:text-gray-600 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Enhancing with AI...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Enhance Message</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Enhanced Result */}
          {enhancedText && (
            <div className="border-t border-[#f1f3f4] dark:border-[#181A1E] pt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#5f6368] dark:text-gray-400">
                  Enhanced Message
                </label>
                <button
                  onClick={handleCopyEnhanced}
                  className="flex items-center gap-1 text-xs text-[#5f6368] dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
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
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-900/30">
                <p className="text-[#202124] dark:text-white whitespace-pre-wrap break-words mb-4">
                  {enhancedText}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm transition-colors flex items-center gap-2"
                  >
                    <Check size={16} />
                    <span>Use This Message</span>
                  </button>
                  <button
                    onClick={() => {
                      setPrompt("");
                      onClose();
                    }}
                    className="px-4 py-2 border border-[#dadce0] dark:border-[#232529] hover:bg-gray-100 dark:hover:bg-[#101010] rounded-xl text-sm transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}