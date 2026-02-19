// components/ConfirmationModal.js

'use client';

import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Trash2, Eraser, AlertCircle } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isProcessing = false,
  type = 'danger', // 'danger', 'warning', 'info'
  icon: CustomIcon
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    if (CustomIcon) return <CustomIcon size={32} />;
    
    switch (type) {
      case 'danger':
        return <Trash2 size={32} className="text-red-600 dark:text-red-500" />;
      case 'warning':
        return <Eraser size={32} className="text-orange-600 dark:text-orange-500" />;
      case 'info':
        return <AlertCircle size={32} className="text-blue-600 dark:text-blue-500" />;
      default:
        return <AlertTriangle size={32} className="text-yellow-600 dark:text-yellow-500" />;
    }
  };

  const getButtonColors = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#0c0c0c] rounded-3xl max-w-md w-full shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f1f3f4] dark:border-[#181A1E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' :
              type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' :
              'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {getIcon()}
            </div>
            <h3 className="text-lg font-semibold text-[#202124] dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X size={20} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#5f6368] dark:text-gray-400 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 border border-[#dadce0] dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColors()}`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}