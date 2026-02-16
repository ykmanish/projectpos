'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (!name) {
      router.push('/signup');
      return;
    }
    setUserName(name);
  }, [router]);

  const handleContinue = () => {
    router.push('/onboarding');
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center text-[#202124] p-6">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#4285f4]/5 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-50 w-full max-w-5xl text-center animate-fade-in">
        <div className="mb-8">
          
          <h1 className="text-5xl small md:text-6xl font-bold text-[#000000] mb-4">
            Welcome, {userName}! 🎉
          </h1>
          <p className="text-xl text-[#5f6368] mb-8">
            We're thrilled to have you join our community of positive change-makers
          </p>
        </div>

        <div className="bg-white rounded-[35px] p-8 md:p-12  border-[#dadce0]  mb-8">
          {/* <h2 className="text-2xl font-semibold text-[#000000] mb-6">
            Here's what awaits you:
          </h2> */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-3xl bg-[#e8f0fe]">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="font-semibold text-[#000000] mb-2">Daily Inspiration</h3>
              <p className="text-sm text-[#5f6368]">Fresh quotes and good deeds every day</p>
            </div>
            <div className="p-6 rounded-3xl bg-[#fef7e0]">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="font-semibold text-[#000000] mb-2">Earn Rewards</h3>
              <p className="text-sm text-[#5f6368]">Level up as you complete good deeds</p>
            </div>
            <div className="p-6 rounded-3xl bg-[#e6f4ea]">
              <div className="text-4xl mb-3">💭</div>
              <h3 className="font-semibold text-[#000000] mb-2">Track Progress</h3>
              <p className="text-sm text-[#5f6368]">Reflect and watch your journey unfold</p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="group flex items-center justify-center gap-3 mx-auto px-8 py-4 bg-[#1a73e8] text-white rounded-2xl hover:bg-[#1765cc] font-medium text-lg transition-all "
          >
            Let's Personalize Your Experience
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <p className="text-sm text-[#5f6368]">
          This will only take a minute ⏱️
        </p>
      </div>
    </div>
  );
}
