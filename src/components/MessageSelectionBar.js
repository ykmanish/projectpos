// components/MessageSelectionBar.js
'use client';

import { useState } from "react";
import { X, Trash2, Forward, Copy, CheckSquare } from "lucide-react";

export default function MessageSelectionBar({
  selectedCount,
  onCancel,
  onDelete,
  onForward,
  onCopy,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    if (selectedCount > 1) {
      setShowDeleteConfirm(true);
    } else {
      onDelete();
    }
  };

  return (
    <>
      <div className="bg-[#34A853] dark:bg-[#2D9249] text-white px-4 py-2 flex items-center justify-between animate-slide-down">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <CheckSquare size={18} />
            <span className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? 'message' : 'messages'} selected
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onForward}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Forward"
          >
            <Forward size={18} />
          </button>
          
          <button
            onClick={onCopy}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Copy text"
          >
            <Copy size={18} />
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0c0c0c] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-[#202124] dark:text-white mb-2">
                Delete {selectedCount} messages?
              </h3>
              <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">
                These messages will be deleted for you. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-[#181A1E] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete();
                  }}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}