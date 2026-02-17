"use client";

import { Trash2, Eye, Video } from "lucide-react";

export default function PreSendAttachmentPreview({ attachments, onRemove, onClearAll, onPreview }) {
  if (attachments.length === 0) return null;

  return (
    <div className="p-4 border-t border-[#f1f3f4] dark:border-[#181A1E] bg-white dark:bg-[#0c0c0c] transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#202124] dark:text-white">
          Attachments Ready to Send ({attachments.length})
        </h3>
        <button
          onClick={onClearAll}
          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          <Trash2 size={14} />
          Clear all
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#232529] scrollbar-track-transparent">
        {attachments.map((att, idx) => (
          <div key={idx} className="relative flex-shrink-0 group">
            {att.type === 'image' ? (
              <div className="relative">
                <img 
                  src={att.preview} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-xl border-2 border-[#34A853] dark:border-[#34A853]/80"
                  onError={(e) => {
                    console.error('Preview image failed to load');
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2334A853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="9" y1="2" x2="9" y2="22"/><line x1="15" y1="2" x2="15" y2="22"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={() => onPreview(att, idx)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-white transition-colors"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-700 rounded-full text-white transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : att.type === 'video' ? (
              <div className="relative">
                <video 
                  src={att.preview} 
                  className="w-24 h-24 object-cover rounded-xl border-2 border-[#34A853] dark:border-[#34A853]/80"
                  onError={(e) => console.error('Preview video failed to load')}
                />
                <div className="absolute inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center">
                  <Video size={24} className="text-white" />
                </div>
                <div className="absolute inset-0 bg-black/40 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={() => onPreview(att, idx)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-white transition-colors"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-700 rounded-full text-white transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : null}
            
            {/* File type indicator */}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 dark:bg-black/70 rounded text-white text-[10px] backdrop-blur-sm">
              {att.type === 'image' ? 'IMG' : 'VID'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}