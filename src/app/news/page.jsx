'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Newspaper, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Clock,
  Globe,
  Filter,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  TrendingUp
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

// Available interest categories
const INTEREST_CATEGORIES = [
  { id: 'technology', name: 'Technology', icon: '💻', color: 'bg-blue-100 text-blue-600' },
  { id: 'science', name: 'Science', icon: '🔬', color: 'bg-purple-100 text-purple-600' },
  { id: 'business', name: 'Business', icon: '📈', color: 'bg-green-100 text-green-600' },
  { id: 'health', name: 'Health', icon: '🏥', color: 'bg-red-100 text-red-600' },
  { id: 'environment', name: 'Environment', icon: '🌍', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: 'bg-orange-100 text-orange-600' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'bg-pink-100 text-pink-600' },
  { id: 'politics', name: 'Politics', icon: '🏛️', color: 'bg-gray-100 text-gray-600' },
  { id: 'world', name: 'World News', icon: '🌐', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'ai', name: 'Artificial Intelligence', icon: '🤖', color: 'bg-cyan-100 text-cyan-600' },
  { id: 'space', name: 'Space Exploration', icon: '🚀', color: 'bg-violet-100 text-violet-600' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '💰', color: 'bg-yellow-100 text-yellow-600' },
];

export default function NewsPage() {
  const router = useRouter();
  const { userName, userId } = useUser();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [savedInterests, setSavedInterests] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [showInterestSelector, setShowInterestSelector] = useState(true);
  const [bookmarkedNews, setBookmarkedNews] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Load saved interests and bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('newsInterests');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedInterests(parsed);
      setSavedInterests(parsed);
    }

    const bookmarks = localStorage.getItem('bookmarkedNews');
    if (bookmarks) {
      setBookmarkedNews(JSON.parse(bookmarks));
    }
  }, []);

  // Load news when interests are selected
  useEffect(() => {
    if (savedInterests.length > 0) {
      fetchNews(false);
    }
  }, [savedInterests]);

  const fetchNews = async (forceRefresh = false) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          interests: savedInterests,
          forceRefresh
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      
      // Add unique IDs if not present
      const newsWithIds = data.news.map((item, index) => ({
        ...item,
        id: item.id || index + 1,
        bookmarked: bookmarkedNews.some(b => b.url === item.url)
      }));
      
      setNews(newsWithIds);
      setLastUpdated(new Date());
      
      // Hide interest selector after successful fetch
      setShowInterestSelector(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInterestToggle = (interestId) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const handleSaveInterests = () => {
    if (selectedInterests.length === 0) {
      alert('Please select at least one interest');
      return;
    }
    localStorage.setItem('newsInterests', JSON.stringify(selectedInterests));
    setSavedInterests(selectedInterests);
    fetchNews(true); // Force refresh when changing interests
  };

  const handleRefresh = () => {
    fetchNews(true);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleBookmark = (newsItem) => {
    setBookmarkedNews(prev => {
      const isBookmarked = prev.some(b => b.url === newsItem.url);
      let newBookmarks;
      
      if (isBookmarked) {
        newBookmarks = prev.filter(b => b.url !== newsItem.url);
      } else {
        newBookmarks = [...prev, { ...newsItem, bookmarkedAt: Date.now() }];
      }
      
      localStorage.setItem('bookmarkedNews', JSON.stringify(newBookmarks));
      return newBookmarks;
    });

    // Update news items bookmarked status
    setNews(prev => prev.map(item => 
      item.url === newsItem.url 
        ? { ...item, bookmarked: !item.bookmarked }
        : item
    ));
  };

  const filteredNews = filterCategory === 'all' 
    ? news 
    : news.filter(item => item.category.toLowerCase() === filterCategory.toLowerCase());

  const categories = [...new Set(news.map(item => item.category))];

  // Format relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex-1 p-8 bg-[#EEF1F0] overflow-y-auto">
        <header className="space-y-3 ml-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium text-[#5f6368] mb-4">
            <Newspaper className="w-4 h-4 text-[#1a73e8]" />
            <span>{today}</span>
          </div>
          <h1 className="text-3xl md:text-4xl text-[#000000]">
            {getGreeting()}, <span className="font-semibold">{userName}</span>
          </h1>
          <p className="text-base text-[#5f6368] font-normal">
            Curating your personalized news feed...
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-[#dadce0] animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 bg-[#EEF1F0] overflow-y-auto">
      <header className="space-y-3 ml-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium text-[#5f6368]">
            <Newspaper className="w-4 h-4 text-[#1a73e8]" />
            <span>{today}</span>
          </div>
          
          {!showInterestSelector && savedInterests.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInterestSelector(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-50 transition-all text-sm font-medium text-[#5f6368] border border-[#dadce0]"
              >
                <Filter className="w-4 h-4" />
                Change Interests
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] transition-all text-sm font-medium text-white disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl text-[#000000]">
          {getGreeting()}, <span className="font-semibold">{userName}</span>
        </h1>
        <p className="text-base text-[#5f6368] font-normal">
          {showInterestSelector 
            ? "Select your interests to get personalized news" 
            : "Your personalized news feed based on your interests"}
        </p>
        
        {lastUpdated && !showInterestSelector && (
          <p className="text-xs text-[#5f6368] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </header>

      {/* Interest Selector */}
      {showInterestSelector ? (
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#dadce0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#1a73e8]" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#000000]">Personalize Your News</h2>
                <p className="text-[#5f6368]">Select topics you're interested in (choose at least one)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {INTEREST_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleInterestToggle(category.id)}
                  className={`
                    flex items-center gap-3 p-4 rounded-2xl border-2 transition-all
                    ${selectedInterests.includes(category.id)
                      ? 'border-[#1a73e8] bg-[#e8f0fe]'
                      : 'border-[#dadce0] hover:border-[#1a73e8] hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-medium text-[#000000]">{category.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveInterests}
              disabled={selectedInterests.length === 0}
              className="w-full py-4 rounded-2xl bg-[#1a73e8] text-white font-semibold hover:bg-[#1557b0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Personalized News
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${filterCategory === 'all'
                    ? 'bg-[#1a73e8] text-white'
                    : 'bg-white text-[#5f6368] hover:bg-gray-50 border border-[#dadce0]'
                  }
                `}
              >
                All News
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                    ${filterCategory === cat
                      ? 'bg-[#1a73e8] text-white'
                      : 'bg-white text-[#5f6368] hover:bg-gray-50 border border-[#dadce0]'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* News Grid */}
          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
              {filteredNews.map((newsItem) => {
                const isExpanded = expandedId === newsItem.id;
                const category = INTEREST_CATEGORIES.find(c => c.id === newsItem.category?.toLowerCase());
                
                return (
                  <div
                    key={newsItem.id}
                    className={`
                      bg-white rounded-3xl p-6 border transition-all duration-300
                      ${isExpanded ? 'border-[#1a73e8] shadow-lg' : 'border-[#dadce0] hover:shadow-md'}
                    `}
                  >
                    {/* Header with category and bookmark */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`
                        text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1
                        ${category?.color || 'bg-gray-100 text-gray-600'}
                      `}>
                        <span>{newsItem.imagePlaceholder || category?.icon || '📰'}</span>
                        {newsItem.category || 'News'}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(newsItem);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        {newsItem.bookmarked ? (
                          <BookmarkCheck className="w-5 h-5 text-[#1a73e8]" />
                        ) : (
                          <Bookmark className="w-5 h-5 text-[#5f6368]" />
                        )}
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-[#000000] mb-3 leading-tight">
                      {newsItem.title}
                    </h3>
                    
                    {/* Expandable content */}
                    <div 
                      className="relative overflow-hidden cursor-pointer"
                      onClick={() => toggleExpand(newsItem.id)}
                    >
                      <div
                        className={`
                          transition-all duration-700 ease-in-out
                          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-16 opacity-90'}
                        `}
                      >
                        <p className="text-zinc-900 text-sm">
                          {isExpanded ? newsItem.summary : newsItem.summary.substring(0, 100) + '...'}
                        </p>
                        
                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-[#5f6368]">
                              <Globe className="w-3 h-3" />
                              <span>Source: {newsItem.source}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{getRelativeTime(newsItem.publishedAt)}</span>
                            </div>
                            
                            <a
                              href={newsItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-sm font-medium hover:bg-[#d2e3fc] transition-all"
                            >
                              Read full article
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Gradient fade effect */}
                      {!isExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      )}
                    </div>
                    
                    {/* Read more indicator */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-[#5f6368]">
                        {getRelativeTime(newsItem.publishedAt)}
                      </span>
                      <button
                        onClick={() => toggleExpand(newsItem.id)}
                        className="flex items-center gap-1 text-xs font-medium text-[#1a73e8] hover:text-[#1557b0] transition-colors"
                      >
                        {isExpanded ? (
                          <>Show less <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Read more <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="w-16 h-16 text-[#5f6368] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#000000] mb-2">No News Found</h3>
              <p className="text-[#5f6368] mb-4">Try changing your interests or refreshing</p>
              <button
                onClick={() => setShowInterestSelector(true)}
                className="px-6 py-3 rounded-full bg-[#1a73e8] text-white font-medium hover:bg-[#1557b0] transition-all"
              >
                Change Interests
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}