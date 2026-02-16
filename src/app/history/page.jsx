'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function HistoryPage() {
  const { userName } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cachedDate, setCachedDate] = useState(null);

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

  // Check localStorage immediately on mount for cached history
  useEffect(() => {
    const loadCachedHistory = () => {
      try {
        const cached = localStorage.getItem('todayHistory');
        const cachedDate = localStorage.getItem('historyDate');
        const todayStr = new Date().toLocaleDateString('en-CA');
        
        if (cached && cachedDate === todayStr) {
          setEvents(JSON.parse(cached));
          setLoading(false);
          setCachedDate(todayStr);
          return true;
        }
      } catch (error) {
        console.error('Failed to load cached history:', error);
      }
      return false;
    };

    // Try to load from cache immediately
    const hasCached = loadCachedHistory();

    // Always fetch fresh data in the background (will update UI if different)
    const fetchHistory = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const todayStr = new Date().toLocaleDateString('en-CA');
        
        // If we have cached data, do a background refresh check
        const url = hasCached 
          ? `/api/history?timezone=${encodeURIComponent(timezone)}&refresh=false`
          : `/api/history?timezone=${encodeURIComponent(timezone)}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        setEvents(data);
        
        // Cache the data in localStorage
        localStorage.setItem('todayHistory', JSON.stringify(data));
        localStorage.setItem('historyDate', todayStr);
        
        setLoading(false);
        setCachedDate(todayStr);
      } catch (error) {
        console.error('Failed to fetch history:', error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Show loading skeleton only if no cached data
  if (loading && events.length === 0) {
    return (
      <main className="flex-1 p-8 bg-[#F0F4F9] overflow-y-auto">
        <header className="space-y-3 ml-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white -sm text-sm font-medium text-[#5f6368] mb-3">
          <Calendar className="w-4 h-4 text-[#34A853]" />
          <span>{today}</span>
        </div>
          <h1 className="text-4xl small md:text-4xl font-semibold text-[#000000] tracking-tight">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-base text-[#5f6368] font-normal">
            Loading today's positive moments...
          </p>
        </header>
        
        {/* Skeleton loading grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6  border-[#dadce0] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 bg-[#EEF1F0] overflow-y-auto">
      <header className="space-y-3 ml-4 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium text-[#5f6368] mb-4">
          <Calendar className="w-4 h-4 text-[#34A853]" />
          <span>{today}</span>
        </div>
        <h1 className="text-3xl small md:text-4xl  text-[#000000]">
          {getGreeting()}, <span className="font-semibold">{userName}</span>
        </h1>
        <p className="text-base text-[#5f6368] font-normal">
          Positive moments that happened on this day in history.
        </p>
        {loading && (
          <p className="text-sm text-[#1a73e8] animate-pulse">
            Refreshing in background...
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
        {events.map((event) => {
          const isExpanded = expandedId === event.id;
          
          return (
            <div
              key={event.id}
              onClick={() => toggleExpand(event.id)}
              className={`
                bg-white cursor-pointer rounded-3xl p-6  
                transition-all duration-300 ease-in-out 
               
                ${isExpanded ? 'border-[#1a73e8] -lg' : 'border-[#dadce0]'}
              `}
            >
              {/* Header with year and chevron */}
              <div className="flex justify-between items-start mb-3">
                <span className={`
                  text-sm font-semibold px-3 py-1 rounded-full 
                  transition-all duration-300
                  ${isExpanded 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-600'}
                `}>
                  {event.year}
                </span>
                
                
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-[#000000] mb-3 leading-tight">
                {event.title}
              </h3>
              
              {/* Expandable content with smooth height transition */}
              <div className="relative overflow-hidden">
                <div
                  className={`
                    transition-all duration-700 ease-in-out
                    ${isExpanded 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-16 opacity-90'
                    }
                  `}
                >
                  <p className={`
                    text-zinc-900 text-sm 
                    transition-all duration-700 ease-in-out
                  `}>
                    {isExpanded ? event.details : event.summary}
                  </p>
                </div>
                
                {/* Gradient fade effect when collapsed */}
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none transition-opacity duration-500" />
                )}
              </div>
              
              {/* Read more/less indicator with animation */}
              <div className="mt-4 flex items-center justify-end gap-1">
                <span className={`
                  text-xs font-medium 
                  transition-all duration-300 ease-in-out
                  ${isExpanded 
                    ? 'text-green-600 opacity-100' 
                    : 'text-[#5f6368] opacity-70 hover:opacity-100'
                  }
                `}>
                  {isExpanded ? 'Show less' : 'Read more'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom styles for smooth animations */}
      <style jsx>{`
        /* Smooth card hover effect */
        @keyframes gentle-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        
        /* Custom easing for ultra-smooth transitions */
        .ease-smooth {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Prevent layout shift during expansion */
        .grid > div {
          will-change: transform;
        }
        
        /* Smooth scale on hover */
        .hover\:scale-\[1\.02\]:hover {
          transform: scale(1.02);
        }
      `}</style>
    </main>
  );
}
