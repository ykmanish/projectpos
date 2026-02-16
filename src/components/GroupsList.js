'use client';

import { useState, useEffect } from 'react';
import { Users, Hash, ChevronRight, Lock, UserPlus } from 'lucide-react';
import Avatar from './Avatar';

export default function GroupsList({ userId, onSelectGroup, selectedGroupId }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/chat/groups?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMs = now - activity;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return activity.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMemberCount = (members) => {
    return members?.length || 0;
  };

  const getGroupInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#34A853] mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {groups.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-green-600" />
          </div>
          <p className="text-sm text-[#5f6368]">No groups yet</p>
          <p className="text-xs text-[#5f6368] mt-1">Create a group to chat with multiple friends!</p>
        </div>
      ) : (
        groups.map(group => (
          <button
            key={group.groupId}
            onClick={() => onSelectGroup({ ...group, type: 'group' })}
            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-all ${
              selectedGroupId === group.groupId ? 'bg-green-50' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34A853] to-[#2D9249] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
              {getGroupInitials(group.name)}
            </div>
            
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-[#202124] text-sm truncate">
                  {group.name}
                </p>
                <span className="text-xs text-[#5f6368] ml-2 flex-shrink-0">
                  {formatLastActivity(group.lastActivity)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Users size={12} className="text-[#5f6368]" />
                  <span className="text-xs text-[#5f6368]">
                    {getMemberCount(group.members)}
                  </span>
                </div>
                
                {group.settings?.onlyAdminsCanMessage && (
                  <div className="flex items-center gap-1">
                    <Lock size={12} className="text-[#5f6368]" />
                    <span className="text-xs text-[#5f6368]">Admin only</span>
                  </div>
                )}
              </div>
            </div>
            
            <ChevronRight size={18} className="text-[#5f6368] flex-shrink-0" />
          </button>
        ))
      )}
    </div>
  );
}