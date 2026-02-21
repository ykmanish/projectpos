// components/LinkPreview.js

import { useState, useEffect, useRef } from 'react';
import { ExternalLink, ImageOff, Link2, Globe } from 'lucide-react';

// Cache for storing fetched previews
const previewCache = new Map();

// Function to get favicon URL
const getFaviconUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return [
      `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
      `https://icon.horse/icon/${urlObj.hostname}`,
      `https://${urlObj.hostname}/favicon.ico`
    ];
  } catch {
    return null;
  }
};

export default function LinkPreview({ url, onLoad, onError }) {
  // Initialize with cached data immediately
  const [preview, setPreview] = useState(() => previewCache.get(url) || null);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [faviconUrls] = useState(() => getFaviconUrl(url));
  
  const hasFetchedRef = useRef(previewCache.has(url));
  const mountedRef = useRef(true);
  const urlRef = useRef(url);

  useEffect(() => {
    mountedRef.current = true;
    
    // If URL changed
    if (urlRef.current !== url) {
      urlRef.current = url;
      
      // Check cache for new URL
      if (previewCache.has(url)) {
        setPreview(previewCache.get(url));
        setLoading(false);
        setError(false);
        hasFetchedRef.current = true;
      } else {
        setPreview(null);
        setLoading(true); // Only set loading for new URLs
        setError(false);
        hasFetchedRef.current = false;
      }
      setImageError(false);
      setFaviconError(false);
    }

    // Don't fetch if we already have data or are currently fetching
    if (hasFetchedRef.current || preview) {
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch('/api/chat/link-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        const data = await response.json();

        let previewData;
        
        if (data.success && data.preview) {
          previewData = data.preview;
        } else {
          // Fallback preview
          try {
            const urlObj = new URL(url);
            previewData = {
              url,
              title: urlObj.hostname,
              description: '',
              image: null,
              siteName: urlObj.hostname.replace('www.', ''),
            };
          } catch {
            previewData = {
              url,
              title: url,
              description: '',
              image: null,
              siteName: 'Link',
            };
          }
        }

        // Store in cache
        previewCache.set(url, previewData);
        
        if (mountedRef.current) {
          setPreview(previewData);
          hasFetchedRef.current = true;
          setLoading(false);
          onLoad?.(previewData);
        }
        
      } catch (error) {
        console.error('Error fetching link preview:', error);
        if (mountedRef.current) {
          setError(true);
          setLoading(false);
          onError?.(error);
        }
      }
    };

    fetchPreview();

    return () => {
      mountedRef.current = false;
    };
  }, [url, onLoad, onError]); // Remove preview from dependencies

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFaviconError = () => {
    setFaviconError(true);
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // If we have preview data, show it immediately with no loading state
  if (preview && !error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222222] rounded-xl overflow-hidden transition-all duration-200  border-gray-200 dark:border-[#232529] "
        onClick={handleLinkClick}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Main Image or Favicon */}
          {preview.image && !imageError ? (
            <div className="sm:w-24 sm:h-24 w-full h-40 relative bg-gray-200 dark:bg-[#232529] flex-shrink-0">
              <img
                src={preview.image}
                alt={preview.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="sm:w-24 sm:h-24 w-full h-24 bg-gray-200 dark:bg-[#232529] flex items-center justify-center flex-shrink-0">
              {faviconUrls && !faviconError ? (
                <img
                  src={faviconUrls[0]}
                  alt=""
                  className="w-8 h-8 object-contain"
                  onError={handleFaviconError}
                />
              ) : (
                <Globe size={24} className="text-gray-400 dark:text-gray-600" />
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Small favicon next to title */}
              {faviconUrls && !faviconError && (
                <img
                  src={faviconUrls[0]}
                  alt=""
                  className="w-4 h-4 object-contain rounded-sm flex-shrink-0"
                  onError={handleFaviconError}
                />
              )}
              <p className="text-sm font-medium text-[#202124] dark:text-white line-clamp-1 flex-1">
                {preview.title}
              </p>
            </div>
            {preview.description && (
              <p className="text-xs text-[#5f6368] dark:text-gray-400 line-clamp-2 mt-1">
                {preview.description}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <ExternalLink size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {preview.siteName}
              </p>
            </div>
          </div>
        </div>
      </a>
    );
  }

  // Show error state
  if (error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block p-3 bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222222] rounded-xl transition-all duration-200 border border-gray-200 dark:border-[#232529]"
        onClick={handleLinkClick}
      >
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Link2 size={14} />
          <span className="break-all">{url}</span>
        </div>
      </a>
    );
  }

  // Show loading skeleton only when actually loading and no preview exists
  if (loading && !preview) {
    return (
      <div className="mt-2 p-3 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-[#232529] rounded-lg flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-[#232529] rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-[#232529] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export const clearPreviewCache = () => {
  previewCache.clear();
};