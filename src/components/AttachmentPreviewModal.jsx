"use client";

import { useState, useRef } from "react";
import { X, Download, Maximize2, Minimize2, ChevronLeft } from "lucide-react";

export default function AttachmentPreviewModal({ isOpen, onClose, attachment, onNext, onPrevious, hasNext, hasPrevious }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);

  if (!isOpen || !attachment) return null;

  // Get the correct URL (preview for local files, url for server files)
  const attachmentUrl = attachment.preview || attachment.url;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleDownload = async () => {
    try {
      // For local previews, we need to fetch the blob differently
      if (attachment.preview) {
        // If it's a local preview (blob URL), fetch the blob directly
        const response = await fetch(attachment.preview);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name || `attachment.${attachment.type === 'image' ? 'jpg' : 'mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // For server URLs
        const response = await fetch(attachment.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name || `attachment.${attachment.type === 'image' ? 'jpg' : 'mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/80 z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="relative max-w-7xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X size={20} />
              </button>
              <span className="text-white font-medium">
                {attachment.type === 'image' ? 'Image' : 'Video'} Preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                title="Download"
              >
                <Download size={20} />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
          </div>

          {/* Navigation Arrows - Only show for non-preview attachments */}
          {!attachment.preview && hasPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {!attachment.preview && hasNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <ChevronLeft size={24} className="rotate-180" />
            </button>
          )}

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            {attachment.type === 'image' ? (
              <img
                src={attachmentUrl}
                alt={attachment.name || 'Preview'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error('Image failed to load:', attachmentUrl);
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="9" y1="2" x2="9" y2="22"/><line x1="15" y1="2" x2="15" y2="22"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>';
                }}
              />
            ) : (
              <video
                ref={videoRef}
                src={attachmentUrl}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
                onError={(e) => console.error('Video failed to load:', attachmentUrl)}
              />
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <p className="text-white text-sm truncate">
              {attachment.name || `${attachment.type} attachment`}
            </p>
            {attachment.preview && (
              <p className="text-white/70 text-xs mt-1">
                Preview • Not sent yet
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}