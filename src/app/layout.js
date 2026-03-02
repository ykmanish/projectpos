// app/layout.js

'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { UserProvider, useUser } from '@/context/UserContext';
import { SocketProvider } from '@/context/SocketContext';
import Sidebar from '@/components/Sidebar';
import ModerationNotification from '@/components/ModerationNotification';

import './globals.css';

function LayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { isInitialized } = useUser();

  const publicRoutes = ['/signup', '/signin', '/welcome', '/onboarding', '/debug'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      if (isPublicRoute) {
        setIsCheckingAuth(false);
        return;
      }

      if (!userId || !userName) {
        router.push('/signin');
        return;
      }

      try {
        const response = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`);
        const data = await response.json();

        if (data.user && !data.user.onboardingCompleted) {
          router.push('/welcome');
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [pathname, router, isPublicRoute]);

  if (isCheckingAuth && !isPublicRoute) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5f6368]">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="bg-[#f8f9fa] h-screen flex text-[#202124] transition-colors duration-300 overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white rounded-full border border-[#dadce0] shadow-lg hover:shadow-xl transition-all"
      >
        <Menu size={24} className="text-[#1a73e8]" />
      </button>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      {children}
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Daily Positivity - Spread Good Deeds</title>
                     
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />

<meta name="theme-color" content="#0C0C0D" media="(prefers-color-scheme: dark)" />

        <meta name="description" content="Your daily dose of inspiration and kindness" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="newq">
        <UserProvider>
          <SocketProvider>
            <LayoutContent>{children}
               <ModerationNotification />
            </LayoutContent>
          </SocketProvider>
        </UserProvider>
      </body>
    </html>
  );
}