'use client';

import { useState, useEffect } from 'react';
import { Calendar, Sparkles, Trophy, Heart, CheckCircle2, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import AttachmentUploader from '@/components/AttachmentUploader';

export default function HomePage() {
  const { content, isLoading, completedToday, submitReflection, userName, fetchUserData, userId, username, avatar } = useUser();

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Refresh user data to ensure completedToday is accurate
    if (userName) {
      fetchUserData().then(() => {
        setLocalLoading(false);
      });
    }
  }, [userName]);

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

 // In app/page.js - Replace the handleSubmitReflection function

const handleSubmitReflection = async () => {
  if (!reflectionText.trim() && attachments.length === 0) {
    alert('Please add a reflection or attachment');
    return;
  }

  setSubmitting(true);
  setUploadProgress(25);

  try {
    // First submit the reflection with attachments
    const success = await submitReflection(reflectionText, attachments);
    
    setUploadProgress(75);

    if (success) {
      setUploadProgress(100);
      
      // Close modal after short delay to show success
      setTimeout(() => {
        setShowCompletionModal(false);
        setReflectionText('');
        setAttachments([]);
        setSubmitting(false);
        setUploadProgress(0);
      }, 500);
    } else {
      throw new Error('Failed to submit reflection');
    }
  } catch (error) {
    console.error('Error submitting reflection:', error);
    alert('Failed to submit reflection. Please try again.');
    setSubmitting(false);
    setUploadProgress(0);
  }
};

  if (isLoading || localLoading || !content) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="flex-1 p-6 md:p-8 bg-[#EEF1F0] overflow-y-auto min-h-screen">
      <header className="space-y-2 mb-8 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white -sm text-sm font-medium text-[#5f6368] mb-3">
          <Calendar className="w-4 h-4 text-[#34A853]" />
          <span>{today}</span>
        </div>
        <h1 className="text-3xl small md:text-4xl text-[#000000]">
          {getGreeting()}, <span className="font-semibold">{userName}</span>
        </h1>
        <p className="text-base text-[#5f6368] font-normal">
          Complete today's kindness challenge and earn rewards
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        {/* Quote Card */}
        <article className="group relative bg-white rounded-[35px] -sm p-8 md:p-10 transition-all duration-300 hover:-md flex flex-col justify-between min-h-[360px]">
          <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
            <Sparkles className="w-24 h-24 text-[#FBBC04]" />
          </div>
          
          <div className="relative z-10 flex-grow flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#FBBC04]"></div>
              <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">
                Daily Inspiration
              </span>
            </div>
            
            <blockquote className="mb-6">
              <p className="text-2xl small md:text-3xl font-semibold text-[#000000] leading-snug">
                {content?.quote}
              </p>
            </blockquote>
            
            <div className="flex items-center gap-3 pt-4 border-t border-[#f1f3f4]">
              <cite className="not-italic font-medium text-[#202124] text-base">
                {content?.author}
              </cite>
            </div>
          </div>
        </article>

        {/* Good Deed Card */}
        <article className="relative bg-white rounded-[35px] -sm p-8 md:p-10 transition-all duration-300 hover:-md flex flex-col min-h-[360px]">
          <div className="flex-grow flex flex-col justify-center items-center text-center">
            {/* Icon with Trophy */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#34A853] to-[#0F9D58] flex items-center justify-center -lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#FBBC04] flex items-center justify-center -md">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#34A853]"></div>
              <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">
                Today's Challenge
              </span>
            </div>

            <h2 className="text-2xl small md:text-3xl font-semibold text-[#000000] mb-4">
              Connect with Kindness
            </h2>
            
            <p className="text-[#5f6368]  text-base leading-relaxed max-w-md mx-auto">
              {content?.goodDeed}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-8 pt-6 border-t border-[#f1f3f4] flex justify-center">
            {completedToday ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#E8F5E9] text-[#1E8E3E] rounded-full font-medium text-base cursor-not-allowed transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Done for Today</span>
              </button>
            ) : (
              <button
                onClick={handleMarkComplete}
                className="w-full group flex items-center justify-center gap-3 px-8 py-4 bg-[#34A853] hover:bg-[#2D9249] text-white rounded-full font-medium text-base -md hover:-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Mark as Complete</span>
              </button>
            )}
          </div>
        </article>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[30px] p-8 max-w-2xl w-full -2xl animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#34A853] to-[#0F9D58] flex items-center justify-center mx-auto mb-4 -lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#202124] mb-2">
                Amazing Work! 🎉
              </h2>
              <p className="text-base text-[#5f6368]">
                Share your experience with the community
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Reflection textarea */}
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="How did today's good deed make you feel? Share your experience..."
                rows="4"
                className="w-full px-5 py-4 border border-[#dadce0] rounded-3xl focus:ring-2 focus:ring-[#34A853] focus:border-[#34A853] focus:outline-none text-[#202124] text-base transition-all resize-none"
                disabled={submitting}
              />

              {/* Attachment uploader */}
              <AttachmentUploader 
                userId={userId}
                onAttachmentsChange={setAttachments}
              />

              {/* Upload progress bar */}
              {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-[#5f6368]">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#f1f3f4] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#34A853] transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setReflectionText('');
                    setAttachments([]);
                  }}
                  disabled={submitting}
                  className="flex-1 px-6 py-4 border border-[#dadce0] rounded-2xl hover:bg-[#F8F9FA] text-[#202124] font-medium text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReflection}
                  disabled={(!reflectionText.trim() && attachments.length === 0) || submitting}
                  className="flex-1 px-6 py-4 bg-[#34A853] hover:bg-[#2D9249] disabled:bg-[#E8F5E9] disabled:text-[#1E8E3E] text-white rounded-2xl font-medium text-base transition-all -md hover:-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <span>Share & Earn 1 Point</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Tip */}
              <p className="text-xs text-center text-[#5f6368]">
                ✨ Add photos, videos, or links to inspire others in the community!
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </main>
  );
}