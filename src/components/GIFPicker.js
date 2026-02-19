// components/GIFPicker.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function GIFPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);

  // GIPHY API configuration
  const API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'YOUR_GIPHY_API_KEY';
  const BASE_URL = 'https://api.giphy.com/v1/gifs';

  // Fetch trending GIFs on mount
  useEffect(() => {
    fetchTrendingGIFs();
  }, []);

  const fetchTrendingGIFs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${BASE_URL}/trending?api_key=${API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setTrending(data.data);
      }
    } catch (err) {
      console.error('Error fetching trending GIFs:', err);
      setError('Failed to load trending GIFs');
    } finally {
      setLoading(false);
    }
  };

  const searchGIFs = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setGifs([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${BASE_URL}/search?api_key=${API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&rating=g`
      );
      const data = await response.json();
      if (data.data) {
        setGifs(data.data);
      }
    } catch (err) {
      console.error('Error searching GIFs:', err);
      setError('Failed to search GIFs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (value.trim()) {
        searchGIFs(value);
      } else {
        setGifs([]);
      }
    }, 500);
  };

  const handleSelectGIF = (gif) => {
    // Get the appropriate GIF URL (fixed width for chat)
    const gifUrl = gif.images.fixed_width?.url || gif.images.original?.url;
    
    // Pass the GIF data in the format expected by ChatInterface
    // This only calls onSelect, which adds to attachments - no automatic sending
    onSelect({
      url: gifUrl,
      type: 'gif',
      name: gif.title || 'GIF',
      title: gif.title || 'GIF',
      gifId: gif.id,
      images: gif.images,
      username: gif.username,
      importDate: gif.import_datetime
    });
    
    // Close the picker after selection
    onClose();
  };

  const displayGIFs = query.trim() ? gifs : trending;

  return (
    <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-3xl shadow-xl w-80 md:w-96 max-h-[450px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-[#232529] flex items-center justify-between">
        <h3 className="font-medium text-[#202124] dark:text-white">Select GIF</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors"
        >
          <X size={18} className="text-[#5f6368] dark:text-gray-400" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-zinc-200 dark:border-[#232529]">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder="Search GIFs..."
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-[#232529] bg-white dark:bg-[#101010] text-[#202124] dark:text-white rounded-xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none text-sm"
          />
        </div>
        <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-2">
          Powered by GIPHY
        </p>
      </div>

      {/* GIF Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 size={24} className="animate-spin text-[#34A853]" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 text-sm p-4">
            {error}
          </div>
        )}

        {!loading && displayGIFs.length === 0 && (
          <div className="text-center text-[#5f6368] dark:text-gray-400 p-4">
            {query.trim() ? 'No GIFs found' : 'Start typing to search for GIFs'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {displayGIFs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => handleSelectGIF(gif)}
              className="relative aspect-video rounded-xl overflow-hidden hover:ring-2 hover:ring-[#34A853] transition-all group"
            >
              <img
                src={gif.images.fixed_width?.url || gif.images.original?.url}
                alt={gif.title || 'GIF'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs">Select</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}