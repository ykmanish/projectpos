// components/ItineraryModal.js
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Check, CheckCircle, Clock, AlertCircle, Send,
  Calendar, MapPin, Users, History, MoreVertical, ChevronDown,
  Edit2, Trash2, Sun, Moon, Sunrise, Sunset, Coffee,
  Utensils, Map, Camera, Ticket, ShoppingBag, Car,
  Plane, Hotel, Briefcase, Flag, ChevronLeft
} from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { CURRENCIES, getCurrencySymbol } from '@/constants/currencies';
import encryptionService from '@/utils/encryptionService';
import { BeanHead } from 'beanheads';

// ─── Card Color Palette ─────────────────────────────────
const CARD_PALETTES = [
  { bg: '#FF8C78', track: '#c96b58', bar: '#1a0a08', text: '#1a0a08', sub: '#7a3028' },
  { bg: '#FFB8C6', track: '#d98898', bar: '#1a0810', text: '#1a0810', sub: '#7a3050' },
  { bg: '#7DCFCC', track: '#4eaaa7', bar: '#082020', text: '#082020', sub: '#1a5a58' },
  { bg: '#F5E09A', track: '#c8b860', bar: '#1a1408', text: '#1a1408', sub: '#6a5020' },
  { bg: '#A8D8FF', track: '#70b0e0', bar: '#081220', text: '#081220', sub: '#204870' },
  { bg: '#B8E8B0', track: '#80c078', bar: '#081408', text: '#081408', sub: '#205820' },
  { bg: '#E0C8F8', track: '#b090d0', bar: '#120820', text: '#120820', sub: '#503878' },
  { bg: '#FFD4A0', track: '#d8a060', bar: '#1a0e04', text: '#1a0e04', sub: '#7a4818' },
];

const ACTIVITY_ICONS = {
  'sunrise': Sunrise, 'morning': Sun, 'afternoon': Sun, 'sunset': Sunset,
  'coffee': Coffee, 'breakfast': Coffee, 'lunch': Utensils, 'dinner': Utensils,
  'sightseeing': Camera, 'tour': Map, 'museum': Camera, 'shopping': ShoppingBag,
  'transport': Car, 'flight': Plane, 'hotel': Hotel, 'business': Briefcase,
  'event': Ticket, 'other': Flag
};

const getCardPalette = (title = '') => {
  const idx = (title.charCodeAt(0) || 0) % CARD_PALETTES.length;
  return CARD_PALETTES[idx];
};

const parseAvatar = (avatarData) => {
  if (!avatarData) return null;
  try {
    if (typeof avatarData === 'object') return avatarData;
    const parsed = JSON.parse(avatarData);
    return parsed;
  } catch (e) {
    console.error('Failed to parse avatar:', e);
    return null;
  }
};

const getBeanConfig = (avatar) => {
  const parsed = parseAvatar(avatar);
  if (!parsed) return null;
  if (typeof parsed === 'object' && parsed.beanConfig) {
    return parsed.beanConfig;
  }
  if (typeof parsed === 'object' && (parsed.mask || parsed.eyes || parsed.mouth)) {
    return parsed;
  }
  return null;
};

// ─── Progress Bar ─────────────────────────────────────
const ProgressBar = ({ percentage = 0, trackColor, barColor }) => {
  const pct = Math.min(Math.max(percentage, 0), 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: trackColor || '#00000025' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor || '#000000' }}
        />
      </div>
    </div>
  );
};

// ─── Stacked Avatars ───────────────────────────────────────
const StackedAvatars = ({ participants = [], members = [], max = 4 }) => {
  const visible = participants.slice(0, max);
  const extra = participants.length - max;
  
  return (
    <div className="flex items-center">
      {visible.map((participant, index) => {
        const member = members.find(m => m.userId === participant.userId);
        const beanConfig = getBeanConfig(member?.avatar);
        
        return (
          <div
            key={participant.userId}
            className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 overflow-hidden bg-gray-300 flex-shrink-0"
            style={{ zIndex: index }}
          >
            {beanConfig ? (
              <div className="w-full h-full bg-[#e8f0fe]">
                <BeanHead {...beanConfig} />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-700 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {participant.userName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-white -ml-2 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── Square Avatar ─────────────────────────────────────────
const SquareAvatar = ({ member, size = 10, selected = true }) => {
  const GRADIENTS = [
    'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600',
    'from-pink-400 to-pink-600',     'from-orange-400 to-orange-600',
    'from-green-400 to-green-600',   'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-500', 'from-teal-400 to-teal-600',
  ];
  const idx = (member?.userName?.charCodeAt(0) || 0) % GRADIENTS.length;
  const beanConfig = getBeanConfig(member?.avatar);
  
  return (
    <div className={`w-${size} h-${size} rounded-2xl overflow-hidden flex-shrink-0 transition-opacity ${!selected ? 'opacity-35' : ''}`}>
      {beanConfig ? (
        <div className="w-full h-full bg-[#e8f0fe]">
          <BeanHead {...beanConfig} />
        </div>
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[idx]} flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">{member?.userName?.charAt(0)}</span>
        </div>
      )}
    </div>
  );
};

// ─── Itinerary Card Dropdown ─────────────────────────
const ItineraryCardDropdown = ({ itinerary, currentUserId, onEdit, onDelete, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isCreator = itinerary.createdBy === currentUserId;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isCreator) return null;

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onEdit(itinerary);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onDelete(itinerary);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 hover:bg-black/10 transition-colors"
        style={{ backgroundColor: `${itinerary.palette?.text}18` }}
      >
        <MoreVertical size={16} style={{ color: itinerary.palette?.text }} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-40 bg-white rounded-2xl -lg border border-gray-200 z-50 overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <Edit2 size={14} className="text-gray-500" />
            Edit Itinerary
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 transition-colors text-sm font-medium text-red-600 border-t border-gray-100"
          >
            <Trash2 size={14} className="text-red-500" />
            Delete Itinerary
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Multi-Select User Dropdown ─────────────────────────
const MultiSelectUserDropdown = ({ members, selectedUsers, onToggleUser, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedCount = () => {
    return selectedUsers.filter(u => u.selected).length;
  };

  const getSelectedNames = () => {
    const selected = selectedUsers.filter(u => u.selected);
    if (selected.length === 0) return 'Select members';
    if (selected.length === 1) return selected[0].userName;
    if (selected.length === 2) return `${selected[0].userName} and ${selected[1].userName}`;
    return `${selected[0].userName} and ${selected.length - 1} others`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-white transition-all"
      >
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {getSelectedNames()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded-full">
            {getSelectedCount()}
          </span>
          <ChevronDown size={16} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl -lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {members.map((member) => {
            const isSelected = selectedUsers.find(u => u.userId === member.userId)?.selected || false;
            const beanConfig = getBeanConfig(member.avatar);
            const isYou = member.userId === currentUserId;

            return (
              <div
                key={member.userId}
                onClick={() => {
                  onToggleUser(member.userId);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all cursor-pointer ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#e8f0fe] flex-shrink-0">
                  {beanConfig ? (
                    <BeanHead {...beanConfig} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{member.userName?.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {member.userName}
                    {isYou && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                  </p>
                </div>
                {isSelected ? (
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Activity Item Component ─────────────────────────
const ActivityItem = ({ activity, index, onUpdate, onRemove, palette, currency }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState(activity);

  const getActivityIcon = (type) => {
    const Icon = ACTIVITY_ICONS[type] || Flag;
    return <Icon size={16} style={{ color: palette.text }} />;
  };

  const handleSave = () => {
    onUpdate(index, editedActivity);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-white/50 rounded-2xl space-y-2">
        <input
          type="text"
          value={editedActivity.title}
          onChange={(e) => setEditedActivity({ ...editedActivity, title: e.target.value })}
          placeholder="Activity title"
          className="w-full px-3 py-2 bg-white rounded-xl text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        <div className="flex gap-2">
          <input
            type="time"
            value={editedActivity.time}
            onChange={(e) => setEditedActivity({ ...editedActivity, time: e.target.value })}
            className="flex-1 px-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none"
          />
          <input
            type="number"
            value={editedActivity.cost || ''}
            onChange={(e) => setEditedActivity({ ...editedActivity, cost: parseFloat(e.target.value) || 0 })}
            placeholder={`${getCurrencySymbol(currency)}0`}
            className="w-24 px-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={editedActivity.type}
            onChange={(e) => setEditedActivity({ ...editedActivity, type: e.target.value })}
            className="flex-1 px-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none"
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="sightseeing">Sightseeing</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 hover:bg-white/30 rounded-2xl transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
          {getActivityIcon(activity.type)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: palette.text }}>
            {activity.title}
          </p>
          <div className="flex items-center gap-2">
            {activity.time && (
              <span className="text-xs opacity-70" style={{ color: palette.sub }}>
                {activity.time}
              </span>
            )}
            {activity.cost > 0 && (
              <span className="text-xs font-bold" style={{ color: palette.text }}>
                {getCurrencySymbol(currency)}{activity.cost.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 hover:bg-white/30 rounded-full transition-colors"
        >
          <Edit2 size={14} style={{ color: palette.text }} />
        </button>
        <button
          onClick={() => onRemove(index)}
          className="p-1.5 hover:bg-white/30 rounded-full transition-colors"
        >
          <X size={14} style={{ color: palette.text }} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Itinerary Modal ────────────────────────────────
export default function ItineraryModal({
  isOpen, onClose, group, currentUserId, onSave, socket, isConnected, roomId
}) {
  const [activeTab, setActiveTab] = useState('history');
  const [historyFilter, setHistoryFilter] = useState('upcoming'); // upcoming, past, all
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participants, setParticipants] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState('');
  const [newActivityTime, setNewActivityTime] = useState('');
  const [newActivityType, setNewActivityType] = useState('other');
  const [newActivityCost, setNewActivityCost] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedItineraryId, setExpandedItineraryId] = useState(null);
  const [editingItinerary, setEditingItinerary] = useState(null);
  const [deleteConfirmItinerary, setDeleteConfirmItinerary] = useState(null);
  const [groupKey, setGroupKey] = useState(null);
  const [encryptionReady, setEncryptionReady] = useState(false);

  // ── Effects ───────────────────────────────────────────
  useEffect(() => {
    if (group?.groupId && currentUserId) initializeEncryption();
  }, [group?.groupId, currentUserId]);

  useEffect(() => {
    if (isOpen) fetchItineraries();
  }, [isOpen, group?.groupId]);

  useEffect(() => {
    if (group?.members) {
      setParticipants(
        group.members.map(m => ({ 
          userId: m.userId, 
          userName: m.userName, 
          selected: true 
        }))
      );
    }
  }, [group?.members]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const onItineraryUpdated = (data) => {
      if (data.itinerary && data.itinerary.groupId === group?.groupId) {
        setItineraries(prev => {
          const idx = prev.findIndex(i => i.id === data.itinerary.id);
          if (idx >= 0) { 
            const n = [...prev]; 
            n[idx] = data.itinerary; 
            return n; 
          }
          return [data.itinerary, ...prev];
        });
        triggerSuccess('Itinerary updated!');
      }
    };

    socket.on('itinerary-updated', onItineraryUpdated);
    return () => socket.off('itinerary-updated', onItineraryUpdated);
  }, [socket, isConnected, group?.groupId]);

  // ── Helpers ───────────────────────────────────────────
  const triggerSuccess = (msg = 'Done!') => {
    setSuccessMsg(msg); 
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const diffDays = Math.floor((new Date() - d) / 86400000);
    if (diffDays === 0) return `Today, ${d.toLocaleDateString()}`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays} days ago`;
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
  };

  const formatDateRange = (start, end) => {
    if (!start) return '';
    const startD = new Date(start);
    const endD = new Date(end || start);
    
    if (startD.toDateString() === endD.toDateString()) {
      return startD.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    return `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'text-blue-600 bg-blue-50';
      case 'ongoing': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressPercentage = (itinerary) => {
    if (itinerary.status === 'completed') return 100;
    if (itinerary.status === 'cancelled') return 0;
    if (itinerary.activities?.length === 0) return 0;
    
    const now = new Date();
    const start = new Date(itinerary.startDate);
    const end = new Date(itinerary.endDate || itinerary.startDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return (elapsed / total) * 100;
  };

  const getFilteredItineraries = () => {
    const now = new Date();
    
    switch (historyFilter) {
      case 'upcoming':
        return itineraries
          .filter(i => new Date(i.startDate) > now && i.status !== 'cancelled')
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      case 'past':
        return itineraries
          .filter(i => new Date(i.startDate) <= now || i.status === 'completed' || i.status === 'cancelled')
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      default:
        return [...itineraries].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    }
  };

  // ── API Calls ─────────────────────────────────────────
  const initializeEncryption = async () => {
    try {
      await encryptionService.initializeKeys(currentUserId);
      const key = await encryptionService.getGroupKey(currentUserId, group.groupId);
      setGroupKey(key); 
      setEncryptionReady(true);
    } catch (e) { 
      console.error('Encryption init error:', e); 
    }
  };

  const fetchItineraries = async () => {
    try {
      const res = await fetch(`/api/chat/itinerary?groupId=${group.groupId}`);
      const data = await res.json();
      if (data.success) setItineraries(data.itineraries);
    } catch (e) { 
      console.error('Error fetching itineraries:', e); 
    }
  };

  const toggleParticipant = (userId) => {
    setParticipants(prev => 
      prev.map(p => p.userId === userId ? { ...p, selected: !p.selected } : p)
    );
  };

  const addActivity = () => {
    if (!newActivity.trim()) return;
    
    setActivities([
      ...activities,
      {
        id: Date.now().toString(),
        title: newActivity,
        time: newActivityTime,
        type: newActivityType,
        cost: parseFloat(newActivityCost) || 0,
        completed: false
      }
    ]);
    
    setNewActivity('');
    setNewActivityTime('');
    setNewActivityType('other');
    setNewActivityCost('');
  };

  const updateActivity = (index, updatedActivity) => {
    setActivities(prev => {
      const newActivities = [...prev];
      newActivities[index] = updatedActivity;
      return newActivities;
    });
  };

  const removeActivity = (index) => {
    setActivities(prev => prev.filter((_, i) => i !== index));
  };

  const toggleActivityComplete = (index) => {
    setActivities(prev => {
      const newActivities = [...prev];
      newActivities[index].completed = !newActivities[index].completed;
      return newActivities;
    });
  };

  const calculateTotalBudget = () => {
    const activitiesTotal = activities.reduce((sum, act) => sum + (act.cost || 0), 0);
    const budgetTotal = parseFloat(budget) || 0;
    return Math.max(activitiesTotal, budgetTotal);
  };

  // ── Itinerary CRUD ────────────────────────────────────
  const handleEditItinerary = (itinerary) => {
    setEditingItinerary(itinerary);
    setTitle(itinerary.title);
    setLocation(itinerary.location || '');
    setStartDate(itinerary.startDate.split('T')[0]);
    setEndDate(itinerary.endDate ? itinerary.endDate.split('T')[0] : '');
    setNotes(itinerary.notes || '');
    setBudget(itinerary.budget?.toString() || '');
    setCurrency(itinerary.currency || 'USD');
    
    setActivities(itinerary.activities || []);
    
    setParticipants(prev => 
      prev.map(p => ({
        ...p,
        selected: itinerary.participants?.some(part => part.userId === p.userId) || false
      }))
    );

    setActiveTab('new');
  };

  const handleDeleteItinerary = (itinerary) => {
    setDeleteConfirmItinerary(itinerary);
  };

  const confirmDeleteItinerary = async () => {
    if (!deleteConfirmItinerary) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/chat/itinerary?itineraryId=${deleteConfirmItinerary.id}&groupId=${group.groupId}&userId=${currentUserId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        setItineraries(prev => prev.filter(i => i.id !== deleteConfirmItinerary.id));
        
        if (socket && isConnected) {
          socket.emit('itinerary-deleted', {
            itineraryId: deleteConfirmItinerary.id,
            roomId: roomId || group.groupId,
            deletedBy: currentUserId,
            timestamp: new Date().toISOString()
          });

          socket.emit('itinerary-message-deleted', {
            itineraryId: deleteConfirmItinerary.id,
            roomId: roomId || group.groupId,
            deletedBy: currentUserId,
            deletedByName: group.members?.find(m => m.userId === currentUserId)?.userName || 'Someone',
            timestamp: new Date().toISOString()
          });
        }

        triggerSuccess('Itinerary deleted successfully');
        setDeleteConfirmItinerary(null);
      } else {
        setError(data.error || 'Failed to delete itinerary');
      }
    } catch (e) {
      console.error('Error deleting itinerary:', e);
      setError('Failed to delete itinerary');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmItinerary(null);
  };

  const handleUpdateStatus = async (itineraryId, status) => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/itinerary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          itineraryId, 
          status, 
          userId: currentUserId 
        })
      });
      const data = await res.json();
      
      if (data.success && data.itinerary) { 
        setItineraries(prev => {
          const index = prev.findIndex(i => i.id === itineraryId);
          if (index >= 0) {
            const newItineraries = [...prev];
            newItineraries[index] = data.itinerary;
            return newItineraries;
          }
          return [data.itinerary, ...prev];
        });

        if (socket && isConnected) {
          socket.emit('itinerary-updated', {
            itinerary: data.itinerary,
            roomId: roomId || group.groupId,
            updatedBy: currentUserId,
            timestamp: new Date().toISOString()
          });

          socket.emit('itinerary-message-updated', {
            itineraryId: itineraryId,
            roomId: roomId || group.groupId,
            itineraryData: data.itinerary,
            updatedBy: currentUserId,
            timestamp: new Date().toISOString()
          });
        }
        
        triggerSuccess('Status updated!'); 
      }
    } catch (e) { 
      console.error('Error updating status:', e); 
      setError('Failed to update status'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError('Please enter an itinerary title');
    if (!startDate) return setError('Please select a start date');
    
    const selectedParticipants = participants.filter(p => p.selected);
    if (selectedParticipants.length === 0) return setError('Please select at least one participant');

    setLoading(true); 
    setError('');
    
    try {
      let res;
      let data;

      const itineraryData = {
        groupId: group.groupId,
        title: title.trim(),
        location: location.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
        activities: activities,
        participants: selectedParticipants.map(p => ({ 
          userId: p.userId, 
          userName: p.userName 
        })),
        notes: notes.trim(),
        budget: parseFloat(budget) || null,
        currency,
        createdBy: currentUserId
      };

      if (editingItinerary) {
        // Update existing itinerary
        res = await fetch('/api/chat/itinerary', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itineraryId: editingItinerary.id,
            ...itineraryData,
            updatedBy: currentUserId
          })
        });
        data = await res.json();
        
        if (data.success) {
          setItineraries(prev => prev.map(i => i.id === editingItinerary.id ? data.itinerary : i));
          
          if (socket && isConnected) {
            socket.emit('itinerary-message-deleted', {
              itineraryId: editingItinerary.id,
              roomId: roomId || group.groupId,
              deletedBy: currentUserId,
              deletedByName: group.members?.find(m => m.userId === currentUserId)?.userName || 'Someone',
              timestamp: new Date().toISOString()
            });

            socket.emit('itinerary-created', {
              itinerary: data.itinerary,
              roomId: roomId || group.groupId,
              createdBy: currentUserId,
              timestamp: new Date().toISOString()
            });
          }
          
          triggerSuccess('Itinerary updated successfully!');
        }
      } else {
        // Create new itinerary
        res = await fetch('/api/chat/itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itineraryData)
        });
        data = await res.json();
        
        if (data.success) {
          await onSave(data.itinerary);
          
          if (socket && isConnected) {
            socket.emit('itinerary-created', {
              itinerary: data.itinerary,
              roomId: roomId || group.groupId,
              createdBy: currentUserId,
              timestamp: new Date().toISOString()
            });
          }
          
          triggerSuccess('Itinerary created successfully!');
        }
      }

      if (data.success) {
        // Reset form
        setTitle('');
        setLocation('');
        setStartDate('');
        setEndDate('');
        setNotes('');
        setBudget('');
        setCurrency('USD');
        setActivities([]);
        setEditingItinerary(null);
        setError('');
        await fetchItineraries();
        setActiveTab('history');
      } else {
        setError(data.error || (editingItinerary ? 'Failed to update itinerary' : 'Failed to create itinerary'));
      }
    } catch (e) {
      console.error(e);
      setError(editingItinerary ? 'Failed to update itinerary' : 'Failed to create itinerary');
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = () => {
    setEditingItinerary(null);
    setTitle('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setBudget('');
    setCurrency('USD');
    setActivities([]);
    setError('');
    setActiveTab('history');
  };

  if (!isOpen) return null;

  // ── Toast ─────────────────────────────────────────────
  const Toast = () => (
    <div className="px-5 flex-shrink-0 space-y-2 mb-2">
      {showSuccess && (
        <div className="px-4 py-3 bg-black rounded-2xl text-white text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle size={15} strokeWidth={2.5} />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={15} strokeWidth={2.5} />
          <span className="font-semibold">{error}</span>
        </div>
      )}
    </div>
  );

  // ── Delete Confirmation Modal ─────────────────────────
  const DeleteConfirmationModal = () => {
    if (!deleteConfirmItinerary) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={28} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
            Delete Itinerary?
          </h3>
          <p className="text-center text-gray-500 text-sm mb-6">
            Are you sure you want to delete "{deleteConfirmItinerary.title}"? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={cancelDelete}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteItinerary}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden -2xl">

          {/* ══════════════════ HISTORY TAB ══════════════════ */}
          {activeTab === 'history' && (
            <div className="flex flex-col h-full min-h-0">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('new')}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={17} className="text-gray-700" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">Itineraries</h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-700" />
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
                {[
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'past',     label: 'Past'     },
                  { key: 'all',      label: 'All'      },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setHistoryFilter(t.key)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      historyFilter === t.key
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Toast />

              {/* Itineraries List */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3 min-h-0">
                {getFilteredItineraries().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                      <Calendar size={36} className="text-gray-300" />
                    </div>
                    <div className="text-center">
                      <p className=" text-gray-400">No itineraries found</p>
                      <p className="text-sm text-gray-300 mt-1">Create your first itinerary to get started</p>
                    </div>
                  </div>
                ) : (
                  getFilteredItineraries().map(itinerary => {
                    const pct = getProgressPercentage(itinerary);
                    const sym = getCurrencySymbol(itinerary.currency || 'USD');
                    const isExpanded = expandedItineraryId === itinerary.id;
                    const palette = getCardPalette(itinerary.title);
                    const totalActivities = itinerary.activities?.length || 0;
                    const completedActivities = itinerary.activities?.filter(a => a.completed).length || 0;
                    const totalCost = itinerary.activities?.reduce((sum, a) => sum + (a.cost || 0), 0) || 0;
                    const budgetAmount = itinerary.budget || totalCost;

                    itinerary.palette = palette;

                    return (
                      <div key={itinerary.id}>
                        {/* ── Colored Itinerary Card ── */}
                        <button
                          onClick={() => setExpandedItineraryId(isExpanded ? null : itinerary.id)}
                          className="w-full text-left active:scale-[0.98] transition-transform"
                        >
                          <div className="rounded-3xl p-5" style={{ backgroundColor: palette.bg }}>

                            {/* Row 1: Title + Status + Menu */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-extrabold leading-tight truncate" style={{ color: palette.text }}>
                                  {itinerary.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(itinerary.status)}`}>
                                    {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                                  </span>
                                  {itinerary.location && (
                                    <span className="text-xs flex items-center gap-1" style={{ color: palette.sub }}>
                                      <MapPin size={12} />
                                      {itinerary.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ItineraryCardDropdown
                                itinerary={itinerary}
                                currentUserId={currentUserId}
                                onEdit={handleEditItinerary}
                                onDelete={handleDeleteItinerary}
                              />
                            </div>

                            {/* Row 2: Date + Participants */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} style={{ color: palette.sub }} />
                                <span className="text-xs font-medium" style={{ color: palette.text }}>
                                  {formatDateRange(itinerary.startDate, itinerary.endDate)}
                                </span>
                              </div>
                              <StackedAvatars 
                                participants={itinerary.participants || []} 
                                members={group?.members || []} 
                                max={4} 
                              />
                            </div>

                            {/* Row 3: Progress */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold" style={{ color: palette.sub }}>
                                  {totalActivities > 0 ? `${completedActivities}/${totalActivities} activities` : 'No activities'}
                                </span>
                                {budgetAmount > 0 && (
                                  <span className="text-xs font-bold" style={{ color: palette.text }}>
                                    {sym}{totalCost.toFixed(2)} / {sym}{budgetAmount.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <ProgressBar
                                percentage={pct}
                                trackColor={`${palette.text}22`}
                                barColor={palette.text}
                              />
                            </div>
                          </div>
                        </button>

                        {/* ── Expanded Details ── */}
                        {isExpanded && (
                          <div className="mx-1 mt-1.5 p-4 bg-gray-50 border-gray-100 rounded-3xl animate-fade-in">
                            
                            {/* Status Update Buttons */}
                            {itinerary.status !== 'cancelled' && itinerary.status !== 'completed' && (
                              <div className="flex gap-2 mb-4">
                                {itinerary.status === 'planned' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(itinerary.id, 'ongoing');
                                    }}
                                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors"
                                  >
                                    Start Trip
                                  </button>
                                )}
                                {itinerary.status === 'ongoing' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(itinerary.id, 'completed');
                                    }}
                                    className="flex-1 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-sm font-bold transition-colors"
                                  >
                                    Complete Trip
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(itinerary.id, 'cancelled');
                                  }}
                                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {/* Activities */}
                            {itinerary.activities && itinerary.activities.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Activities</h4>
                                <div className="space-y-2">
                                  {itinerary.activities.map((activity, idx) => {
                                    const ActivityIcon = ACTIVITY_ICONS[activity.type] || Flag;
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl">
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updatedActivities = [...itinerary.activities];
                                              updatedActivities[idx].completed = !updatedActivities[idx].completed;
                                              handleEditItinerary({
                                                ...itinerary,
                                                activities: updatedActivities
                                              });
                                            }}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                              activity.completed 
                                                ? 'bg-green-500 border-green-500' 
                                                : 'border-gray-300'
                                            }`}
                                          >
                                            {activity.completed && <Check size={12} className="text-white" />}
                                          </button>
                                          <ActivityIcon size={16} className="text-gray-500" />
                                          <div>
                                            <p className={`text-sm ${activity.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                              {activity.title}
                                            </p>
                                            {activity.time && (
                                              <p className="text-xs text-gray-400">{activity.time}</p>
                                            )}
                                          </div>
                                        </div>
                                        {activity.cost > 0 && (
                                          <span className="text-sm font-bold text-gray-700">
                                            {sym}{activity.cost.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {itinerary.notes && (
                              <div className="mb-3">
                                <h4 className="text-sm font-bold text-gray-700 mb-1">Notes</h4>
                                <p className="text-sm text-gray-600 bg-white p-3 rounded-xl">
                                  {itinerary.notes}
                                </p>
                              </div>
                            )}

                            {/* Summary */}
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                              <span className="font-medium">
                                {completedActivities} of {totalActivities} completed
                              </span>
                              {totalCost > 0 && (
                                <span className="font-bold text-gray-700">
                                  Total: {sym}{totalCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create New Itinerary FAB */}
              <div className="px-5 pb-7 pt-3 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingItinerary(null);
                    setTitle('');
                    setLocation('');
                    setStartDate('');
                    setEndDate('');
                    setNotes('');
                    setBudget('');
                    setCurrency('USD');
                    setActivities([]);
                    setError('');
                    setActiveTab('new');
                  }}
                  className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} strokeWidth={2.5} /> Create New Itinerary
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════ NEW ITINERARY TAB (Create/Edit) ══════════════════ */}
          {activeTab === 'new' && (
            <div className="flex flex-col h-full min-h-0">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
                <button
                  onClick={cancelEditing}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <ChevronLeft size={17} className="text-gray-700" />
                </button>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingItinerary ? 'Edit Itinerary' : 'New Itinerary'}
                </h2>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-700" />
                </button>
              </div>

              <Toast />

              <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-2 min-h-0">

                {/* ── Yellow Summary Card ── */}
                <div className="rounded-3xl p-5" style={{ backgroundColor: '#F5E09A' }}>
                  {/* Title */}
                  <input
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setError(''); }}
                    placeholder="Trip title…"
                    className="w-full bg-transparent text-xl font-extrabold text-gray-900 placeholder-gray-500/70 focus:outline-none mb-3 caret-gray-700"
                  />

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={16} className="text-gray-700" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Location (optional)"
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-500/70 focus:outline-none"
                    />
                  </div>

                  {/* Dates */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Start</p>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white/80 rounded-xl text-sm font-medium border border-gray-200 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">End (optional)</p>
                      <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full px-3 py-2 bg-white/80 rounded-xl text-sm font-medium border border-gray-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Member Selection */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Participants ({participants.filter(p => p.selected).length})
                    </p>
                    <MultiSelectUserDropdown
                      members={group?.members || []}
                      selectedUsers={participants}
                      onToggleUser={toggleParticipant}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className="bg-gray-50 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-gray-900">Budget</h3>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Estimated Budget</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {getCurrencySymbol(currency)}
                        </span>
                        <input
                          type="number"
                          value={budget}
                          onChange={e => setBudget(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="w-full pl-8 pr-3 py-2.5 bg-white rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      </div>
                    </div>
                    <div className="w-32">
                      <p className="text-xs text-gray-500 mb-1">Currency</p>
                      <CustomDropdown
                        options={CURRENCIES.map(c => ({
                          value: c.value,
                          label: `${c.flag} ${c.label}`,
                          currency: c
                        }))}
                        value={currency}
                        onChange={setCurrency}
                        placeholder="Currency"
                        icon={null}
                      />
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div className="bg-gray-50 rounded-3xl p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Activities</h3>
                  
                  {/* Add Activity */}
                  <div className="space-y-2 mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newActivity}
                        onChange={e => setNewActivity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addActivity()}
                        placeholder="Add an activity..."
                        className="flex-1 px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                      <button
                        onClick={addActivity}
                        disabled={!newActivity.trim()}
                        className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    
                    {newActivity && (
                      <div className="flex gap-2">
                        <input
                          type="time"
                          value={newActivityTime}
                          onChange={e => setNewActivityTime(e.target.value)}
                          className="px-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none"
                        />
                        <select
                          value={newActivityType}
                          onChange={e => setNewActivityType(e.target.value)}
                          className="px-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="sightseeing">Sightseeing</option>
                          <option value="transport">Transport</option>
                          <option value="other">Other</option>
                        </select>
                        <input
                          type="number"
                          value={newActivityCost}
                          onChange={e => setNewActivityCost(e.target.value)}
                          placeholder={`${getCurrencySymbol(currency)}0`}
                          min="0"
                          step="0.01"
                          className="w-24 px-3 py-2 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Activity List */}
                  {activities.length > 0 && (
                    <div className="space-y-2">
                      {activities.map((activity, index) => (
                        <ActivityItem
                          key={activity.id}
                          activity={activity}
                          index={index}
                          onUpdate={updateActivity}
                          onRemove={removeActivity}
                          palette={{ text: '#000000', sub: '#666666' }}
                          currency={currency}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="bg-gray-50 rounded-3xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add any notes or details..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="px-5 pb-7 pt-4 flex-shrink-0">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    editingItinerary ? 'Update Itinerary' : 'Create Itinerary'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
        `}</style>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </>
  );
}