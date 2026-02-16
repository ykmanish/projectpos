'use client';

import { useState, useEffect } from 'react';
import {
  Home,
  Star,
  Award,
  Gift,
  Calendar,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

export default function DailyPositivityClient() {
  const [userName, setUserName] = useState('');
  const [tempName, setTempName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Points and history
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [completedToday, setCompletedToday] = useState(false);

  // UI state
  const [activeView, setActiveView] = useState('home'); // 'home', 'points', 'level', 'rewards'
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile

  // Level definitions (15 levels, 5 points each)
  const levelThresholds = [
    { level: 1, min: 0, max: 4 },
    { level: 2, min: 5, max: 9 },
    { level: 3, min: 10, max: 14 },
    { level: 4, min: 15, max: 19 },
    { level: 5, min: 20, max: 24 },
    { level: 6, min: 25, max: 29 },
    { level: 7, min: 30, max: 34 },
    { level: 8, min: 35, max: 39 },
    { level: 9, min: 40, max: 44 },
    { level: 10, min: 45, max: 49 },
    { level: 11, min: 50, max: 54 },
    { level: 12, min: 55, max: 59 },
    { level: 13, min: 60, max: 64 },
    { level: 14, min: 65, max: 69 },
    { level: 15, min: 70, max: Infinity },
  ];

  const getCurrentLevel = (pts) => {
    for (let i = 0; i < levelThresholds.length; i++) {
      if (pts >= levelThresholds[i].min && pts <= levelThresholds[i].max) {
        return levelThresholds[i].level;
      }
    }
    return 15; // beyond 70 points
  };

  const getNextLevelPoints = (pts) => {
    const current = getCurrentLevel(pts);
    if (current === 15) return null;
    const nextThreshold = levelThresholds.find((l) => l.level === current + 1);
    return nextThreshold ? nextThreshold.min : null;
  };

  const getProgressPercent = (pts) => {
    const current = getCurrentLevel(pts);
    if (current === 15) return 100;
    const currentLevel = levelThresholds.find((l) => l.level === current);
    const nextLevel = levelThresholds.find((l) => l.level === current + 1);
    const range = nextLevel.min - currentLevel.min;
    const progress = pts - currentLevel.min;
    return Math.min(100, Math.round((progress / range) * 100));
  };

  const currentLevel = getCurrentLevel(points);
  const nextLevelPoints = getNextLevelPoints(points);
  const progressPercent = getProgressPercent(points);

  const loadingMessages = [
    'Crafting your daily inspiration...',
    'Finding the perfect words for you...',
    'Selecting today‘s wisdom...',
    'Preparing something meaningful...',
    'Brewing positivity just for you...',
    'Curating your moment of zen...',
    'Gathering rays of sunshine...',
    'Handpicking today‘s motivation...',
  ];

  // Generate or retrieve user ID
  useEffect(() => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', storedUserId);
      console.log('🆕 Generated new user ID:', storedUserId);
    } else {
      console.log('✅ Retrieved existing user ID:', storedUserId);
    }
    setUserId(storedUserId);

    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
      setTempName(savedName);
      setIsInitialized(true);
    } else {
      setShowNameModal(true);
    }
  }, []);

  // Load user data from MongoDB
  useEffect(() => {
    if (userId && userName) {
      fetchUserData();
    }
  }, [userId, userName]);

  // Fetch content after name is set
  useEffect(() => {
    if (isInitialized && userId) {
      fetchDailyContent();
    }
  }, [isInitialized, userId]);

  // Rotate loading messages
  useEffect(() => {
    if (isLoading) {
      let index = 0;
      setLoadingMessage(loadingMessages[0]);
      const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.user) {
        setPoints(data.user.points || 0);
        setPointsHistory(data.user.history || []);
        const todayStr = new Date().toLocaleDateString('en-CA');
        setCompletedToday(data.user.history?.some((entry) => entry.date === todayStr) || false);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchDailyContent = async () => {
    setIsLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
      const cachedContent = localStorage.getItem(`dailyContent_${userId}`);
      const cachedDate = localStorage.getItem(`dailyContentDate_${userId}`);

      if (cachedContent && cachedDate === today) {
        console.log('✅ Using localStorage cached content for user:', userId);
        setContent(JSON.parse(cachedContent));
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/daily-content?timezone=${encodeURIComponent(timezone)}&userId=${encodeURIComponent(userId)}`
      );
      const data = await response.json();

      setContent(data);
      localStorage.setItem(`dailyContent_${userId}`, JSON.stringify(data));
      localStorage.setItem(`dailyContentDate_${userId}`, today);

      // Clean up old caches
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (key.startsWith('dailyContentDate_') && key !== `dailyContentDate_${userId}`) {
          const oldDate = localStorage.getItem(key);
          if (oldDate !== today) {
            const oldUserId = key.replace('dailyContentDate_', '');
            localStorage.removeItem(`dailyContent_${oldUserId}`);
            localStorage.removeItem(key);
          }
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error fetching daily content:', error);
      setContent({
        quote: 'Keep your face always toward the sunshine—and shadows will fall behind you.',
        author: 'Walt Whitman',
        goodDeed: 'Send a message of appreciation to someone who helped you recently.',
      });
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      localStorage.setItem('userName', tempName.trim());
      setUserName(tempName.trim());
      setShowNameModal(false);
      setIsInitialized(true);

      try {
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name: tempName.trim() }),
        });
      } catch (error) {
        console.error('Error saving user name to DB:', error);
      }
    }
  };

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

  const handleMarkComplete = () => {
    if (completedToday) return;
    setShowCompletionModal(true);
  };

  const handleSubmitReflection = async () => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newEntry = {
      date: todayStr,
      time: timeStr,
      reflection: reflectionText.trim() || 'No reflection provided',
      points: 1,
    };

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'addPoint',
          entry: newEntry,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setPoints(data.user.points);
        setPointsHistory(data.user.history);
        setCompletedToday(true);
      }
    } catch (error) {
      console.error('Error saving point:', error);
      // fallback optimistic update
      setPoints((prev) => prev + 1);
      setPointsHistory((prev) => [newEntry, ...prev]);
      setCompletedToday(true);
    }

    setShowCompletionModal(false);
    setReflectionText('');
  };

  const formatDisplayDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  // --- Name Modal ---
  if (showNameModal) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center text-[#202124] p-6">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
        </div>
        <div className="relative z-50 w-full max-w-lg animate-fade-in">
          <div className="bg-white rounded-3xl p-8  border-[#dadce0]">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold small text-[#000000] mb-2">
                Welcome to Daily Positivity
              </h2>
              <p className="text-base text-[#5f6368]">
                Let‘s personalize your experience with some daily inspiration
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <input
                  id="name-input"
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] text-base transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                />
              </div>
              <button
                onClick={handleSaveName}
                disabled={!tempName.trim()}
                className="w-full px-6 py-3 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1765cc] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-base transition-all"
              >
                Get Started
              </button>
            </div>
            <p className="text-xs text-[#5f6368] text-center mt-6">
              Your daily inspiration is just a moment away 🌟
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading Skeleton ---
  if (isLoading || !content) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center text-[#202124] p-6 transition-colors duration-300">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
        </div>
        <main className="w-full max-w-6xl mx-auto flex flex-col gap-10">
          <header className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium text-[#5f6368] mb-4">
              <Calendar className="w-4 h-4 text-[#1a73e8]" />
              <span>{today}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-[#202124] tracking-tight">
              {getGreeting()}, {userName || 'Friend'}
            </h1>
            <div className="flex items-center justify-center gap-2 min-h-[32px]">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#1a73e8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-[#1a73e8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-[#1a73e8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <p className="text-base text-[#1a73e8] font-medium animate-pulse">
                {loadingMessage}
              </p>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="relative bg-white rounded-3xl p-10 md:p-12 flex flex-col justify-center min-h-[380px]">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Sparkles className="w-32 h-32 text-[#1a73e8] transform rotate-12 animate-pulse" />
              </div>
              <div className="relative flex flex-col items-start justify-center z-10 space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
            <div className="relative bg-white rounded-3xl p-10 md:p-12 flex flex-col min-h-[380px]">
              <div className="flex-grow flex flex-col justify-center items-center text-center space-y-5 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-2">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                </div>
                <div className="h-7 bg-gray-200 rounded w-48 mx-auto"></div>
                <div className="space-y-2 w-full max-w-sm">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[#f1f3f4] flex justify-center">
                <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
              </div>
            </div>
          </div>
          <footer className="text-center py-4 text-[#5f6368] text-sm opacity-50">
            <p>Loading your daily inspiration...</p>
          </footer>
        </main>
      </div>
    );
  }

  // --- Main UI with Sidebar ---
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex text-[#202124] transition-colors duration-300">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
  className={`
    fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white/80 backdrop-blur-sm border-[#dadce0] p-6 flex flex-col h-screen transition-transform duration-300
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `}
>
  {/* User info */}
  <div className="mb-8">
    <div className="bg-[#e8f0fe]  rounded-3xl p-4 ">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-[#5f6368]">Points</span>
        <span className="font-semibold text-[#1a73e8]">{points}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-[#5f6368]">Level</span>
        <span className="font-semibold text-[#1a73e8]">{currentLevel}</span>
      </div>
      <div className="mt-3 h-3 bg-[#d2e3fc] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1a73e8] rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      {nextLevelPoints && (
        <p className="text-xs text-[#5f6368] mt-2">
          {nextLevelPoints - points} points to next level
        </p>
      )}
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 space-y-2">
    <button
      onClick={() => {
        setActiveView('home');
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-3xl transition-all ${
        activeView === 'home'
          ? 'bg-[#EBF1F9] text-[#000000]'
          : 'text-[#000000] hover:bg-gray-50'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[#4285f4]/30 flex items-center justify-center flex-shrink-0">
        <Home size={20} className="text-[#000000]" />
      </div>
      <span className="font-medium">Home</span>
    </button>

    <button
      onClick={() => {
        setActiveView('points');
        setSidebarOpen(false);
      }}
      className={`w-full flex  items-center gap-3 px-3 py-3 rounded-3xl transition-all ${
        activeView === 'points'
          ? 'bg-[#EBF1F9] text-[#000000]'
          : 'text-[#000000] hover:bg-gray-50'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[#fbbc04]/30 flex items-center justify-center flex-shrink-0">
        <Star size={20} className="text-[#000000]" />
      </div>
      <span className="font-medium">My Points</span>
    </button>

    <button
      onClick={() => {
        setActiveView('level');
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-3xl transition-all ${
        activeView === 'level'
          ? 'bg-[#EBF1F9] text-[#000000]'
          : 'text-[#000000] hover:bg-gray-50'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[#34a853]/30 flex items-center justify-center flex-shrink-0">
        <Award size={20} className="text-[#000000]" />
      </div>
      <span className="font-medium">Level</span>
    </button>

    <button
      onClick={() => {
        setActiveView('rewards');
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-3xl transition-all ${
        activeView === 'rewards'
          ? 'bg-[#EBF1F9] text-[#000000]'
          : 'text-[#000000] hover:bg-gray-50'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[#ea4335]/30 flex items-center justify-center flex-shrink-0">
        <Gift size={20} className="text-[#000000]" />
      </div>
      <span className="font-medium">Rewards</span>
    </button>
  </nav>

  {/* Footer hint */}
  <div className="pt-6 text-xs text-[#5f6368] border-t border-[#dadce0]">
    <p>Complete daily deeds to earn points and level up!</p>
  </div>
</aside>


      {/* Main Content */}
      <main className="flex-1 p-8 bg-[#F0F4F9] overflow-y-auto">
        <header className="space-y-3 ml-4 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium text-[#5f6368] mb-4">
            <Calendar className="w-4 h-4 text-[#1a73e8]" />
            <span>{today}</span>
          </div>
          <h1 className="text-4xl small md:text-4xl font-semibold text-[#000000] tracking-tight">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-base text-[#5f6368] font-normal">
            {activeView === 'home' && "Here‘s your daily dose of inspiration and focus."}
            {activeView === 'points' && "Your journey, one point at a time."}
            {activeView === 'level' && "Climb the levels of positivity."}
            {activeView === 'rewards' && "Redeem your points for special rewards."}
          </p>
        </header>

        {/* Home View */}
        {activeView === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
            <article className="group relative bg-white rounded-[40px] p-10 md:p-12 transition-all duration-200 flex flex-col justify-center min-h-[380px]">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Sparkles className="w-32 h-32 text-[#1a73e8] transform rotate-12" />
              </div>
              <div className="relative flex flex-col items-start justify-center z-10">
                <blockquote className="mb-6">
                  <p className="text-2xl small font-semibold md:text-3xl text-[#000000] leading-tight">
                    {content?.quote}
                  </p>
                </blockquote>
                <div className="flex items-center gap-3">
                  <cite className="not-italic font-normal text-[#5f6368] text-base">
                    {content?.author}
                  </cite>
                </div>
              </div>
            </article>

            <article className="relative bg-white rounded-[40px] p-10 md:p-12 transition-all duration-200 flex flex-col min-h-[380px]">
              <div className="flex-grow flex flex-col justify-center items-center text-center space-y-5">
                <div className="w-20 h-20 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-2">
                <svg className="w-10 h-10 text-[#1a73e8]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
                <h2 className="text-xl small md:text-2xl font-semibold text-[#000000]">
                  Connect with Kindness
                </h2>
                <p className="text-[#5f6368] text-base leading-relaxed max-w-sm mx-auto">
                  {content?.goodDeed}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-[#f1f3f4] flex justify-center">
                {completedToday ? (
                  <button
                    disabled
                    className="group flex items-center gap-2 px-6 py-4 bg-gray-300 text-white rounded-2xl font-medium text-sm cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Done for Today</span>
                  </button>
                ) : (
                  <button
                    onClick={handleMarkComplete}
                    className="group flex items-center gap-2 px-6 py-4 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-2xl font-medium text-sm transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mark as Complete</span>
                  </button>
                )}
              </div>
            </article>
          </div>
        )}

        {/* Points View */}
        {activeView === 'points' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-3xl p-8  border-[#dadce0]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl small font-semibold text-[#000000]">Points History</h2>
              </div>
              {pointsHistory.length === 0 ? (
                <p className="text-center text-[#5f6368] py-12">
                  No points yet. Complete your first good deed!
                </p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {pointsHistory.map((entry, index) => (
                    <div key={index} className="border-b border-[#f1f3f4] pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-[#202124]">
                          {formatDisplayDate(entry.date)} at {entry.time}
                        </span>
                        <span className="bg-[#e8f0fe] text-[#1a73e8] px-2 py-1 rounded-full text-xs font-medium">
                          +{entry.points} point
                        </span>
                      </div>
                      <p className="text-sm text-[#5f6368]">{entry.reflection}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Level View */}
        {activeView === 'level' && (
          <div className="max-w-7xl">
            <div className="bg-white rounded-3xl p-8  border-[#dadce0] mb-6">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="w-24 small h-24 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center text-white text-4xl font-bold">
                  {currentLevel}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold small text-[#000000] mb-2">Level {currentLevel}</h2>
                  <div className="h-4 bg-[#d2e3fc] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-4 bg-[#1a73e8] rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[#5f6368] text-sm">
                    {nextLevelPoints
                      ? `${points} / ${nextLevelPoints} points to Level ${currentLevel + 1}`
                      : 'Maximum level reached! Great job!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8  border-[#dadce0]">
              <div className="grid grid-cols-2 lg:grid-cols-8 gap-4">
                {levelThresholds.map((level) => {
                  const isUnlocked = points >= level.min;
                  const isCurrent = currentLevel === level.level;
                  return (
                    <div
                      key={level.level}
                      className={`p-4 rounded-3xl transition-all ${
                        isCurrent
                          ? 'border-[#1a73e8] bg-[#e8f0fe]'
                          : isUnlocked
                          ? 'border-[#dadce0] bg-white'
                          : 'border-[#dadce0] bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg small font-semibold text-[#202124]">
                          Level {level.level}
                        </span>
                        {isUnlocked && (
                          <Sparkles className="w-5 h-5 text-[#1a73e8]" />
                        )}
                      </div>
                      <p className="text-sm text-[#5f6368]">
                        {level.max === Infinity
                          ? `${level.min}+ points`
                          : `${level.min}–${level.max} points`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rewards View */}
        {activeView === 'rewards' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-3xl p-12 text-center max-w-md  border-[#dadce0]">
              <Gift className="w-16 h-16 text-[#1a73e8] mx-auto mb-4" />
              <h2 className="text-2xl font-semibold small text-[#000000] mb-2">Coming Soon</h2>
              <p className="text-[#5f6368]">
                We‘re working on exciting rewards for you. Check back later!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-[#dadce0]">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold small text-[#000000] mb-2">
                How was your day?
              </h2>
              <p className="text-base text-[#5f6368]">
                Share a quick reflection on today's good deed
              </p>
            </div>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="I felt great helping someone..."
              rows="4"
              className="w-full px-4 py-3 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] text-base transition-all mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setReflectionText('');
                }}
                className="flex-1 px-4 py-3 border border-[#dadce0] rounded-xl hover:bg-gray-50 text-[#202124] font-medium text-base transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReflection}
                className="flex-1 px-4 py-3 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-xl font-medium text-base transition-all"
              >
                Submit & Earn 1 Point
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}