'use client';

import { Calendar, Sparkles } from 'lucide-react';
import { useUser } from '@/context/UserContext';

// Define the badge tiers with names, point thresholds, and SVG paths
const tiers = [
  { 
    name: 'Bronze', 
    min: 0, 
    max: 999, 
    nextRequirement: 1000,
    icon: '/bronze.svg',
  },
  { 
    name: 'Silver', 
    min: 1000, 
    max: 3999, 
    nextRequirement: 4000,
    icon: '/silver.svg',
  },
  { 
    name: 'Gold', 
    min: 4000, 
    max: 9999, 
    nextRequirement: 10000,
    icon: '/gold.svg',
  },
  { 
    name: 'Platinum', 
    min: 10000, 
    max: 19999, 
    nextRequirement: 20000,
    icon: '/platinum.svg',
  },
  { 
    name: 'Diamond', 
    min: 20000, 
    max: 34999, 
    nextRequirement: 35000,
    icon: '/diamond.svg',
  },
  { 
    name: 'Obsidian', 
    min: 35000, 
    max: 59999, 
    nextRequirement: 60000,
    icon: '/obsidian.svg',
  },
  { 
    name: 'Opal', 
    min: 60000, 
    max: 79999, 
    nextRequirement: 80000,
    icon: '/opal.svg',
  },
  { 
    name: 'Ultimate', 
    min: 80000, 
    max: Infinity, 
    nextRequirement: null,
    icon: '/ultimate.svg',
  },
];

// Badge Component
const BadgeIcon = ({ tier, size = 'md', isUnlocked = true, isCurrent = false }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
  };

  return (
    <div className="relative flex items-center justify-center">
      <img 
        src={tier.icon} 
        alt={`${tier.name} badge`}
        className={`${sizeClasses[size]} ${!isUnlocked ? '' : ''} ${isCurrent ? ' rounded-full' : ''} transition-all`}
        onError={(e) => {
          // Fallback if image doesn't load
          e.target.style.display = 'none';
        }}
      />
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* <span className="text-2xl font-bold text-[#5f6368]">?</span> */}
        </div>
      )}
    </div>
  );
};

export default function LevelPage() {
  const { userName, points, pointsHistory } = useUser();

  // Find current tier based on points
  const currentTier = tiers.find(tier => points >= tier.min && points <= tier.max) || tiers[0];
  const currentTierIndex = tiers.findIndex(t => t.name === currentTier.name);
  const nextTier = tiers[currentTierIndex + 1];

  // Calculate progress to next tier
  const progressPercent = nextTier
    ? Math.min(100, Math.round(((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100))
    : 100;

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
          Your journey, one point at a time.
        </p>
      </header>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl">
        {/* Left Column - Badges and Level */}
        <div className="space-y-6">
          {/* Current tier card */}
          <div className="bg-white rounded-3xl p-8  border-[#dadce0]">
            <div className="flex items-center gap-6 flex-wrap">
              <BadgeIcon tier={currentTier} size="lg" isUnlocked={true} isCurrent={true} />
              <div className="flex-1">
                <h2 className="text-2xl small font-semibold text-[#000000] mb-2">
                  {currentTier.name} Tier
                </h2>
                <div className="h-4 bg-green-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-4 bg-green-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-[#5f6368] text-sm">
                  {nextTier
                    ? `${points.toLocaleString()} / ${nextTier.min.toLocaleString()} points to ${nextTier.name}`
                    : 'Maximum tier reached! Great job!'}
                </p>
              </div>
            </div>
          </div>

          {/* All badges grid */}
          <div className="bg-white rounded-3xl p-8  border-[#dadce0]">
            <h2 className="text-xl font-semibold mb-6 text-[#000000]">All Tiers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {tiers.map((tier) => {
                const isUnlocked = points >= tier.min;
                const isCurrent = currentTier.name === tier.name;
                return (
                  <div
                    key={tier.name}
                    className={`p-4 rounded-3xl transition-all ${
                      isCurrent
                        ? 'bg-green-100  border-green-600'
                        : isUnlocked
                        ? 'bg-white border border-[#dadce0] hover:shadow-md'
                        : 'bg-gray-50  '
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <BadgeIcon 
                        tier={tier} 
                        size="sm" 
                        isUnlocked={isUnlocked} 
                        isCurrent={isCurrent} 
                      />
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className="text-base  font-semibold text-[#000000]">
                            {tier.name}
                          </span>
                          
                        </div>
                        <p className="text-xs text-[#5f6368]">
                          {tier.min === 0 
                            ? `${tier.nextRequirement?.toLocaleString() || '∞'} pts`
                            : tier.nextRequirement
                            ? `${tier.nextRequirement.toLocaleString()} pts`
                            : `${tier.min.toLocaleString()}+ pts`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Points History */}
        <div className="bg-white rounded-3xl p-8  border-[#dadce0] h-fit">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#000000]">Points History</h2>
            <span className="text-sm text-[#5f6368]">Total: {points.toLocaleString()} pts</span>
          </div>
          
          {pointsHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#5f6368] mb-2">No points yet</p>
              <p className="text-sm text-[#5f6368]">Complete your first good deed to earn points!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {pointsHistory.map((entry, index) => (
                <div key={index} className="border-b border-[#f1f3f4] pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-[#202124] text-sm">
                      {formatDisplayDate(entry.date)} at {entry.time}
                    </span>
                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                      +{entry.points}
                    </span>
                  </div>
                  <p className="text-sm text-[#5f6368] line-clamp-2">{entry.reflection}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Stats Summary */}
          <div className="mt-6 pt-6 border-t border-[#f1f3f4]">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">{pointsHistory.length}</p>
                <p className="text-xs text-[#5f6368]">Total Entries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">
                  {pointsHistory.length > 0 
                    ? Math.round(points / pointsHistory.length) 
                    : 0}
                </p>
                <p className="text-xs text-[#5f6368]">Avg Points/Entry</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f3f4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dadce0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #bdc1c6;
        }
      `}</style>
    </main>
  );
}