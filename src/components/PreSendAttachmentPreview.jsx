"use client";

import { Trash2, Eye, Video } from "lucide-react";

export default function PreSendAttachmentPreview({ attachments, onRemove, onClearAll, onPreview }) {
  if (attachments.length === 0) return null;

  return (
    <div className="p-4 border-t border-[#f1f3f4] bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#202124]">
          Attachments Ready to Send ({attachments.length})
        </h3>
        <button
          onClick={onClearAll}
          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
        >
          <Trash2 size={14} />
          Clear all
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {attachments.map((att, idx) => (
          <div key={idx} className="relative flex-shrink-0 group">
            {att.type === 'image' ? (
              <div className="relative">
                <img 
                  src={att.preview} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded-xl border-2 border-[#34A853]"
                  onError={(e) => {
                    console.error('Preview image failed to load');
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2334A853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="9" y1="2" x2="9" y2="22"/><line x1="15" y1="2" x2="15" y2="22"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={() => onPreview(att, idx)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
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
                  className="w-24 h-24 object-cover rounded-xl border-2 border-[#34A853]"
                  onError={(e) => console.error('Preview video failed to load')}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Video size={24} className="text-white" />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={() => onPreview(att, idx)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : null}
            
            {/* File type indicator */}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-[10px]">
              {att.type === 'image' ? 'IMG' : 'VID'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}