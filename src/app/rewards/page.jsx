'use client';

import { Calendar, Gift } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function RewardsPage() {
  const { userName } = useUser();

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

  return (
    <main className="flex-1 p-8 bg-[#EEF1F0] overflow-y-auto">
      <header className="space-y-3 ml-4 mb-10">
       <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white -sm text-sm font-medium text-[#5f6368] mb-3">
          <Calendar className="w-4 h-4 text-[#34A853]" />
          <span>{today}</span>
        </div>
         <h1 className="text-3xl small md:text-4xl  text-[#000000]">
          {getGreeting()}, <span className="font-semibold">{userName}</span>
        </h1>
        <p className="text-base text-[#5f6368] font-normal">
          Redeem your points for special rewards.
        </p>
      </header>

      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl p-12 text-center max-w-md border-[#dadce0]">
          <Gift className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold small text-[#000000] mb-2">Coming Soon</h2>
          <p className="text-[#5f6368]">
            We're working on exciting rewards for you. Check back later!
          </p>
        </div>
      </div>
    </main>
  );
}
