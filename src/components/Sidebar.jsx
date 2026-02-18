// components/Sidebar.js

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Award, Gift, LogOut, History, AlertCircle, Users, Rss, MessageCircle, Moon, Sun } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { BeanHead } from 'beanheads';

// Logout Confirmation Modal Component
function LogoutModal({ isOpen, onClose, onConfirm, userName }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur z-50 transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-[#181A1E] rounded-3xl max-w-md w-full p-6 pointer-events-auto transform transition-all duration-300 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl small font-semibold text-[#000000] dark:text-white text-center mb-2">
            Logout Confirmation
          </h2>
          <p className="text-[#5f6368] dark:text-gray-400 text-center mb-6">
            Are you sure you want to logout? 
            You can always come back anytime.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-3xl border border-[#dadce0] dark:border-[#232529] text-[#202124] dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-[#232529] transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-6 py-3 rounded-3xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { points, getCurrentLevel, getProgressPercent, getNextLevelPoints, userName, logout, avatar } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [beanConfig, setBeanConfig] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const currentLevel = getCurrentLevel(points);
  const nextLevelPoints = getNextLevelPoints(points);
  const progressPercent = getProgressPercent(points);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      const isDark = savedMode === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  useEffect(() => {
    if (avatar) {
      try {
        const parsed = typeof avatar === 'string' ? JSON.parse(avatar) : avatar;
        if (parsed.beanConfig) {
          setBeanConfig(parsed.beanConfig);
        }
      } catch (e) {
        console.error('Failed to parse avatar:', e);
        setBeanConfig(null);
      }
    } else {
      setBeanConfig(null);
    }

    // Check for unread messages (you can implement this later)
    // fetchUnreadMessages();
  }, [avatar]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home, color: 'bg-[#4285f4]/30 dark:bg-[#4285f4]/20' },
    { path: '/feed', label: 'Feed', icon: Rss, color: 'bg-[#34A853]/30 dark:bg-[#34A853]/20' },
    { path: '/friends', label: 'Friends', icon: MessageCircle, color: 'bg-[#8e44ad]/30 dark:bg-[#8e44ad]/20', badge: unreadMessages },
    { path: '/history', label: 'Today in History', icon: History, color: 'bg-[#8e44ad]/30 dark:bg-[#8e44ad]/20' },
    { path: '/level', label: 'Level', icon: Award, color: 'bg-[#34a853]/30 dark:bg-[#34a853]/20' },
    { path: '/rewards', label: 'Rewards', icon: Gift, color: 'bg-[#ea4335]/30 dark:bg-[#ea4335]/20' },
    { path: '/referral', label: 'Referral', icon: Users, color: 'bg-[#f39c12]/30 dark:bg-[#f39c12]/20' },
  ];

  const handleNavigation = (path) => {
    router.push(path);
    setSidebarOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#0c0c0c] backdrop-blur-sm  border-[#dadce0] dark:border-[#181A1E] p-6 flex flex-col h-full transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-3xl transition-all relative ${
                  isActive
                    ? 'bg-green-50 dark:bg-[#181A1E] text-[#000000] dark:text-white'
                    : 'text-[#000000] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#101010]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className="text-[#000000] dark:text-white" />
                </div>
                <span className="font-medium">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-3xl transition-all text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <LogOut size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        <div className="space-y-2">
          {/* Dark Mode Toggle Button */}
          

          {/* Profile Button */}
          <button
            onClick={() => {
              router.push('/profile');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 p-3 rounded-3xl bg-gray-100 dark:bg-[#101010] hover:bg-gray-200 dark:hover:bg-[#181A1E] transition-all w-full"
          >
            <div className="w-10 h-10 rounded-full bg-[#e8f0fe] dark:bg-[#232529] flex items-center justify-center flex-shrink-0 overflow-hidden border border-[#dadce0] dark:border-[#181A1E]">
              {beanConfig ? (
                <BeanHead {...beanConfig} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {userName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#202124] dark:text-white">{userName}</p>
              <p className="text-xs text-[#5f6368] dark:text-gray-400">View profile</p>
            </div>
          </button>
        </div>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        userName={userName}
      />
    </>
  );
}