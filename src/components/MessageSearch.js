// components/MessageSearch.js

'use client';

import { forwardRef } from 'react';
import { Search, ArrowUp, ArrowDown, XCircle, Loader } from 'lucide-react';

const MessageSearch = forwardRef(({
  searchQuery,
  onSearch,
  onNext,
  onPrevious,
  onClose,
  resultsCount,
  currentIndex,
  isSearching
}, ref) => {
  return (
    <div className="px-4 py-2 border-b border-[#f1f3f4] dark:border-[#181A1E] bg-white dark:bg-[#0c0c0c]">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5f6368] dark:text-gray-400" />
          <input
            ref={ref}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search in conversation..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-[#101010] border border-transparent focus:border-[#34A853] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#34A853]/20 transition-all text-[#202124] dark:text-white"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader size={14} className="animate-spin text-[#5f6368] dark:text-gray-400" />
            </div>
          )}
        </div>
        
        {resultsCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#5f6368] dark:text-gray-400 whitespace-nowrap">
              {currentIndex + 1} of {resultsCount}
            </span>
            <button
              onClick={onPrevious}
              disabled={resultsCount === 0}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp size={16} className="text-[#5f6368] dark:text-gray-400" />
            </button>
            <button
              onClick={onNext}
              disabled={resultsCount === 0}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDown size={16} className="text-[#5f6368] dark:text-gray-400" />
            </button>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-lg transition-colors"
        >
          <XCircle size={18} className="text-[#5f6368] dark:text-gray-400" />
        </button>
      </div>
      
      {searchQuery && resultsCount === 0 && !isSearching && (
        <div className="mt-2 text-xs text-center text-[#5f6368] dark:text-gray-400">
          No messages found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
});

MessageSearch.displayName = 'MessageSearch';

export default MessageSearch;