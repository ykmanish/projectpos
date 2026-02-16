'use client';

import { useState } from 'react';

export default function CompletionModal({ onClose, onSubmit }) {
  const [reflection, setReflection] = useState('');

  const handleSubmit = () => {
    onSubmit(reflection);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-[#dadce0]">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-[#000000] mb-2">How was your day?</h2>
          <p className="text-base text-[#5f6368]">Share a quick reflection on today's good deed</p>
        </div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="I felt great helping someone..."
          rows="4"
          className="w-full px-4 py-3 border border-[#dadce0] rounded-2xl focus:ring-2 focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:outline-none text-[#202124] text-base transition-all mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#dadce0] rounded-xl hover:bg-gray-50 text-[#202124] font-medium text-base transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-[#1a73e8] hover:bg-[#1765cc] text-white rounded-xl font-medium text-base transition-all"
          >
            Submit & Earn 1 Point
          </button>
        </div>
      </div>
    </div>
  );
}