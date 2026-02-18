// components/ChatDropdown.js

'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export default function ChatDropdown({ items, children, position = 'bottom-right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const positionClasses = {
    'bottom-right': 'right-0 mt-2',
    'bottom-left': 'left-0 mt-2',
    'top-right': 'right-0 bottom-full mb-2',
    'top-left': 'left-0 bottom-full mb-2',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {children || (
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#101010] rounded-full transition-colors">
            <MoreVertical size={20} className="text-[#5f6368] dark:text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={`absolute ${positionClasses[position]} w-56 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#232529] rounded-2xl shadow-lg z-50 py-2`}>
          {items.map((item, index) => (
            <button
              key={item.id || index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#101010] transition-colors ${item.className || 'text-[#202124] dark:text-white'}`}
            >
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}