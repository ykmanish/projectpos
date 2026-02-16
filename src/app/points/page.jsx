'use client';

import { Calendar } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function PointsPage() {
  const { userName, pointsHistory } = useUser();

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

  const formatDisplayDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  return (
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
          Your journey, one point at a time.
        </p>
      </header>

      <div className="max-w-3xl">
        <div className="bg-white rounded-3xl p-8 border-[#dadce0]">
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
    </main>
  );
}
