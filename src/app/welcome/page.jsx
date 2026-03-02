'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  const [onboardingData, setOnboardingData] = useState({
    preferredName: '',
    primaryGoal: '',
    interests: [],
    reminderTime: '09:00',
    currentMood: '',
  });

  useEffect(() => {
    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');
    if (!id || !name) {
      router.push('/signup');
      return;
    }
    setUserId(id);
    setOnboardingData((prev) => ({ ...prev, preferredName: name }));

    // ✅ FIXED: Use local variable, not stale onboardingData.reminderTime
    const [h, m] = '09:00'.split(':');
    const hNum = parseInt(h, 10);
    const periodInit = hNum >= 12 ? 'PM' : 'AM';
    const hour12 = hNum % 12 || 12;
    setHour(hour12.toString().padStart(2, '0'));
    setMinute(m);
    setPeriod(periodInit);
  }, [router]);

  // Sync 12h inputs → 24h reminderTime
  useEffect(() => {
    let h = parseInt(hour, 10);
    if (isNaN(h)) h = 12;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const hour24 = h.toString().padStart(2, '0');
    setOnboardingData((prev) => ({
      ...prev,
      reminderTime: `${hour24}:${minute}`,
    }));
  }, [hour, minute, period]);

  const goals = [
    { id: 'motivation', label: 'Daily Motivation', emoji: '🚀', desc: 'Get inspired every day' },
    { id: 'kindness', label: 'Spread Kindness', emoji: '❤️', desc: 'Make the world better' },
    { id: 'self-growth', label: 'Personal Growth', emoji: '🌱', desc: 'Become your best self' },
    { id: 'productivity', label: 'Stay Productive', emoji: '⚡', desc: 'Achieve your goals' },
    { id: 'mindfulness', label: 'Be Mindful', emoji: '🧘', desc: 'Find inner peace' },
    { id: 'happiness', label: 'Seek Happiness', emoji: '😊', desc: 'Choose joy daily' },
  ];

  const interestOptions = [
    { id: 'kindness', label: 'Acts of Kindness', emoji: '💝' },
    { id: 'productivity', label: 'Productivity', emoji: '📈' },
    { id: 'health', label: 'Health & Wellness', emoji: '💪' },
    { id: 'creativity', label: 'Creativity', emoji: '🎨' },
    { id: 'relationships', label: 'Relationships', emoji: '👥' },
    { id: 'self-care', label: 'Self-Care', emoji: '🌸' },
  ];

  const moods = [
    { id: 'amazing', label: 'Amazing', emoji: '🤩' },
    { id: 'good', label: 'Good', emoji: '😊' },
    { id: 'okay', label: 'Okay', emoji: '😐' },
    { id: 'sad', label: 'Sad', emoji: '😔' },
    { id: 'stressed', label: 'Stressed', emoji: '😰' },
  ];

  const handleInterestToggle = (interestId) => {
    setOnboardingData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#1a73e8', '#4285f4', '#34a853', '#fbbc04', '#ea4335'];

    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const handleComplete = async () => {
    // ✅ FIXED: Always read fresh from localStorage, not stale state
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      alert('Session expired. Please sign in again.');
      router.push('/signin');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: storedUserId, ...onboardingData }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ FIXED: Persist updated name and onboarding flag to localStorage
        localStorage.setItem('userName', onboardingData.preferredName);
        localStorage.setItem('onboardingCompleted', 'true');

        triggerConfetti();

        // ✅ FIXED: Hard navigation so middleware + UserContext re-initialize
        // with fresh onboardingCompleted: true from the server
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        alert(data.error || 'Failed to complete onboarding');
        setLoading(false);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'What brings you here?',
      subtitle: 'Select your primary goal',
      component: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setOnboardingData({ ...onboardingData, primaryGoal: goal.id })}
              className={`p-6 rounded-3xl transition-all text-left ${
                onboardingData.primaryGoal === goal.id
                  ? 'border-[#1a73e8] border-none bg-[#e8f0fe]'
                  : 'border-zinc-100 border hover:border-[#1a73e8]/50'
              }`}
            >
              <div className="text-4xl mb-2">{goal.emoji}</div>
              <div className="font-semibold text-[#000000] mb-1">{goal.label}</div>
              <div className="text-sm text-[#5f6368]">{goal.desc}</div>
            </button>
          ))}
        </div>
      ),
      canProceed: onboardingData.primaryGoal !== '',
    },
    {
      title: 'What interests you?',
      subtitle: 'Select all that apply (at least one)',
      component: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {interestOptions.map((interest) => (
            <button
              key={interest.id}
              onClick={() => handleInterestToggle(interest.id)}
              className={`p-6 rounded-3xl transition-all ${
                onboardingData.interests.includes(interest.id)
                  ? 'border-[#1a73e8] border-none bg-[#e8f0fe]'
                  : 'border-zinc-100 border hover:border-[#1a73e8]/50'
              }`}
            >
              <div className="text-3xl mb-2">{interest.emoji}</div>
              <div className="font-medium text-[#000000] text-sm">{interest.label}</div>
            </button>
          ))}
        </div>
      ),
      canProceed: onboardingData.interests.length > 0,
    },
    {
      title: 'When should we remind you?',
      subtitle: 'Choose your preferred daily reminder time',
      component: (
        <div className="space-y-4">
          <div className="bg-[#e8f0fe] p-8 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-4xl font-semibold text-[#1a73e8]">
              <input
                type="number"
                min="1"
                max="12"
                value={hour}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val === '') val = '12';
                  let num = parseInt(val, 10);
                  if (isNaN(num) || num < 1) num = 12;
                  if (num > 12) num = 12;
                  setHour(num.toString().padStart(2, '0'));
                }}
                className="w-20 bg-transparent text-center outline-none appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={minute}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val === '') val = '00';
                  let num = parseInt(val, 10);
                  if (isNaN(num) || num < 0) num = 0;
                  if (num > 59) num = 59;
                  setMinute(num.toString().padStart(2, '0'));
                }}
                className="w-20 bg-transparent text-center outline-none appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setPeriod('AM')}
                className={`px-6 py-2 rounded-full text-lg font-medium transition-all ${
                  period === 'AM' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] hover:bg-gray-100'
                }`}
              >
                AM
              </button>
              <button
                onClick={() => setPeriod('PM')}
                className={`px-6 py-2 rounded-full text-lg font-medium transition-all ${
                  period === 'PM' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] hover:bg-gray-100'
                }`}
              >
                PM
              </button>
            </div>
          </div>
          <p className="text-sm text-[#5f6368] text-center">
            We'll send you a gentle reminder to complete your daily deed
          </p>
        </div>
      ),
      canProceed: true,
    },
    {
      title: 'How are you feeling today?',
      subtitle: "Let's start with your current mood",
      component: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setOnboardingData({ ...onboardingData, currentMood: mood.id })}
              className={`p-6 rounded-3xl transition-all ${
                onboardingData.currentMood === mood.id
                  ? 'border-[#1a73e8] border-none bg-[#e8f0fe]'
                  : 'border-zinc-100 border hover:border-[#1a73e8]/50'
              }`}
            >
              <div className="text-4xl mb-2">{mood.emoji}</div>
              <div className="font-medium text-[#000000]">{mood.label}</div>
            </button>
          ))}
        </div>
      ),
      canProceed: onboardingData.currentMood !== '',
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center text-[#202124] p-6">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-50 w-full max-w-5xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[#5f6368]">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-[#1a73e8]">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-4 bg-[#dadce0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a73e8] transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-[35px] p-8 md:p-12 border border-[#dadce0]">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#000000] mb-3">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-[#5f6368]">{currentStepData.subtitle}</p>
          </div>

          <div className="mb-8">{currentStepData.component}</div>

          {/* Navigation */}
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-2 px-6 py-4 border border-[#dadce0] rounded-2xl hover:bg-gray-50 text-[#202124] font-medium transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!currentStepData.canProceed}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#1a73e8] text-white rounded-2xl hover:bg-[#1765cc] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!currentStepData.canProceed || loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1a73e8] to-[#4285f4] text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                {loading ? (
                  'Setting up your journey...'
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
