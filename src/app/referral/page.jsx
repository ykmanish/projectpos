// app/referral/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Copy, Check, Share2, Gift, Award, Calendar, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function ReferralPage() {
  const router = useRouter();
  const { 
    userName, 
    userId, 
    referralCode, 
    referrals, 
    totalReferrals, 
    referralPoints,
    fetchReferralData,
    copyReferralLink
  } = useUser();
  
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');

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
    if (userId) {
      // Simulate loading state for at least 800ms to show skeleton properly
      const timer = setTimeout(() => {
        fetchReferralData().then(() => {
          setLoading(false);
        });
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [userId]);

  useEffect(() => {
    if (referralCode) {
      setReferralLink(`${window.location.origin}/signup?ref=${referralCode}`);
    }
  }, [referralCode]);

  const handleCopyLink = () => {
    const link = copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Positivity App',
          text: 'Hey! I\'m using this amazing app to stay positive and grow daily. Join me and we both get 50 points!',
          url: referralLink,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <main className="flex-1 p-8 bg-[#EEF1F0] overflow-y-auto">
      <header className="space-y-3 ml-4 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white -sm text-sm font-medium text-[#5f6368] mb-3">
          <Users className="w-4 h-4 text-[#34A853]" />
          <span>{today}</span>
        </div>
        <h1 className="text-3xl small md:text-4xl  text-[#000000]">
          {getGreeting()}, <span className="font-semibold">{userName}</span>
        </h1>
        <p className="text-base text-[#5f6368] font-normal">
          Loading your referral program...
        </p>
      </header>
      
      <div className="max-w-4xl  space-y-8">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6  border-[#dadce0] animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Referral Link Card Skeleton */}
        <div className="bg-white rounded-3xl p-8  border-[#dadce0] animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="w-full h-12 bg-gray-200 rounded-2xl"></div>
            </div>
            <div className="w-32 h-12 bg-gray-200 rounded-2xl"></div>
          </div>
          <div className="bg-[#e8f0fe] rounded-3xl p-4">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>

        {/* Referral History Skeleton */}
        <div className="bg-white rounded-3xl p-8  border-[#dadce0] animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-zinc-200 rounded-3xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

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
          Invite friends and earn 50 points for each referral!
        </p>
      </header>

      <div className="max-w-4xl space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Referrals Card */}
          <div className="bg-white rounded-3xl p-6  border-[#dadce0] hover:-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#f39c12]/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-[#f39c12]" />
            </div>
            <p className="text-sm text-[#5f6368] mb-1">Total Referrals</p>
            <p className="text-3xl font-bold text-[#000000]">{totalReferrals}</p>
            <p className="text-xs text-[#5f6368] mt-2">Friends joined</p>
          </div>

          {/* Points Earned Card */}
          <div className="bg-white rounded-3xl p-6  border-[#dadce0] hover:-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#34a853]/20 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-[#34a853]" />
            </div>
            <p className="text-sm text-[#5f6368] mb-1">Points Earned</p>
            <p className="text-3xl font-bold text-[#000000]">{referralPoints}</p>
            <p className="text-xs text-[#5f6368] mt-2">50 points per referral</p>
          </div>

          {/* Referral Code Card */}
          <div className="bg-white rounded-3xl p-6  border-[#dadce0] hover:-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-[#4285f4]/20 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-[#4285f4]" />
            </div>
            <p className="text-sm text-[#5f6368] mb-1">Your Code</p>
            <p className="text-3xl font-bold text-[#000000]">{referralCode}</p>
            <p className="text-xs text-[#5f6368] mt-2">Share this code</p>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-3xl p-8  border-[#dadce0] hover:-lg transition-all duration-300">
          <h2 className="text-2xl font-semibold text-[#000000] mb-6">Your Referral Link</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-4 py-3 pr-12 rounded-2xl  border-[#dadce0] bg-gray-100 text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              />
              <button
                onClick={handleCopyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-xl transition-all"
                title="Copy link"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-[#34a853]" />
                ) : (
                  <Copy className="w-5 h-5 text-[#5f6368]" />
                )}
              </button>
            </div>
            
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-green-600 text-white rounded-3xl font-medium hover:bg-[#1557b0] transition-all duration-200 flex items-center justify-center gap-2 -lg hover:-xl"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>

          <div className="bg-green-100 rounded-3xl p-4">
            <p className="text-sm text-[#5f6368] mb-2">✨ How it works:</p>
            <ul className="space-y-2 text-sm text-[#202124]">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                Share your unique link or code with friends
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                They sign up using your referral
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">3.</span>
                You both get <span className="font-semibold text-green-600">50 points</span> instantly!
              </li>
            </ul>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-3xl p-8  border-[#dadce0]">
          <h2 className="text-2xl font-semibold text-[#000000] mb-6">Referral History</h2>
          
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-10 h-10 text-[#5f6368]" />
              </div>
              <p className="text-[#5f6368] mb-2">No referrals yet</p>
              <p className="text-sm text-[#5f6368]">
                Share your link and start earning points!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => {
                const isExpanded = expandedId === referral.id;
                
                return (
                  <div
                    key={referral.id}
                    onClick={() => toggleExpand(referral.id)}
                    className={`
                      border border-zinc-200 rounded-3xl p-4 cursor-pointer
                      transition-all duration-300 hover:-md
                      ${isExpanded ? 'border-none bg-green-50' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#202124]">
                            {referral.name || 'New User'}
                          </p>
                          <p className="text-xs text-[#5f6368]">
                            Joined {formatDate(referral.joinedDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">+50 pts</p>
                          <p className="text-xs text-[#5f6368]">{referral.status}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#5f6368]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#5f6368]" />
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#dadce0]">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[#5f6368] mb-1">Email</p>
                            <p className="text-[#202124]">{referral.email}</p>
                          </div>
                          <div>
                            <p className="text-[#5f6368] mb-1">Points Earned</p>
                            <p className="text-[#202124] font-medium text-[#34a853]">50</p>
                          </div>
                          {referral.completedOnboarding && (
                            <div className="col-span-2">
                              <p className="text-[#5f6368] mb-1">Onboarding</p>
                              <p className="text-[#202124] flex items-center gap-1">
                                <Check className="w-4 h-4 text-[#34a853]" />
                                Completed
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}