'use client';

import { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import Image from 'next/image';

export default function LinkPreview({ preview, url }) {
  const [imageError, setImageError] = useState(false);

  if (!preview) return null;

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-3 p-3 border border-zinc-200 rounded-3xl hover:bg-[#F8F9FA] cursor-pointer transition-colors group"
    >
      {/* Preview image */}
      <div className="flex-shrink-0 w-16 h-16 bg-[#f1f3f4] rounded-full overflow-hidden flex items-center justify-center">
        {preview.image && !imageError ? (
          <img
            src={preview.image}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-[#5f6368]">
            <ImageOff className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Preview content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[#202124] truncate group-hover:text-[#34A853] transition-colors">
          {preview.title || url}
        </h4>
        {preview.description && (
          <p className="text-xs text-[#5f6368] line-clamp-2 mt-1">
            {preview.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-[#34A853] truncate">
            {preview.siteName || new URL(url).hostname}
          </span>
          <ExternalLink className="w-3 h-3 text-[#5f6368]" />
        </div>
      </div>
    </div>
  );
}