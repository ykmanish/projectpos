// components/MentionSuggestions.js

import React from 'react';
import { AtSign } from 'lucide-react';
import Avatar from './Avatar';

const MentionSuggestions = ({ members, onSelect, query, currentUserId }) => {
  if (!members || members.length === 0) return null;

  const handleSelect = (member) => {
    console.log('🎯 Mention selected:', member);
    onSelect(member);
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0c] rounded-xl shadow-lg border border-gray-200 dark:border-[#232529] overflow-hidden">
      <div className="p-2 bg-gray-50 dark:bg-[#101010] border-b border-gray-200 dark:border-[#232529]">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <AtSign size={12} />
          Mention someone
        </p>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {members.map((member) => (
          <button
            key={member.userId}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(member);
            }}
            onMouseDown={(e) => {
              // Prevent blur event from firing before click
              e.preventDefault();
            }}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-[#101010] transition-colors text-left border-b border-gray-100 dark:border-[#232529] last:border-0 focus:outline-none focus:bg-gray-50 dark:focus:bg-[#101010]"
          >
            <div className="flex-shrink-0">
              <Avatar userAvatar={member.avatar} name={member.userName} size="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {member.userName}
                {member.userId === currentUserId && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(you)</span>
                )}
              </p>
              {member.username && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{member.username}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                @
              </span>
            </div>
          </button>
        ))}
      </div>
      {members.length === 0 && query && (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No members found matching "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default MentionSuggestions;