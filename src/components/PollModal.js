'use client';

import { useState, useEffect,useRef  } from 'react';
import {
  X, Plus, Check, CheckCircle, Clock, AlertCircle,
  ChevronLeft, BarChart, Users, Lock, Globe,
  Calendar, Trash2, Edit2, MoreVertical, UserCircle
} from 'lucide-react';
import { BeanHead } from 'beanheads';

const CARD_PALETTES = [
  { bg: '#FF8C78', text: '#1a0a08', sub: '#7a3028' },
  { bg: '#FFB8C6', text: '#1a0810', sub: '#7a3050' },
  { bg: '#7DCFCC', text: '#082020', sub: '#1a5a58' },
  { bg: '#F5E09A', text: '#1a1408', sub: '#6a5020' },
  { bg: '#A8D8FF', text: '#081220', sub: '#204870' },
  { bg: '#B8E8B0', text: '#081408', sub: '#205820' },
  { bg: '#E0C8F8', text: '#120820', sub: '#503878' },
  { bg: '#FFD4A0', text: '#1a0e04', sub: '#7a4818' },
];

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

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const diffDays = Math.floor((new Date() - d) / 86400000);
  if (diffDays === 0) return `Today, ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
};

// Progress Bar Component
const ProgressBar = ({ percentage = 0, color = '#000000' }) => {
  const pct = Math.min(Math.max(percentage, 0), 100);
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
};

// Poll Card Dropdown
const PollCardDropdown = ({ poll, currentUserId, onEdit, onClose, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isCreator = poll.createdBy === currentUserId;

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
      >
        <MoreVertical size={16} className="text-gray-600" />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-1 w-40 bg-white rounded-2xl shadow-lg border border-gray-200 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setIsOpen(false);
              onEdit(poll);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            <Edit2 size={14} className="text-gray-500" />
            Edit Poll
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onDelete(poll);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-red-50 transition-colors text-sm font-medium text-red-600 border-t border-gray-100"
          >
            <Trash2 size={14} className="text-red-500" />
            Delete Poll
          </button>
        </div>
      )}
    </div>
  );
};

export default function PollModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  onCreatePoll,
  onVote,
  onClosePoll,
  onDeletePoll,
  polls = [],
  loading = false
}) {
  const [activeTab, setActiveTab] = useState('polls');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  
  // New Poll Form State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresIn, setExpiresIn] = useState('24h');
  
  // Editing State
  const [editingPoll, setEditingPoll] = useState(null);
  
  // Expanded Poll State
  const [expandedPollId, setExpandedPollId] = useState(null);
  
  // Vote State
  const [selectedVotes, setSelectedVotes] = useState({});

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultipleVotes(false);
    setIsAnonymous(false);
    setExpiresIn('24h');
    setEditingPoll(null);
    setError('');
  };

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleEditPoll = (poll) => {
    setEditingPoll(poll);
    setQuestion(poll.question);
    setOptions(poll.options.map(opt => opt.text));
    setAllowMultipleVotes(poll.allowMultipleVotes || false);
    setIsAnonymous(poll.isAnonymous || false);
    setActiveTab('create');
  };

  const handleDeletePoll = async (poll) => {
    if (window.confirm(`Are you sure you want to delete "${poll.question}"?`)) {
      try {
        await onDeletePoll(poll.pollId);
        triggerSuccess('Poll deleted');
      } catch (err) {
        setError(err.message || 'Failed to delete poll');
      }
    }
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Please enter at least 2 options');
      return;
    }

    try {
      if (editingPoll) {
        // For now, we'll just close and create new (simplified)
        await onClosePoll(editingPoll.pollId);
      }
      
      // Calculate expiry
      let expiresAt = null;
      if (expiresIn !== 'never') {
        const hours = parseInt(expiresIn);
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }

      await onCreatePoll({
        question: question.trim(),
        options: validOptions,
        allowMultipleVotes,
        isAnonymous,
        expiresAt
      });

      triggerSuccess(editingPoll ? 'Poll updated' : 'Poll created');
      resetForm();
      setActiveTab('polls');
    } catch (err) {
      setError(err.message || 'Failed to create poll');
    }
  };

  const handleVote = async (pollId, optionId) => {
    const poll = polls.find(p => p.pollId === pollId);
    if (!poll) return;

    let votes = [];
    
    if (poll.allowMultipleVotes) {
      // Toggle selection
      const current = selectedVotes[pollId] || [];
      if (current.includes(optionId)) {
        votes = current.filter(id => id !== optionId);
      } else {
        votes = [...current, optionId];
      }
      setSelectedVotes(prev => ({ ...prev, [pollId]: votes }));
      
      // If we have votes, submit
      if (votes.length > 0) {
        try {
          await onVote(pollId, votes);
          triggerSuccess('Vote recorded');
          // Clear selection
          setSelectedVotes(prev => ({ ...prev, [pollId]: [] }));
        } catch (err) {
          setError(err.message || 'Failed to vote');
        }
      }
    } else {
      // Single vote - submit immediately
      try {
        await onVote(pollId, [optionId]);
        triggerSuccess('Vote recorded');
      } catch (err) {
        setError(err.message || 'Failed to vote');
      }
    }
  };

  const handleClosePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to close this poll?')) {
      try {
        await onClosePoll(pollId);
        triggerSuccess('Poll closed');
      } catch (err) {
        setError(err.message || 'Failed to close poll');
      }
    }
  };

  const calculatePercentage = (option, totalVotes) => {
    if (totalVotes === 0) return 0;
    return (option.votes?.length || 0) / totalVotes * 100;
  };

  const hasUserVoted = (poll, userId) => {
    return poll.voters?.includes(userId) || false;
  };

  const getTotalVotes = (poll) => {
    return poll.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;
  };

  const Toast = () => (
    <div className="px-5 flex-shrink-0 mb-2">
      {showSuccess && (
        <div className="px-4 py-3 bg-black rounded-2xl text-white text-sm flex items-center gap-2 animate-fade-in">
          <BarChart size={15} strokeWidth={2.5} />
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 flex-shrink-0">
          <button
            onClick={() => {
              if (activeTab === 'polls') {
                onClose();
              } else {
                setActiveTab('polls');
                resetForm();
              }
            }}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={17} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {activeTab === 'polls' ? 'Polls' : editingPoll ? 'Edit Poll' : 'Create Poll'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-700" />
          </button>
        </div>

        <Toast />

        {/* Filter Pills (only show in polls tab) */}
        {activeTab === 'polls' && (
          <div className="flex gap-2 px-5 pb-4 flex-shrink-0">
            <button
              onClick={() => setActiveTab('polls')}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'polls'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart size={14} />
                <span>All Polls ({polls.length})</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                resetForm();
              }}
              className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus size={14} />
                <span>New Poll</span>
              </div>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {activeTab === 'polls' ? (
            // POLLS LIST
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : polls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
                    <BarChart size={36} className="text-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">No polls yet</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Create your first poll to get feedback
                    </p>
                  </div>
                </div>
              ) : (
                polls.map((poll) => {
                  const isExpanded = expandedPollId === poll.pollId;
                  const userVoted = hasUserVoted(poll, currentUserId);
                  const totalVotes = getTotalVotes(poll);
                  const palette = getCardPalette(poll.question);

                  return (
                    <div key={poll.pollId}>
                      {/* Poll Card */}
                      <div
                        className="rounded-3xl p-5 cursor-pointer active:scale-[0.98] transition-transform"
                        style={{ backgroundColor: palette.bg }}
                        onClick={() => setExpandedPollId(isExpanded ? null : poll.pollId)}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-extrabold leading-tight" style={{ color: palette.text }}>
                              {poll.question}
                            </h3>
                            <p className="text-xs mt-1 font-medium" style={{ color: palette.sub }}>
                              {formatDate(poll.createdAt)} • {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <PollCardDropdown
                            poll={poll}
                            currentUserId={currentUserId}
                            onEdit={handleEditPoll}
                            onDelete={handleDeletePoll}
                          />
                        </div>

                        {/* Options Preview */}
                        <div className="space-y-2 mb-3">
                          {poll.options.slice(0, 3).map((opt) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-black/40" />
                              </div>
                              <span className="text-sm line-clamp-1" style={{ color: palette.text }}>
                                {opt.text}
                              </span>
                            </div>
                          ))}
                          {poll.options.length > 3 && (
                            <div className="text-xs font-medium" style={{ color: palette.sub }}>
                              +{poll.options.length - 3} more options
                            </div>
                          )}
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center gap-3">
                          {!poll.isActive && (
                            <span className="text-xs bg-black/20 px-2 py-1 rounded-full" style={{ color: palette.text }}>
                              Closed
                            </span>
                          )}
                          {poll.isAnonymous && (
                            <span className="text-xs bg-black/10 px-2 py-1 rounded-full flex items-center gap-1" style={{ color: palette.sub }}>
                              <Lock size={10} /> Anonymous
                            </span>
                          )}
                          {userVoted && (
                            <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full flex items-center gap-1 text-green-800">
                              <Check size={10} /> Voted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Poll */}
                      {isExpanded && (
                        <div className="mx-1 mt-1.5 p-4 bg-gray-50 rounded-3xl animate-fade-in">
                          {/* All Options */}
                          <div className="space-y-4 mb-4">
                            {poll.options.map((opt) => {
                              const percentage = calculatePercentage(opt, totalVotes);
                              const isSelected = selectedVotes[poll.pollId]?.includes(opt.id);
                              
                              return (
                                <div key={opt.id} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 flex-1">
                                      {poll.isActive && !userVoted && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleVote(poll.pollId, opt.id);
                                          }}
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected
                                              ? 'border-black bg-black'
                                              : 'border-gray-300'
                                          }`}
                                        >
                                          {isSelected && <Check size={12} className="text-white" />}
                                        </button>
                                      )}
                                      <span className="font-medium text-gray-800">{opt.text}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">
                                      {opt.votes?.length || 0} ({Math.round(percentage)}%)
                                    </span>
                                  </div>
                                  <ProgressBar percentage={percentage} color={palette.text} />
                                </div>
                              );
                            })}
                          </div>

                          {/* Voters List (if not anonymous) */}
                          {!poll.isAnonymous && totalVotes > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-500 mb-2">
                                Who voted:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {poll.options.map(opt => (
                                  opt.votes?.length > 0 && (
                                    <div key={`voters-${opt.id}`} className="text-xs">
                                      <span className="font-medium text-gray-700">{opt.text}:</span>{' '}
                                      <span className="text-gray-500">{opt.votes.length} vote{opt.votes.length !== 1 ? 's' : ''}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer Actions */}
                          {poll.isActive && !userVoted && poll.allowMultipleVotes && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2">
                                You can vote for multiple options
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const votes = selectedVotes[poll.pollId] || [];
                                  if (votes.length > 0) {
                                    handleVote(poll.pollId, votes);
                                  }
                                }}
                                disabled={!selectedVotes[poll.pollId]?.length}
                                className="w-full py-3 bg-black text-white rounded-2xl text-sm font-bold disabled:opacity-50"
                              >
                                Submit Vote ({selectedVotes[poll.pollId]?.length || 0})
                              </button>
                            </div>
                          )}

                          {/* Admin/ Creator Actions */}
                          {(poll.createdBy === currentUserId || 
                            group?.members?.find(m => m.userId === currentUserId)?.role === 'admin') && 
                            poll.isActive && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClosePoll(poll.pollId);
                                }}
                                className="w-full py-3 bg-red-500 text-white rounded-2xl text-sm font-bold"
                              >
                                Close Poll
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // CREATE POLL FORM
            <div className="space-y-5">
              {/* Question Input */}
              <div className="rounded-3xl p-5" style={{ backgroundColor: '#F5E09A' }}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-transparent text-xl font-extrabold text-gray-900 placeholder-gray-500/70 focus:outline-none mb-4 caret-gray-700"
                />

                {/* Options */}
                <div className="space-y-3">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-700">{index + 1}</span>
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-500/50 focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        >
                          <X size={14} className="text-red-600" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 10 && (
                  <button
                    onClick={handleAddOption}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-black/20 rounded-full text-sm font-medium text-gray-800 transition-colors"
                  >
                    <Plus size={14} /> Add Option
                  </button>
                )}
              </div>

              {/* Settings */}
              <div className="space-y-3">
                {/* Allow Multiple Votes */}
                <div className="flex items-center justify-between p-4 bg-gray-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Allow Multiple Votes</p>
                      <p className="text-xs text-gray-500">Users can vote for multiple options</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowMultipleVotes}
                      onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                {/* Anonymous Poll */}
                <div className="flex items-center justify-between p-4 bg-gray-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Lock size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Anonymous Poll</p>
                      <p className="text-xs text-gray-500">Votes are hidden from others</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-black peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>

                {/* Expiry */}
                <div className="flex items-center justify-between p-4 bg-gray-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Calendar size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Poll Expiry</p>
                      <p className="text-xs text-gray-500">When should this poll close?</p>
                    </div>
                  </div>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/20"
                  >
                    <option value="1h">1 hour</option>
                    <option value="6h">6 hours</option>
                    <option value="12h">12 hours</option>
                    <option value="24h">24 hours</option>
                    <option value="48h">2 days</option>
                    <option value="168h">7 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-black hover:bg-gray-900 active:scale-[0.98] text-white rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  editingPoll ? 'Update Poll' : 'Create Poll'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Close Button for Mobile */}
        {activeTab === 'polls' && (
          <div className="px-5 pb-7 pt-3 flex-shrink-0 sm:hidden">
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-800 rounded-2xl font-bold text-[15px] transition-all"
            >
              Close
            </button>
          </div>
        )}

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </div>
  );
}