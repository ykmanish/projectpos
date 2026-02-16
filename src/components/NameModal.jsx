'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function NameModal({ onNameSet }) {
  const [tempName, setTempName] = useState('');

  const handleSave = () => {
    if (tempName.trim()) {
      localStorage.setItem('userName', tempName.trim());
      onNameSet(tempName.trim());
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center text-[#202124] p-6">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1a73e8]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a73e8]/3 rounded-full blur-[100px]"></div>
      </div>
      <div className="relative z-50 w-full max-w-lg animate-fade-in">
        <div className="bg-white rounded-3xl p-8 border-[#dadce0]">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-[#000000] mb-2">
              Welcome to Daily Positivity
            </h2>
            <p className="text-base text-[#5f6368]">
              Let‘s personalize your experience with some daily inspiration
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-4 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] text-base transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!tempName.trim()}
              className="w-full px-6 py-3 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1765cc] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-base transition-all"
            >
              Get Started
            </button>
          </div>
          <p className="text-xs text-[#5f6368] text-center mt-6">
            Your daily inspiration is just a moment away 🌟
          </p>
        </div>
      </div>
    </div>
  );
}