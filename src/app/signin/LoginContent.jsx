'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

export default function LoginContent() {
  const router = useRouter();
  const { login } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    console.log('Attempting signin with:', formData.email);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Signin response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Signin response data:', data);
      } catch (e) {
        console.error('Failed to parse response:', e);
        setError('Server returned an invalid response');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || `Sign in failed (${response.status})`);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('No user data received');
        setLoading(false);
        return;
      }

      // Store user data
      localStorage.setItem('userName', data.user.name || data.user.email);
      localStorage.setItem('userEmail', data.user.email);
      if (data.user.id) localStorage.setItem('userId', data.user.id);
      if (data.user.onboardingCompleted) {
        localStorage.setItem('onboardingCompleted', 'true');
      }

      login(data.user);

      console.log('Login successful, onboardingCompleted:', data.user.onboardingCompleted);

      setLoading(false);

      // ✅ FIXED: Hard navigation — ensures middleware reads the fresh
      // httpOnly cookie correctly on production (AWS/HTTPS)
      if (!data.user.onboardingCompleted) {
        window.location.href = '/welcome';
      } else {
        window.location.href = '/';
      }

    } catch (err) {
      console.error('Signin error details:', err);

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

  const bgimage = {
    backgroundImage: 'url("/tbgss.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center text-[#202124] p-6"
      style={bgimage}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-50 w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-[35px] p-8 border border-[#dadce0] shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-[#000000] mb-2">
              Welcome Back
            </h1>
            <p className="text-base text-[#5f6368]">
              Continue your positivity journey
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5f6368] mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5f6368] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] transition-all pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1765cc] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-base transition-all mt-6"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-[#5f6368] text-center mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#1a73e8] hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
