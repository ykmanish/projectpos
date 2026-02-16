'use client';

import { useState, useEffect } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function LoadingSkeleton() {
  const { userName } = useUser();
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingMessages = [
    'Crafting your daily inspiration...',
    'Finding the perfect words for you...',
    "Selecting today's wisdom...",
    'Preparing something meaningful...',
    'Brewing positivity just for you...',
    'Curating your moment of zen...',
    'Gathering rays of sunshine...',
    "Handpicking today's motivation...",
  ];

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

  useEffect(() => {
    let index = 0;
    setLoadingMessage(loadingMessages[0]);
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[index]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
