// components/SlowModeBadge.js
'use client';

import { Clock } from 'lucide-react';

export default function SlowModeBadge({ timeRemaining, className = '' }) {
  if (timeRemaining <= 0) return null;

  return (
    <div className={`flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full animate-pulse ${className}`}>
      <Clock size={12} />
      <span>{timeRemaining}s</span>
    </div>
  );
}