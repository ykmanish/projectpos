'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Eye, EyeOff, Users, Gift, CheckCircle, Award, Copy } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

export default function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCodeFromUrl = searchParams.get('ref');

  const { login } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: referralCodeFromUrl || '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(!!referralCodeFromUrl);
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (referralCodeFromUrl) setShowReferralInput(true);
  }, [referralCodeFromUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Password and confirmation are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    console.log('Attempting signup with:', formData.email);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: formData.referralCode || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Signup response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Signup response data:', data);
      } catch (e) {
        console.error('Failed to parse response:', e);
        setError('Server returned an invalid response');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || `Signup failed (${response.status})`);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('No user data received');
        setLoading(false);
        return;
      }

      // Store user data in localStorage
      localStorage.setItem('userName', data.user.name || formData.name);
      localStorage.setItem('userEmail', data.user.email);
      if (data.user.id) localStorage.setItem('userId', data.user.id);

      if (data.message) setSuccessMessage(data.message);

      login(data.user);

      console.log('Signup successful, redirecting to welcome...');

      // ✅ FIXED: Reset loading before navigation
      setLoading(false);

      // ✅ FIXED: Hard navigation so the browser sends the fresh auth cookie
      // to the middleware (router.push does soft nav and middleware misses the cookie)
      window.location.href = '/welcome';

    } catch (err) {
      console.error('Signup error details:', err);

      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection.');
      } else if (err.message === 'Failed to fetch') {
        setError('Network error. Please check if the server is running.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }

      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (referralCodeFromUrl) {
      navigator.clipboard.writeText(referralCodeFromUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const bgimage = {
    backgroundImage: 'url("https://dz.quantafile.com/bglo.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const Loader = () => (
    <div className="flex justify-center items-center space-x-1">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  // Two-column layout when referral code is in URL
  if (referralCodeFromUrl) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center text-[#202124] p-6" style={bgimage}>
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-50 w-full max-w-6xl animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Card - Referral Info */}
            <div className="bg-white rounded-3xl lg:rounded-[35px] p-5 lg:p-8 border border-[#dadce0] shadow-sm h-fit md:sticky md:top-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f39c12] to-[#f1c40f] flex items-center justify-center">
                  <Gift className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center text-[#000000] mb-2">
                You've Been Invited! 🎉
              </h2>
              <p className="text-center text-[#5f6368] mb-6">
                Join with this special referral and get bonus points!
              </p>

              <div className="bg-gradient-to-r from-[#f39c12]/10 to-[#f1c40f]/10 rounded-3xl p-6 mb-6 border border-[#f39c12]/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[#5f6368]">Your Referral Code</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-sm text-[#1a73e8] hover:text-[#1557b0]"
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-4xl font-mono font-bold text-[#f39c12] tracking-wider">
                    {referralCodeFromUrl}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-3xl">
                  <div className="w-12 h-12 rounded-full bg-[#34a853]/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#34a853]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#5f6368]">Your Bonus</p>
                    <p className="text-xl font-bold text-[#34a853]">+50 Points</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] rounded-3xl">
                  <div className="w-12 h-12 rounded-full bg-[#1a73e8]/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#1a73e8]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#5f6368]">Friend's Bonus</p>
                    <p className="text-xl font-bold text-[#1a73e8]">+50 Points</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card - Signup Form */}
            <div className="bg-white rounded-[35px] p-8 border border-[#dadce0] shadow-sm">
              <div className="flex justify-center mb-6">
                  <div className="flex justify-center mb-6">
           <img src="https://dz.quantafile.com/chatlogo.png" alt="Goodish Logo" className="w-12 h-12" />
          </div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-3xl font-semibold text-[#000000] mb-2">
                  {step === 1 ? 'Create Account' : 'Set Your Password'}
                </h1>
                <p className="text-base text-[#5f6368]">
                  {step === 1
                    ? 'Complete your registration to claim your bonus'
                    : 'Choose a strong password for your account'}
                </p>
              </div>

              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl animate-fade-in">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`h-2 w-12 rounded-full ${step === 1 ? 'bg-[#1a73e8]' : 'bg-[#e8f0fe]'}`}></div>
                <div className={`h-2 w-12 rounded-full ${step === 2 ? 'bg-[#1a73e8]' : 'bg-[#e8f0fe]'}`}></div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5f6368] mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5f6368] mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1765cc] font-medium text-base transition-all mt-6"
                  >
                    Continue
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5f6368] mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5f6368] mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-6 py-3 border border-[#dadce0] rounded-xl hover:bg-gray-50 text-[#202124] font-medium text-base transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1765cc] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-base transition-all flex items-center justify-center"
                    >
                      {loading ? <Loader /> : 'Claim Bonus & Sign Up'}
                    </button>
                  </div>
                </form>
              )}

              {step === 1 && (
                <p className="text-sm text-[#5f6368] text-center mt-6">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-[#1a73e8] hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
        `}</style>
      </div>
    );
  }

  // Single-column layout (no referral)
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-[#202124] p-3 lg:p-6" style={bgimage}>
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-50 w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-3xl lg:rounded-[35px] p-5 lg:p-8 border border-[#dadce0] shadow-sm">
          <div className="flex justify-center mb-6">
             <div className="flex justify-center mb-6">
           <img src="https://dz.quantafile.com/chatlogo.png" alt="Goodish Logo" className="w-12 h-12" />
          </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl small font-semibold text-[#000000] mb-2">
              {step === 1 ? 'Create Account' : 'Set Your Password'}
            </h1>
            <p className="text-base text-[#5f6368]">
              {step === 1
                ? 'Start your journey to daily positivity'
                : 'Choose a strong password for your account'}
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {step === 2 && formData.referralCode && !successMessage && (
            <div className="mb-6 p-4 bg-[#e8f0fe] rounded-2xl border border-[#1a73e8]/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#34a853] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#000000]">✨ Referral Bonus Active!</p>
                  <p className="text-xs text-[#5f6368]">
                    You'll receive <span className="font-bold text-[#34a853]">50 points</span> right after signing up
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`h-2 w-12 rounded-full ${step === 1 ? 'bg-[#1a73e8]' : 'bg-[#e8f0fe]'}`}></div>
            <div className={`h-2 w-12 rounded-full ${step === 2 ? 'bg-[#1a73e8]' : 'bg-[#e8f0fe]'}`}></div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5f6368] mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5f6368] mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowReferralInput(!showReferralInput)}
                  className="text-sm text-[#1a73e8] hover:text-[#1557b0] transition-colors flex items-center gap-1"
                >
                  <Users size={16} />
                  {showReferralInput ? 'Hide referral code' : 'Have a referral code?'}
                </button>

                {showReferralInput && (
                  <div className="mt-3 animate-slide-down">
                    <label className="block text-sm font-medium text-[#5f6368] mb-2">Referral Code</label>
                    <input
                      type="text"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleChange}
                      placeholder="Enter referral code"
                      className="w-full px-4 py-3 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all"
                    />
                    <p className="text-xs text-[#5f6368] mt-1 flex items-center gap-1">
                      <Gift size={12} className="text-[#34a853]" />
                      You and your friend will both get <span className="font-bold text-[#34a853]">50 points</span>!
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1765cc] font-medium text-base transition-all mt-6"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5f6368] mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5f6368] mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {formData.referralCode && (
                <div className="p-4 bg-gradient-to-r from-[#34a853]/10 to-[#1a73e8]/10 rounded-xl border border-[#34a853]/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#34a853]" />
                    <p className="text-sm text-[#202124]">
                      Referral code: <span className="font-mono font-medium text-[#1a73e8]">{formData.referralCode}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Gift className="w-3 h-3 text-[#34a853]" />
                    <p className="text-[#34a853] font-medium">
                      You'll receive 50 bonus points immediately after signup!
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-[#dadce0] rounded-xl hover:bg-gray-50 text-[#202124] font-medium text-base transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1765cc] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-base transition-all flex items-center justify-center"
                >
                  {loading ? <Loader /> : 'Sign Up'}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <p className="text-sm text-[#5f6368] text-center mt-6">
              Already have an account?{' '}
              <Link href="/signin" className="text-[#1a73e8] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          )}
        </div>

       
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  );
}
